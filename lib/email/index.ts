// Unified email interface - CURRENTLY USING SENDGRID
// import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded } from './resend'

import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded, sendAdminOrderNotification } from './sendgrid'

// For Postmark, uncomment and comment out SendGrid:
// import { sendOrderConfirmation, sendOrderShipped, sendOrderCancelled, sendOrderRefunded } from './postmark'

export {
  sendOrderConfirmation,
  sendOrderShipped,
  sendOrderCancelled,
  sendOrderRefunded,
  sendAdminOrderNotification
}