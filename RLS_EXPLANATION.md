# Row Level Security (RLS) Explained

## 🔒 **What is RLS?**
Row Level Security is like having a **bouncer check every single row** in your database before letting someone see or change it.

## 🏠 **Real-World Analogy:**
Think of your database like an apartment building:
- **Table-level security** = Building-wide rules ("only residents can enter")  
- **Row-level security** = Apartment-level rules ("you can only enter YOUR apartment")

## ⚙️ **How RLS Works:**

### **Without RLS:**
```sql
-- User can see ALL notes in the table
SELECT * FROM notes;  -- Returns everyone's notes! 😱
```

### **With RLS:**
```sql
-- User can only see their own notes
SELECT * FROM notes;  -- Returns only YOUR notes! 🔒
```

## 🛡️ **RLS Policies in Action:**

### **1. Policy Creation:**
```sql
CREATE POLICY "users_own_data" ON notes
  FOR SELECT USING (user_id = auth.uid());
```
Translation: *"Users can only SELECT rows where the user_id matches their authenticated ID"*

### **2. What Happens:**
When you run `SELECT * FROM notes`, PostgreSQL automatically adds:
```sql
SELECT * FROM notes WHERE user_id = 'your-actual-user-id';
```

## 🔧 **Our Current Setup:**

### **Problem:**
We're using simple phone-based auth, but RLS expects proper JWT tokens with user claims.

### **Temporary Solution:**
```sql
-- Allow all operations for now (less secure but functional)
CREATE POLICY "Allow users to manage own notes" ON notes
  FOR ALL USING (true) WITH CHECK (true);
```

### **Production Solution (Future):**
```sql
-- Proper JWT-based policy
CREATE POLICY "users_own_notes" ON notes
  FOR ALL USING ("user" = auth.jwt() ->> 'phone');
```

## 🎯 **Key Benefits:**
- **Data isolation** - Users can't see each other's data
- **Automatic filtering** - No need to add WHERE clauses everywhere  
- **Database-level security** - Can't be bypassed by buggy application code
- **Performance** - PostgreSQL optimizes queries with RLS

## 🚀 **For zai:**
Right now we have RLS enabled but with permissive policies. We filter by user phone number in our application code. This gives us the functionality while keeping setup simple.

In the future, we can upgrade to proper JWT-based RLS for maximum security. 