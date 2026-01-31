# Upload Flow Guide - Visual Progress & Status

## Overview

The Knowledge Base now features a **visual upload progress system** that clearly shows each stage of document processing, replacing the confusing "pending" status with clear, actionable information.

## Upload Stages

### Stage 1: Uploading (0-40%)
**Duration**: ~1 second  
**Icon**: 📤 Upload (pulsing)  
**Description**: File is being transferred to the server

**What's happening:**
- File data is sent via HTTP POST
- Server receives and validates file size/type
- Raw bytes are stored in Supabase Storage

**Visual Feedback:**
```
[████████░░░░░░░░░░░░] 40%
📤 Uploading file...
```

### Stage 2: Parsing (40-80%)
**Duration**: ~1.5 seconds  
**Icon**: ⚙️ Loader (spinning)  
**Description**: Document is being parsed and processed

**What's happening:**
- PDF/DOCX/TXT/MD file is parsed
- Text is extracted from document
- Document size (character count) is calculated
- Checksum is generated for deduplication
- Parsed text is stored

**Visual Feedback:**
```
[████████████████░░░░] 70%
⚙️ Parsing document...
```

### Stage 3: Complete (80-100%)
**Duration**: ~0.5 seconds  
**Icon**: ✅ CheckCircle (green)  
**Description**: Upload successful, awaiting approval

**What's happening:**
- Source record created in database
- Source version created with parsed text
- Audit events logged
- Real-time update triggered

**Visual Feedback:**
```
[████████████████████] 100%
✅ Complete!
```

### Stage 4: Error (if failed)
**Icon**: ⚠️ AlertCircle (red)  
**Description**: Upload failed with error message

**What's happening:**
- Error occurred during upload or parsing
- Detailed error message displayed
- Retry option available

**Visual Feedback:**
```
[████████░░░░░░░░░░░░] 35%
⚠️ Upload failed
Error: Network connection lost
[Retry Upload] button available
```

## Document Status After Upload

### "Awaiting Approval" Status

After successful upload, documents show:

```
🕐 Awaiting Approval
Document uploaded and parsed. Waiting for admin to approve and index for RAG.
```

**This is NOT an error!** It means:
- ✅ Upload successful
- ✅ Document parsed
- ✅ Text extracted
- ⏳ Waiting for admin approval
- ❌ Not yet indexed (not searchable in RAG)

### Why Admin Approval?

**Governance & Quality Control:**
1. **Content Review**: Ensure document is appropriate
2. **Classification Verification**: Confirm access level is correct
3. **Quality Check**: Verify document is well-formatted
4. **Deduplication**: Check for duplicate content
5. **Resource Management**: Control indexing costs

### Admin Approval Process

**For Admins:**
1. Review document metadata (title, classification, trust level)
2. Click **"Approve & Index"** button
3. System automatically:
   - Chunks document into segments
   - Generates vector embeddings
   - Stores vectors in database
   - Updates status to "Approved"
   - Makes document searchable in RAG

**Visual Feedback:**
```
[Approve & Index] → [⚙️ Approving...] → ✅ Approved and indexed (150 vectors)
```

## Progress Bar Features

### Visual Elements

1. **Progress Bar**
   - Smooth animation
   - Color-coded by stage
   - Percentage display

2. **Stage Icon**
   - Animated (pulsing/spinning)
   - Changes per stage
   - Color-coded

3. **Stage Label**
   - Clear description
   - Updates in real-time
   - Error messages if failed

4. **Percentage**
   - Numeric progress (0-100%)
   - Updates smoothly
   - Matches bar position

### Color Coding

| Stage | Color | Meaning |
|-------|-------|---------|
| Uploading | Blue | In progress |
| Parsing | Blue | Processing |
| Complete | Green | Success |
| Error | Red | Failed |

## Error Handling & Retry

### Common Errors

#### 1. Network Connection Lost
**Error**: "Upload cancelled" or "Network error"  
**Solution**: Click **"Retry Upload"** button  
**Prevention**: Ensure stable internet connection

#### 2. File Too Large
**Error**: "File too large. Maximum size is 50MB."  
**Solution**: Compress or split the document  
**Prevention**: Check file size before upload

#### 3. Invalid File Type
**Error**: "Invalid file type. Please upload PDF, DOCX, TXT, or MD files."  
**Solution**: Convert to supported format  
**Prevention**: Use supported file types

#### 4. Server Error
**Error**: "Upload failed" with server message  
**Solution**: Click **"Retry Upload"** or contact admin  
**Prevention**: Check server status

### Retry Functionality

**When upload fails:**
1. Progress bar shows error state (red)
2. Error message displayed below bar
3. **"Retry Upload"** button appears
4. Click to retry with same settings
5. Progress restarts from 0%

**Cancel During Upload:**
- **"Cancel Upload"** button available during upload
- Aborts HTTP request immediately
- Cleans up partial data
- Returns to idle state

## Real-Time Updates

### After Upload Completes

**Automatic Updates:**
- Document appears in list immediately
- Status shows "Awaiting Approval"
- No manual refresh needed
- Real-time via Supabase Realtime

**When Admin Approves:**
- Status changes to "Approved" instantly
- Indexed timestamp updates
- RAG status metrics update
- Toast notification appears

### Multi-User Collaboration

**Scenario**: User A uploads, Admin B approves

1. **User A uploads document**
   - Progress bar shows stages
   - Document appears in User A's list
   - Status: "Awaiting Approval"

2. **Admin B sees new document** (real-time)
   - Document appears in Admin B's list
   - Toast: "New document added"
   - Can approve immediately

3. **Admin B approves**
   - Clicks "Approve & Index"
   - Progress: "Approving..."
   - Indexing happens

4. **User A sees approval** (real-time)
   - Status changes to "Approved"
   - Toast: "Document approved and indexed"
   - No refresh needed

## Best Practices

### Before Upload

✅ **Do:**
- Check file size (<50MB)
- Verify file format (PDF, DOCX, TXT, MD)
- Ensure stable internet connection
- Choose appropriate classification
- Set correct trust level

❌ **Don't:**
- Upload extremely large files
- Use unsupported formats
- Upload during unstable connection
- Set wrong classification

### During Upload

✅ **Do:**
- Wait for progress to complete
- Watch for error messages
- Keep browser tab open

❌ **Don't:**
- Close browser during upload
- Navigate away from page
- Upload multiple files simultaneously
- Refresh page during upload

### After Upload

✅ **Do:**
- Verify document appears in list
- Check status is "Awaiting Approval"
- Wait for admin approval (if not admin)
- Monitor real-time updates

❌ **Don't:**
- Manually refresh page (not needed)
- Re-upload same document
- Assume "Awaiting Approval" is an error

## Troubleshooting

### Progress Bar Stuck

**Symptom**: Progress bar stops moving  
**Cause**: Network timeout or server issue  
**Solution**:
1. Wait 30 seconds
2. If still stuck, click "Cancel Upload"
3. Click "Retry Upload"
4. If persists, check network/server

### Document Not Appearing

**Symptom**: Upload completes but document not in list  
**Cause**: Real-time connection issue  
**Solution**:
1. Wait 5 seconds for real-time update
2. Click "Refresh" button (top right)
3. Check if document appears
4. If not, check browser console for errors

### Status Stuck on "Awaiting Approval"

**Symptom**: Document stays in "Awaiting Approval" for long time  
**Cause**: Admin hasn't approved yet (this is normal!)  
**Solution**:
1. **If you're a user**: Wait for admin approval
2. **If you're an admin**: Click "Approve & Index"
3. This is NOT an error - it's the governance workflow

### Upload Fails Repeatedly

**Symptom**: Every upload attempt fails  
**Cause**: File issue, network issue, or server issue  
**Solution**:
1. Check file size and format
2. Try different file
3. Check internet connection
4. Try different browser
5. Contact admin if persists

## Technical Details

### Progress Simulation

**Why simulate?**
- HTTP upload doesn't provide real-time progress
- Parsing happens server-side (no client visibility)
- Smooth UX requires estimated progress

**How it works:**
1. **Uploading (0-40%)**: Simulated over 1 second
2. **Parsing (40-80%)**: Simulated over 1.5 seconds
3. **Complete (80-100%)**: Simulated over 0.5 seconds
4. **Actual completion**: Triggered by API response

**Accuracy:**
- Small files: Very accurate
- Large files: May complete faster than shown
- Network issues: May take longer than shown

### Abort Controller

**Purpose**: Allow cancellation during upload

**Implementation:**
```typescript
const abortController = new AbortController();
fetch('/api/upload', {
  signal: abortController.signal,
  // ...
});

// To cancel:
abortController.abort();
```

**Benefits:**
- Clean cancellation
- No orphaned requests
- Immediate feedback

## UI Components

### Progress Bar Component

**Location**: `src/components/ui/progress.tsx`  
**Library**: Radix UI Progress  
**Props**:
- `value`: 0-100 (percentage)
- `className`: Custom styling

**Styling:**
```tsx
<Progress 
  value={uploadProgress} 
  className={cn(
    "h-2",
    uploadStage === 'error' && "[&>div]:bg-destructive",
    uploadStage === 'complete' && "[&>div]:bg-emerald-500"
  )}
/>
```

### Stage Icons

| Stage | Icon | Animation |
|-------|------|-----------|
| Uploading | Upload | Pulse |
| Parsing | Loader2 | Spin |
| Complete | CheckCircle2 | None |
| Error | AlertCircle | None |

### Status Badge

**Pending Status:**
```tsx
<Badge variant="outline" className="rounded-full text-xs bg-amber-500/15 text-amber-800">
  <Clock className="h-3.5 w-3.5 animate-pulse" />
  Awaiting Approval
</Badge>
```

**Approved Status:**
```tsx
<Badge variant="outline" className="rounded-full text-xs bg-emerald-500/15 text-emerald-800">
  <CheckCircle2 className="h-3.5 w-3.5" />
  Approved
</Badge>
```

## Summary

### Key Improvements

1. ✅ **Visual Progress Bar**: Clear indication of upload stages
2. ✅ **Stage Labels**: Descriptive text for each stage
3. ✅ **Animated Icons**: Visual feedback during processing
4. ✅ **Error Handling**: Clear error messages with retry
5. ✅ **Cancel Functionality**: Abort upload mid-process
6. ✅ **Better Status**: "Awaiting Approval" instead of "pending"
7. ✅ **Explanatory Text**: Clarifies what "Awaiting Approval" means
8. ✅ **Real-Time Updates**: Instant status changes

### User Experience

**Before:**
- ❌ Confusing "pending" status
- ❌ No upload progress visibility
- ❌ No retry on failure
- ❌ Manual refresh needed

**After:**
- ✅ Clear visual progress
- ✅ Stage-by-stage feedback
- ✅ Retry on failure
- ✅ Real-time updates
- ✅ Better status labels
- ✅ Explanatory messages

---

**Last Updated**: 2024-01-31  
**Version**: 2.1.0  
**Feature**: Visual Upload Progress
