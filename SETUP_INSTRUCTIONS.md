# Setting Up Supabase Database

## For New Projects (Fresh Database)

If you're setting up a brand new Supabase project, follow these steps:

1. **Go to your Supabase Dashboard**
   - Navigate to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New query"** button

3. **Copy and Run the Schema**
   - Open the `supabase-schema.sql` file from this project
   - Copy the **entire contents** of the file
   - Paste it into the SQL Editor
   - Click **"Run"** (or press `Cmd/Ctrl + Enter`)
   - You should see: "Success. No rows returned"

That's it! The schema includes:
- All tables (app_users, households, household_members, movies)
- Email column in app_users (for inviting users)
- All indexes
- All Row Level Security (RLS) policies

## For Existing Projects (Adding Email Column)

If you already have the database set up and just need to add the email column:

1. **Go to SQL Editor** in Supabase
2. **Run the migration script**:
   - Open `add-email-to-app-users.sql`
   - Copy and paste into SQL Editor
   - Click "Run"

This will:
- Add the email column to app_users
- Create an index for faster lookups
- Update existing users with their email from auth.users

## Verify It Worked

1. Go to **Table Editor** in Supabase
2. Click on `app_users` table
3. You should see an `email` column
4. Check that your user has an email populated

## Troubleshooting

- **"column already exists"**: The email column is already there, you're good!
- **"relation does not exist"**: You need to run the full schema first
- **No email values**: Run the UPDATE statement from `add-email-to-app-users.sql` to populate existing users

