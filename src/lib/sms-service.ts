import twilio from 'twilio'

export interface SMSOptions {
  to: string
  message: string
}

export class SMSService {
  private static instance: SMSService
  private twilioClient: twilio.Twilio | null = null

  private constructor() {}

  static getInstance(): SMSService {
    if (!SMSService.instance) {
      SMSService.instance = new SMSService()
    }
    return SMSService.instance
  }

  private getTwilioClient() {
    if (this.twilioClient) {
      return this.twilioClient
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_FROM_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio configuration not found. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER environment variables.')
    }

    this.twilioClient = twilio(accountSid, authToken)
    return this.twilioClient
  }

  async sendSMS(options: SMSOptions): Promise<void> {
    try {
      const client = this.getTwilioClient()
      const fromNumber = process.env.TWILIO_FROM_NUMBER!

      await client.messages.create({
        body: options.message,
        from: fromNumber,
        to: options.to
      })

      console.log(`SMS sent successfully to ${options.to}`)
    } catch (error) {
      console.error('Error sending SMS:', error)
      throw new Error('Failed to send SMS')
    }
  }

  async sendWhatsApp(options: SMSOptions): Promise<void> {
    try {
      const client = this.getTwilioClient()
      const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || `whatsapp:${process.env.TWILIO_FROM_NUMBER}`

      await client.messages.create({
        body: options.message,
        from: `whatsapp:${fromNumber}`,
        to: `whatsapp:${options.to}`
      })

      console.log(`WhatsApp message sent successfully to ${options.to}`)
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      throw new Error('Failed to send WhatsApp message')
    }
  }
}

export const smsService = SMSService.getInstance()