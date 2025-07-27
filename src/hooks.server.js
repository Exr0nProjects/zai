// Debug environment variables on server startup
import { dev } from '$app/environment';

console.log('🔧 Server hooks - Environment check:', {
  dev,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'present' : 'missing',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'present' : 'missing', 
  TWILIO_VERIFY_SERVICE_SID: process.env.TWILIO_VERIFY_SERVICE_SID ? 'present' : 'missing'
}); 