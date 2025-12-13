# Supabase Setup Guide for Movie Jar

This guide will walk you through setting up your Supabase project for the Movie Jar app.

## Step 1: Create a Supabase Account and Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account (or log in if you already have one)
3. Click **"New Project"**
4. Fill in the project details:
   - **Name**: `movie-jar` (or any name you prefer)
   - **Database Password**: Create a strong password (save this somewhere safe!)
   - **Region**: Choose the region closest to you
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"** and wait for it to initialize (takes 1-2 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click on the **Settings** icon (⚙️) in the left sidebar
2. Click on **"API"** in the settings menu
3. You'll see two important values:
   - **Project URL** - This is your `VITE_SUPABASE_URL`
   - **anon public** key - This is your `VITE_SUPABASE_ANON_KEY`
4. Copy both values and add them to your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 3: Set Up the Database Schema

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar
2. Click **"New query"**
3. Open the `supabase-schema.sql` file from this project
4. Copy the **entire contents** of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press `Cmd/Ctrl + Enter`)
7. You should see a success message: "Success. No rows returned"

This will create:
- ✅ All required tables (`app_users`, `households`, `household_members`, `movies`)
- ✅ Indexes for better performance
- ✅ Row Level Security (RLS) policies for data protection

## Step 4: Configure Authentication

1. In the Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** is enabled (it should be by default)
3. Under **Email Auth**, you can configure:
   - **Enable email confirmations**: For production, enable this. For development, you can disable it to test faster
   - **Secure email change**: Leave enabled
4. (Optional) Configure email templates under **Authentication** → **Email Templates** if you want custom emails

## Step 5: Verify Your Setup

1. Go to **Table Editor** in the left sidebar
2. You should see these tables:
   - `app_users`
   - `households`
   - `household_members`
   - `movies`
3. Go to **Authentication** → **Policies**
4. You should see RLS policies enabled for all tables

## Step 6: Test the Connection

1. Make sure your `.env` file has the correct values
2. Start your development server:
   ```bash
   npm run dev
   ```
3. Try signing up with a test email
4. If everything works, you should be able to create a household and add movies!

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure your `.env` file is in the root directory
- Check that the variable names start with `VITE_`
- Restart your dev server after changing `.env`

### "relation does not exist" error
- Make sure you ran the entire SQL schema file
- Check the SQL Editor for any error messages
- Verify tables exist in Table Editor

### Authentication not working
- Check that Email provider is enabled in Authentication → Providers
- Verify RLS policies are created (Authentication → Policies)
- Check browser console for specific error messages

### RLS policy errors
- Make sure all RLS policies from the schema were created successfully
- Check that policies allow the operations you're trying to perform
- You can temporarily disable RLS for testing (not recommended for production)

## What's Set Up

After completing these steps, you'll have:

✅ **Database Tables**:
- `app_users` - User profiles linked to auth
- `households` - Shared household containers
- `household_members` - User-household relationships
- `movies` - Movie data with metadata

✅ **Security**:
- Row Level Security (RLS) enabled on all tables
- Policies that ensure users can only access their own data
- Policies that allow users to manage their households

✅ **Authentication**:
- Email/password authentication ready
- User profiles automatically created on signup

## Next Steps

1. Get your OMDb API key from [omdbapi.com](http://www.omdbapi.com/apikey.aspx)
2. Add it to your `.env` file as `VITE_OMDB_API_KEY`
3. Start building your movie collection! 🎬
