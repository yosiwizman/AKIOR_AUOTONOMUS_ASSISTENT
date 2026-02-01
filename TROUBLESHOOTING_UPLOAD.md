# Upload Troubleshooting Guide

## Current Issue
Upload is failing with a 500 error after redeployment.

## Diagnostic Steps

### Step 1: Verify Environment Variable

1. **Test the environment variable endpoint:**
   - Navigate to: `https://www.akior.io/api/admin/test-env`
   - You should see a JSON response with:
     ```json
     {
       "ok": true,
       "environment": {
         "has_service_key": true,
         "key_length": 267,
         "key_prefix": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
         "node_env": "production",
         "vercel_env": "production"
       }
     }
     ```

2. **Test storage functionality:**
   - Navigate to: `https://www.akior.io/api/admin/test-storage`
   - You should see a JSON response with:
     ```json
     {
       "ok": true,
       "tests": {
         "admin_client": "OK",
         "list_buckets": "OK",
         "kb_raw_exists": true,
         "kb_parsed_exists": true,
         "test_upload": "OK",
         "upload_error": null
       },
       "buckets": [...]
     }
     ```

3. **If `has_service_key` is `false`:**
   - The environment variable is not set correctly in Vercel
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Check if `SUPABASE_SERVICE_ROLE_KEY` exists
   - If it exists, try deleting and re-adding it
   - Make sure it's enabled for all environments (Production, Preview, Development)
   - **Important:** After changing environment variables, you MUST redeploy

4. **If storage test fails:**
   - Check which specific test failed
   - If `kb_raw_exists` or `kb_parsed_exists` is false, run the SQL to create buckets
   - If `test_upload` fails, check the `upload_error` message for details

### Step 2: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Click on your project
3. Go to "Deployments" tab
4. Click on the latest deployment
5. Click on "Functions" tab
6. Look for `/api/admin/kb/upload` function
7. Check the logs for detailed error messages

Look for these log entries:
- `[storage] storeBytes called` - Shows storage operation started
- `[storage] Upload error` - Shows specific storage error
- `[server-clients] getSupabaseAdmin called` - Shows if admin client was created
- `kb.upload.ingestion_failed` - Shows ingestion errors

### Step 3: Check Storage Buckets

1. Go to Supabase Dashboard
2. Navigate to Storage section
3. Verify these buckets exist:
   - `kb-raw`
   - `kb-parsed`
4. Check bucket settings:
   - File size limit should be 50MB (52428800 bytes)
   - Public: false

### Step 4: Test Upload Again

After verifying the above:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try uploading a small text file first (easier to debug)
4. Check the console for error messages
5. Check Network tab for the `/api/admin/kb/upload` request
6. Look at the Response tab for detailed error information

## Common Issues and Solutions

### Issue 1: "Server configuration error: Missing service role key"

**Solution:**
1. Verify environment variable is set in Vercel
2. Redeploy after setting the variable
3. Check the test endpoint to confirm it's available

### Issue 2: Storage bucket not found

**Solution:**
Run this SQL in Supabase SQL Editor:
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kb-raw', 'kb-raw', false, 52428800, NULL),
  ('kb-parsed', 'kb-parsed', false, 52428800, NULL)
ON CONFLICT (id) DO NOTHING;
```

### Issue 3: Permission denied on storage

**Solution:**
The code now uses the service role key which bypasses RLS, so this shouldn't happen. If it does:
1. Verify the service role key is correct
2. Check Supabase project URL matches
3. Try regenerating the service role key in Supabase

### Issue 4: File parsing errors

**Solution:**
- Ensure the file is not corrupted
- Try a simple text file first
- Check file size (max 50MB)
- Supported formats: PDF, DOCX, TXT

## Getting More Information

If the issue persists, please provide:

1. **Test endpoint response:**
   - Visit `/api/admin/test-env` and copy the full JSON response

2. **Storage test response:**
   - Visit `/api/admin/test-storage` and copy the full JSON response

3. **Vercel function logs:**
   - Go to Vercel → Deployments → Latest → Functions
   - Copy the logs for `/api/admin/kb/upload`

4. **Browser console errors:**
   - Open DevTools → Console
   - Copy any error messages

5. **Network request details:**
   - Open DevTools → Network
   - Find the upload request
   - Copy the Response tab content

## Quick Fix Checklist

- [ ] Environment variable `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
- [ ] All environments (Production, Preview, Development) are selected
- [ ] Redeployed after setting environment variable
- [ ] Storage buckets `kb-raw` and `kb-parsed` exist in Supabase
- [ ] Test endpoint `/api/admin/test-env` shows `has_service_key: true`
- [ ] Test endpoint `/api/admin/test-storage` shows all tests passing
- [ ] Tried uploading a small text file
- [ ] Checked Vercel function logs for detailed errors
- [ ] Checked browser console for client-side errors

## Next Steps

After you've deployed the latest changes:

1. Visit `https://www.akior.io/api/admin/test-env` and share the response
2. Visit `https://www.akior.io/api/admin/test-storage` and share the response
3. Try uploading a file and share any error messages

This will help us identify the exact issue!