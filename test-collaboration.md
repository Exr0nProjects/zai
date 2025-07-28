# 🧪 Quick Collaboration Test

## Prerequisites
- [ ] Supabase project created with SQL script
- [ ] Phone auth configured with Twilio
- [ ] .env file with correct credentials
- [ ] App running with `bun run dev`

## Test Steps

### 1. First User Setup
1. Open `http://localhost:5174`
2. Login with phone: `+1234567890`
3. Type: "Hello from User 1!"
4. Create a todo list with: "Task from User 1"

### 2. Second User Setup  
1. Open **incognito/private browser**
2. Go to `http://localhost:5174`
3. Login with different phone: `+1987654321`
4. Should see User 1's content immediately ✅

### 3. Real-time Collaboration Test
1. **User 1**: Type "User 1 typing..."
2. **User 2**: Should see it appear in real-time ✅
3. **User 2**: Add "User 2 response!"
4. **User 1**: Should see User 2's text ✅
5. **Both**: Try typing simultaneously - no conflicts ✅

### 4. Feature Testing
- [ ] Todo checkboxes sync between users
- [ ] Timeline markers appear for both users
- [ ] Search works in both windows
- [ ] Pin button navigates for both users

### 5. Persistence Test
1. Close both browsers
2. Reopen and login again
3. All content should persist ✅

## 🎉 Success!
If all tests pass, your serverless collaborative editor is working perfectly!

## 🐛 If Something Fails
1. Check browser console for errors
2. Check Supabase logs in Dashboard  
3. Verify Realtime is enabled for documents table
4. Confirm phone auth + Twilio setup
5. Verify .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY 