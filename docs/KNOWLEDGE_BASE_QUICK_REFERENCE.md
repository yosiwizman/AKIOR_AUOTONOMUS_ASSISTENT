# Knowledge Base Quick Reference

## 🚀 Quick Start

### Upload a Document
1. Click **Upload** button
2. Select file (PDF, DOCX, TXT, MD)
3. Set classification (public/internal/restricted)
4. Set trust level (0-100)
5. Click **Upload**
6. Wait for admin approval

### Edit a Document
1. Click **Edit** icon (✏️) on document card
2. Update title, classification, or trust level
3. Click **Save Changes**
4. Changes apply immediately

### Delete a Document
1. Click **Delete** icon (🗑️) on document card
2. Confirm deletion
3. Document and all related data removed

## 📊 Document Limits

| Item | Limit |
|------|-------|
| Max file size | 50MB |
| Max title length | 100 characters |
| Chunk size | 1,200 characters |
| Chunk overlap | 150 characters |
| Max chunks/doc | 200 |

## 🎯 Classification Guide

| Level | Who Can See | Use For |
|-------|-------------|---------|
| **Public** | Everyone | FAQs, general docs |
| **Internal** | Authenticated users | Company policies |
| **Restricted** | Specific users (ACL) | Confidential data |

## 🏆 Trust Levels

| Range | Meaning | Example |
|-------|---------|---------|
| 0-30 | Low | Unverified sources |
| 31-60 | Medium | General documentation |
| 61-80 | High | Reviewed content |
| 81-100 | Verified | Official sources |

## 🔄 Document Status

| Status | Meaning | Action |
|--------|---------|--------|
| **Pending** | Awaiting approval | Admin must approve |
| **Approved** | Indexed in RAG | Available for queries |
| **Rejected** | Not suitable | Re-upload or edit |

## 💡 Best Practices

### ✅ Do
- Use clear, descriptive titles
- Structure documents with headings
- Set appropriate classification
- Approve documents promptly
- Delete outdated content
- Monitor RAG status

### ❌ Don't
- Upload files >50MB
- Use vague titles
- Mix multiple topics
- Leave documents pending
- Duplicate content
- Ignore status warnings

## 🔍 RAG Status

| State | Meaning | Action |
|-------|---------|--------|
| **OFF** | No approved docs | Upload and approve documents |
| **DEGRADED** | Some issues | Check pending approvals |
| **ON** | Fully operational | System working normally |

## 📈 Optimization Tips

### Document Size
- **Optimal**: 5K-500K characters
- **Small** (<5K): Good for FAQs
- **Large** (>500K): Consider splitting

### Chunking
- Keep paragraphs focused
- Use clear section breaks
- Avoid very long sentences
- Structure with headings

### Performance
- Real-time updates (no refresh needed)
- Automatic deduplication
- Efficient vector search
- Instant status changes

## 🔧 Troubleshooting

### Document Not Appearing
1. Check if approved
2. Verify classification
3. Refresh page
4. Check RAG status

### Upload Fails
1. Check file size (<50MB)
2. Verify file format
3. Check network
4. Try again

### Poor Search Results
1. Improve document structure
2. Increase trust level
3. Use specific titles
4. Split large documents

## 📱 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Refresh | Click refresh button |
| Upload | Click upload button |
| Search | Click search field |

## 🎨 UI Elements

### Document Card
- **Title**: Document name
- **Status Badge**: pending/approved
- **Classification Badge**: public/internal/restricted
- **Trust Badge**: 0-100 score
- **Size**: Character count
- **Dates**: Created, indexed
- **Actions**: Edit, Delete, Approve

### Status Metrics
- **Sources**: Total uploaded
- **Approved**: Available in RAG
- **Chunks**: Text segments
- **Vectors**: Embeddings
- **Last Index**: Most recent indexing

## 🔐 Permissions

| Role | Can Do |
|------|--------|
| **Admin** | Everything |
| **User** | Upload, edit own, delete own |
| **Anonymous** | View public docs only |

## 📞 Need Help?

- **Documentation**: `/docs/RAG_OPTIMIZATION_GUIDE.md`
- **Updates**: `/docs/KNOWLEDGE_BASE_UPDATES.md`
- **Status**: Check RAG Status Badge
- **Tips**: Click "Show RAG Optimization Tips"

---

**Quick Tip**: Real-time updates mean you never need to manually refresh! Changes appear instantly.
