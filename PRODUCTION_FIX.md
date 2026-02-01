# Production Upload Fix

## Issue
Uploads work in local development but fail in production with a 500 error.

## Root Cause
The issue is likely related to:
1. Missing or incorrect `SUPABASE_SERVICE_ROLE_KEY` environment variable in Vercel
2. Node.js runtime modules (pdf-parse, mammoth) not being bundled correctly
3. Serverless function timeout or memory limits

## Changes Made

### 1. Added Vercel Configuration (`vercel.json`)
- Increased function timeout to 60 seconds
- Increased memory to 1024MB
- This ensures the upload function has enough resources

### 2. Enhanced Logging
- Added comprehensive logging throughout the upload process
- Logs will appear in Vercel Function logs
- This will help identify the exact failure point

### 3. Improved Error Handling
- Better error messages
- Stack traces captured
- Detailed context in logs

## Deployment Steps

### Step 1: Verify Environment Variable in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables

2. **Check if `SUPABASE_SERVICE_ROLE_KEY` exists:**
   - If it exists, verify it's enabled for all environments (Production, Preview, Development)
   - If it doesn't exist, add it:
     ```
     Key: SUPABASE_SERVICE_ROLE_KEY
     Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTY2NTE3MSwiZXhwIjoyMDg1MjQxMTcxfQ.-uaAhqh6TI4sRPCnmyKx2tD20cKANFq8eJyINTyQaw0
     Environments: Production, Preview, Development
     ```

3. **Important:** After adding or modifying environment variables, you MUST redeploy

### Step 2: Deploy to Production

**Option A: Push to GitHub (Recommended)**
```bash
git add .
git commit -m "Fix production upload - add vercel config and enhanced logging"
git push origin main
```

**Option B: Manual Redeploy**
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

### Step 3: Check Deployment Logs

After deployment:

1. Go to Vercel Dashboard → Deployments → Click on the latest deployment
2. Click on "Functions" tab
3. Look for `/api/admin/kb/upload` function
4. Try uploading a file
5. Refresh the logs to see detailed error messages

### Step 4: Test Upload

1. Go to https://www.akior.io
2. Navigate to Knowledge Base
3. Click "Upload"
4. Try uploading a small text file first (easier to debug)
5. If it fails, check the Vercel function logs immediately

## What to Look For in Logs

The logs will show:

1. **Environment Check:**
   ```
   [server-clients] getSupabaseAdmin called: { has_service_key: true, ... }
   ```
   - If `has_service_key: false`, the environment variable is not set

2. **Storage Operations:**
   ```
   [storage] storeBytes called: { bucket: 'kb-raw', ... }
   [storage] Upload successful: { bucket: 'kb-raw', ... }
   ```
   - If you see "Upload error", check the error message

3. **File Parsing:**
   ```
   [ingestion] extractTextFromFile: { fileName: '...', fileSize: ..., mimeType: '...' }
   [ingestion] PDF parsed successfully, text length: ...
   ```
   - If parsing fails, you'll see the error here

4. **Ingestion:**
   ```
   kb.upload.start: { user_id: '...', file_name: '...', ... }
   kb.upload.ingestion_complete: { source_id: '...' }
   ```
   - If ingestion fails, you'll see `kb.upload.ingestion_failed` with error details

## Common Issues and Solutions

### Issue 1: "has_service_key: false"
**Solution:** Environment variable not set in Vercel. Add it and redeploy.

### Issue 2: "Storage upload failed"
**Solution:** 
- Check if storage buckets exist in Supabase
- Verify service role key is correct
- Check Supabase project URL matches

### Issue 3: "Failed to parse document"
**Solution:**
- Try a simple text file first
- Check if pdf-parse or mammoth modules are loading correctly
- Look for module loading errors in logs

### Issue 4: Function timeout
**Solution:**
- The `vercel.json` now sets timeout to 60 seconds
- If still timing out, the file might be too large or parsing is stuck

### Issue 5: Memory limit exceeded
**Solution:**
- The `vercel.json` now sets memory to 1024MB
- If still failing, try smaller files first

## Troubleshooting Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel for all environments
- [ ] Redeployed after setting environment variable
- [ ] Checked Vercel function logs for detailed errors
- [ ] Tried uploading a small text file (< 1MB)
- [ ] Storage buckets `kb-raw` and `kb-parsed` exist in Supabase
- [ ] Supabase project URL matches in environment variables
- [ ] No build errors in Vercel deployment logs

## Next Steps

After deploying:

1. **Try uploading a file**
2. **Immediately check Vercel function logs**
3. **Share the log output** if it still fails

The enhanced logging will show exactly where the failure occurs, making it much easier to fix!

## Alternative: Test with Simple Text File

If PDF/DOCX parsing is the issue, try uploading a simple text file first:

1. Create a file called `test.txt` with some content
2. Upload it to the Knowledge Base
3. If this works, the issue is with pdf-parse or mammoth modules
4. If this also fails, the issue is with storage or database operations

## Contact Support

If the issue persists after following all steps, please provide:

1. **Vercel function logs** (from the Functions tab)
2. **Browser console errors** (F12 → Console)
3. **Network request details** (F12 → Network → upload request → Response tab)
4. **File type and size** you're trying to upload

This information will help identify the exact issue!
