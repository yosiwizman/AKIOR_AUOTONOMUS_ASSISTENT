# Storage Buckets Setup for Knowledge Base

## Overview

The Knowledge Base feature requires two Supabase Storage buckets to store uploaded documents:

- **kb-raw**: Stores original uploaded files (PDF, DOCX, TXT, MD)
- **kb-parsed**: Stores parsed text content extracted from documents

## Buckets Created

Both buckets have been created with the following configuration:

- **Private**: Not publicly accessible
- **File Size Limit**: 15MB
- **Allowed MIME Types**:
  - kb-raw: PDF, DOCX, TXT, MD, and generic binary files
  - kb-parsed: Plain text only

## Row Level Security (RLS) Policies

The following RLS policies have been applied to ensure secure access:

### kb-raw Bucket Policies

1. **Upload Policy**: Authenticated users can upload files
2. **Read Policy**: Users can only read their own files (organized by user ID folder)
3. **Update Policy**: Users can only update their own files
4. **Delete Policy**: Users can only delete their own files

### kb-parsed Bucket Policies

1. **Upload Policy**: Authenticated users can upload files
2. **Read Policy**: Users can only read their own files (organized by user ID folder)
3. **Update Policy**: Users can only update their own files
4. **Delete Policy**: Users can only delete their own files

## File Organization

Files are organized by user ID to ensure proper access control:

```
kb-raw/
  └── {user_id}/
      └── {file_hash}

kb-parsed/
  └── {user_id}/
      └── {file_hash}
```

## Setup Status

✅ Buckets created via migration `0009_create_storage_buckets_for_knowledge_base.sql`
✅ RLS policies applied (see `STORAGE_POLICIES.sql` for policy definitions)

## Troubleshooting

If you encounter upload errors:

1. Verify buckets exist:
   ```sql
   SELECT * FROM storage.buckets WHERE id IN ('kb-raw', 'kb-parsed');
   ```

2. Verify policies exist:
   ```sql
   SELECT policyname FROM pg_policies 
   WHERE tablename = 'objects' AND schemaname = 'storage' 
   AND policyname LIKE 'kb_%';
   ```

3. Check user authentication:
   - Ensure the user is logged in
   - Verify the JWT token is valid

## Manual Policy Creation (if needed)

If policies need to be recreated, run the SQL in `STORAGE_POLICIES.sql` using:

- Supabase Dashboard → SQL Editor
- Or a direct database connection with proper permissions

**Note**: Standard migrations may not have sufficient permissions to create storage policies. Use the Dashboard or a privileged database connection.
