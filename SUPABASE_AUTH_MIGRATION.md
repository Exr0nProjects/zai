# Migration to Supabase Auth

## Why Switch?
- ✅ Proper JWT tokens with user claims (no more RLS headaches)
- ✅ Built-in session management and token refresh
- ✅ Can reuse existing Twilio credentials
- ✅ Simpler, more secure code
- ✅ Automatic RLS integration with `auth.uid()`

## Migration Steps:

### 1. Enable Supabase Auth (5 min)
In Supabase Dashboard:
- Go to Authentication > Providers
- Enable "Phone" provider
- Configure Twilio: Account SID, Auth Token, Verify Service SID

### 2. Update Database Schema (2 min)
```sql
-- Update notes table to use Supabase auth.uid()
ALTER TABLE notes ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Copy phone numbers to new column (migration script)
UPDATE notes SET user_id = (
  SELECT id FROM auth.users WHERE phone = notes.user
);

-- Drop old user column once migration is complete
-- ALTER TABLE notes DROP COLUMN "user";

-- Update RLS policies to use proper auth
DROP POLICY "Allow users to manage own notes" ON notes;
CREATE POLICY "Users own notes" ON notes
  FOR ALL USING (auth.uid() = user_id);
```

### 3. Replace Auth Code (10 min)
Replace custom auth with Supabase calls:
- `signInWithOtp({ phone })` instead of custom Twilio
- `verifyOtp({ phone, token, type: 'sms' })` instead of custom verification
- Use `supabase.auth.onAuthStateChange()` for session management

### 4. Cleanup (5 min)
- Remove custom auth files
- Remove Twilio dependencies
- Simplify auth store
- Update environment variables

## Result:
- 🔥 ~200 lines of custom auth code → ~50 lines
- 🔒 Proper JWT tokens with RLS working perfectly
- 🚀 More secure and maintainable
- 💰 Same Twilio costs, better functionality

## Time Investment: ~25 minutes for huge improvements 