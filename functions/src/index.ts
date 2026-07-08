import { initializeApp } from 'firebase-admin/app'

initializeApp()

export { captureInboxItem } from './captureInboxItem.js'
export { pushScheduleToCalDAV } from './pushScheduleToCalDAV.js'
