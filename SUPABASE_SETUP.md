# Supabase Database Setup Guide

## Option 1: Via Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/isvuolzqqjutrfytebtl/sql/new

2. **Run the SQL migrations**
   - Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
   - Click "Run" to create all tables and functions
   - Then copy and paste the contents of `supabase/migrations/002_demo_data.sql`
   - Click "Run" to insert demo users and announcements

3. **Verify the setup**
   - Go to Table Editor: https://supabase.com/dashboard/project/isvuolzqqjutrfytebtl/editor
   - You should see all the tables created
   - Check the `users` table - it should have 3 demo users

## Option 2: Via Supabase CLI (Requires Database Password)

1. **Get your database password**
   - Go to: https://supabase.com/dashboard/project/isvuolzqqjutrfytebtl/settings/database
   - Find or reset your database password

2. **Link your project**
   ```bash
   supabase link --project-ref isvuolzqqjutrfytebtl
   # Enter your database password when prompted
   ```

3. **Run migrations**
   ```bash
   supabase db push
   ```

## Login Credentials

Once the database is set up, you can login with:

### Customer Portal
- **URL:** http://localhost:5173/login
- **Email:** customer@example.com
- **Password:** Password123!

### Staff Portal
- **URL:** http://localhost:5173/staff-login
- **Email:** staff@freightshark.com
- **Password:** Password123!

### Admin Portal
- **URL:** http://localhost:5173/admin-login
- **Email:** admin@freightshark.com
- **Password:** Password123!

## Troubleshooting

### If tables already exist
- The SQL scripts include `ON CONFLICT` clauses, so they're safe to run multiple times
- If you want a clean slate, the first script drops all existing tables

### If login doesn't work
- Make sure the users table has the demo users
- Check that the password_hash column contains the bcrypt hash
- The app will fall back to localStorage if the backend isn't running

### Backend Connection
- The backend server needs to be running for full functionality
- Start it with: `cd backend && npm run dev`
- If the backend isn't available, the app uses localStorage as a fallback

## Current Status
✅ Database schema created
✅ Demo users and data ready
✅ Frontend authentication with fallback
✅ Backend API structure ready
⚠️ Need correct database password for CLI access