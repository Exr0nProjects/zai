import twilio from 'twilio';
import { json } from '@sveltejs/kit';
import { formatPhoneNumber } from '$lib/utils/auth.js';
import { supabase } from '$lib/supabase.js';

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
    const { phoneNumber, code } = await request.json();
    
    if (!phoneNumber || !code) {
      return json({ error: 'Phone number and verification code are required' }, { status: 400 });
    }
    
    if (!client || !verifyServiceSid) {
      return json({ 
        error: 'SMS service not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_VERIFY_SERVICE_SID environment variables.' 
      }, { status: 500 });
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    try {
      const verificationCheck = await client.verify.v2
        .services(verifyServiceSid)
        .verificationChecks
        .create({ 
          to: formattedPhone, 
          code: code 
        });
      
      if (verificationCheck.status !== 'approved') {
        return json({ error: 'Invalid verification code' }, { status: 400 });
      }
      
      // Verification successful, create/get user
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('phone', formattedPhone)
          .single();
        
        let user;
        if (existingUser) {
          user = existingUser;
        } else {
          const { data: newUser, error } = await supabase
            .from('users')
            .insert({ phone: formattedPhone, created_at: new Date().toISOString() })
            .select()
            .single();
          
          if (error) {
            console.error('Supabase user creation error:', error);
            user = { id: formattedPhone, phone: formattedPhone };
          } else {
            user = newUser;
          }
        }
        
        // Simple token (phone number + timestamp)
        const token = `${formattedPhone}:${Date.now()}`;
        
        return json({ 
          success: true, 
          token,
          user: { id: user.id || formattedPhone, phone: formattedPhone }
        });
        
      } catch (dbError) {
        console.error('Database error:', dbError);
        const token = `${formattedPhone}:${Date.now()}`;
        
        return json({ 
          success: true, 
          token,
          user: { id: formattedPhone, phone: formattedPhone }
        });
      }
      
    } catch (twilioError) {
      console.error('Twilio Verify check error:', twilioError);
      return json({ 
        error: 'Invalid verification code' 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Verify SMS error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
} 