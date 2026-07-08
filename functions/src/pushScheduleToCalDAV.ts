import { getFirestore } from 'firebase-admin/firestore'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import ical from 'ical-generator'
import { createDAVClient } from 'tsdav'
import { ALEX_UID } from './config.js'
import { icloudAppPassword, icloudUsername } from './secrets.js'

type ScheduleBlock = {
  title: string
  date: string
  startTime: string
  endTime: string
}

// Brazil has observed a fixed UTC-3 offset (no DST) since 2019.
function blockToDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00-03:00`)
}

export const pushScheduleToCalDAV = onCall(
  { secrets: [icloudUsername, icloudAppPassword], region: 'southamerica-east1' },
  async (request) => {
    if (request.auth?.uid !== ALEX_UID) {
      throw new HttpsError('permission-denied', 'Not authorized')
    }

    const db = getFirestore()
    const blocksSnap = await db
      .collection('users')
      .doc(ALEX_UID)
      .collection('scheduleBlocks')
      .where('date', '==', request.data?.date)
      .where('pushedToCalDAV', '!=', true)
      .get()

    if (blocksSnap.empty) {
      return { pushed: 0 }
    }

    const client = await createDAVClient({
      serverUrl: 'https://caldav.icloud.com',
      credentials: { username: icloudUsername.value(), password: icloudAppPassword.value() },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    })
    const calendars = await client.fetchCalendars()
    const calendar = calendars[0]
    if (!calendar) throw new HttpsError('failed-precondition', 'No iCloud calendar found')

    let pushed = 0
    for (const doc of blocksSnap.docs) {
      const block = doc.data() as ScheduleBlock
      const cal = ical({ name: 'Ritmo' })
      const event = cal.createEvent({
        start: blockToDate(block.date, block.startTime),
        end: blockToDate(block.date, block.endTime),
        summary: block.title,
      })

      const filename = `ctrl-routine-${doc.id}.ics`
      await client.createCalendarObject({ calendar, filename, iCalString: cal.toString() })

      await doc.ref.update({ pushedToCalDAV: true, caldavUid: event.id() })
      pushed++
    }

    return { pushed }
  },
)
