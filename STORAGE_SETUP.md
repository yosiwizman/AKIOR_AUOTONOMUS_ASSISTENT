# Storage Setup Instructions

## Issue
Document uploads were failing with a 500 error due to missing storage buckets and permissions.

## What Was Fixed

### 1. Storage Buckets Created
- Created `kb-raw` bucket for storing original uploaded files
- Created `kb-parsed` bucket for storing parsed text content
- Both buckets have a 50MB file size limit

### 2. Code Improvements
- Updated storage module with better error handling and logging
- Modified upload route to use admin client (service role) for storage operations
- This bypasses RLS policies and ensures uploads work correctly

### 3. Environment Variables
The following environment variable is required and already set in `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Required: Vercel Environment Variable

**IMPORTANT**: You need to add the service role key to your Vercel deployment:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add a new environment variable:
   - **Name**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NTE3MSwiZXhwIjoyMDg1MjQxMTcxfQ.-uaAhqh6TI4sRPCnmyKx2tD20cKANFq8eJyINTyQaw0`
   - **Environments**: Select all (Production, Preview, Development)
4. Click "Save"
5. Redeploy your application

## Optional: Storage RLS Policies (Recommended for Security)

While the service role key bypasses RLS, it's still good practice to set up proper policies:

### Via Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Storage > Policies
3. For each bucket (`kb-raw` and `kb-parsed`), create these 4 policies:

#### INSERT Policy
- **Policy name**: `Authenticated users can upload to [bucket-name]`
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = '[bucket-name]'`

#### SELECT Policy
- **Policy name**: `Authenticated users can read from [bucket-name]`
- **Allowed operation**: SELECT
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = '[bucket-name]'`

#### UPDATE Policy
- **Policy name**: `Authenticated users can update [bucket-name]`
- **Allowed operation**: UPDATE
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = '[bucket-name]'`

#### DELETE Policy
- **Policy name**: `Authenticated users can delete from [bucket-name]`
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **Policy definition**: `bucket_id = '[bucket-name]'`

Replace `[bucket-name]` with either `kb-raw` or `kb-parsed`.

## Testing

After adding the environment variable to Vercel and redeploying:

1. Navigate to your Knowledge Base page
2. Click "Upload" button
3. Select a document (PDF, DOCX, or TXT)
4. Fill in the title and classification
5. Click upload
6. The upload should now succeed without errors

## Troubleshooting

If uploads still fail:

1. Check Vercel logs for detailed error messages
2. Verify the `SUPABASE_SERVICE_ROLE_KEY` is correctly set in Vercel
3. Ensure the storage buckets exist in Supabase (check Storage section)
4. Check browser console for any client-side errors
