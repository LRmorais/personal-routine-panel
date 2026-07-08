import { defineSecret } from 'firebase-functions/params'

export const shortcutWebhookSecret = defineSecret('SHORTCUT_WEBHOOK_SECRET')
export const icloudUsername = defineSecret('ICLOUD_USERNAME')
export const icloudAppPassword = defineSecret('ICLOUD_APP_PASSWORD')
