import twilio from 'twilio';
import { json } from '@sveltejs/kit';
import { formatPhoneNumber } from '$lib/utils/auth.js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client;
try {
  if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
  }
} catch (error) {
  console.error('Twilio initialization error:', error);
}

export async function POST({ request }) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    if (!client || !verifyServiceSid) {
      return json({ 
        error: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.' 
      }, { status: 500 });
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      const verification = await client.verify.v2
        .services(verifyServiceSid)
        .verifications
        .create({ 
          to: formattedPhone, 
          channel: 'sms' 
        });
      
      return json({ success: true, message: 'Verification code sent' });
    } catch (twilioError) {
      console.error('Twilio Verify send error:', twilioError);
      return json({ 
        error: 'Failed to send SMS. Please check the phone number and try again.' 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Send SMS error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 