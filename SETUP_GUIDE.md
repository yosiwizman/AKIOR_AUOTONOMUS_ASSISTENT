# AKIOR Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Your Supabase Service Role Key

1. **Open this link**: https://supabase.com/dashboard/project/ruftuoilatlzniuasoza/settings/api
2. Scroll down to **Project API keys**
3. Find the **`service_role`** key (it's a long token starting with `eyJ...`)
4. Click the **Copy** button next to it

### Step 2: Add the Key to Your Local Environment

1. Open the `.env.local` file in your project root
2. Find the line: `SUPABASE_SERVICE_ROLE_KEY=`
3. Paste your service role key after the `=` sign
4. Save the file

Example:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NTE3MSwiZXhwIjoyMDg1MjQxMTcxfQ...
```

### Step 3: Restart Your Development Server

Click the **Restart** button in the Dyad interface, or run:
```bash
npm run dev
```

### Step 4: Configure Vercel (For Deployment)

1. Go to: https://vercel.com/dashboard
2. Select your **akior** project
3. Go to **Settings** → **Environment Variables**
4. Add these three variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ruftuoilatlzniuasoza.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0` |
| `SUPABASE_SERVICE_ROLE_KEY` | (paste your service role key here) |

5. Click **Save**
6. Redeploy your application

## What This Fixes

✅ Ability to save OpenAI API key in settings  
✅ Encrypted storage of API keys  
✅ AI chat responses  
✅ Voice features (TTS)  
✅ Knowledge base functionality  
✅ User settings persistence  

## Security Note

⚠️ **NEVER commit the `.env.local` file to Git!**  
It's already in `.gitignore` to prevent accidental commits.

The service role key has full database access, so keep it secure!

## Need Help?

If you encounter any issues:
1. Make sure the service role key is copied correctly (no extra spaces)
2. Restart the development server after adding the key
3. Check the browser console for any error messages
