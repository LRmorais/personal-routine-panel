import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { onRequest } from 'firebase-functions/v2/https'
import { ALEX_UID } from './config.js'
import { shortcutWebhookSecret } from './secrets.js'

export const captureInboxItem = onRequest(
  { secrets: [shortcutWebhookSecret], region: 'southamerica-east1' },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed')
      return
    }

    if (req.get('X-Webhook-Secret') !== shortcutWebhookSecret.value()) {
      res.status(401).send('Unauthorized')
      return
    }

    const text = typeof req.body?.text === 'string' ? req.body.text.trim() : ''
    if (!text) {
      res.status(400).send('Missing "text"')
      return
    }

    await getFirestore().collection('users').doc(ALEX_UID).collection('inboxItems').add({
      text,
      status: 'open',
      source: 'shortcut',
      createdAt: FieldValue.serverTimestamp(),
    })

    res.status(201).send('OK')
  },
)
