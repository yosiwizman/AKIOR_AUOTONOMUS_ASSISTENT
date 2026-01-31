# Deployment Steps to Fix Upload Issue

## Current Status
✅ Storage buckets created in Supabase  
✅ Code updated to use admin client for storage  
✅ Environment variable already exists in Vercel  
⚠️ **Need to redeploy with latest code changes**

## Next Steps

### Option 1: Automatic Deployment (Recommended)
If you have automatic deployments enabled:

1. **Commit and push your changes to GitHub:**
   ```bash
   git add .
   git commit -m "Fix document upload - use admin client for storage"
   git push origin main
   ```

2. Vercel will automatically detect the changes and deploy

3. Wait for the deployment to complete (check Vercel dashboard)

4. Test the upload functionality

### Option 2: Manual Deployment via Vercel Dashboard

1. Go to your Vercel project dashboard
2. Click on the "Deployments" tab
3. Click "Redeploy" on the latest deployment
4. Select "Use existing Build Cache" (optional, faster)
5. Click "Redeploy"
6. Wait for deployment to complete
7. Test the upload functionality

### Option 3: Deploy from Local (if you have Vercel CLI)

```bash
vercel --prod
```

## After Deployment

1. Navigate to your deployed site
2. Go to the Knowledge Base page
3. Click "Upload" button
4. Try uploading a document (PDF, DOCX, or TXT)
5. The upload should now work without errors!

## What Changed

The code now:
- Uses the Supabase service role key (admin client) for storage operations
- This bypasses RLS policies and ensures uploads work correctly
- Storage buckets (`kb-raw` and `kb-parsed`) are now created in Supabase
- Better error logging to help diagnose any future issues

## Troubleshooting

If uploads still fail after deployment:

1. **Check Vercel deployment logs:**
   - Go to Vercel Dashboard → Deployments → Click on latest deployment
   - Check the "Functions" tab for any runtime errors

2. **Check browser console:**
   - Open browser DevTools (F12)
   - Try uploading a file
   - Look for any error messages in the Console tab

3. **Verify environment variable:**
   - Go to Vercel → Settings → Environment Variables
   - Confirm `SUPABASE_SERVICE_ROLE_KEY` is set for all environments

4. **Check Supabase storage:**
   - Go to Supabase Dashboard → Storage
   - Verify `kb-raw` and `kb-parsed` buckets exist

## Need Help?

If you continue to experience issues, please provide:
- Vercel deployment logs (from the Functions tab)
- Browser console errors
- The exact error message you're seeing
