# Test Document for Knowledge Base Upload

This is a test document to verify that the Knowledge Base upload functionality is working correctly.

## Features Tested

- Document upload
- File parsing
- Storage bucket access
- RLS policy enforcement

## Expected Behavior

When this document is uploaded:

1. The file should be stored in the `kb-raw` bucket
2. The text should be extracted and stored in the `kb-parsed` bucket
3. The document should appear in the Knowledge Base with "pending" status
4. An admin can approve the document for indexing
5. After approval, the document will be chunked and vectorized for RAG retrieval

## Test Content

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Conclusion

If you can see this document in the Knowledge Base after upload, the system is working correctly! ✅
