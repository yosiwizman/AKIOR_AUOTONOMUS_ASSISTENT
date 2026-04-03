# RAG Optimization Guide for AKIOR

## Overview

This guide provides comprehensive information on optimizing the Retrieval-Augmented Generation (RAG) system in AKIOR for maximum performance and accuracy.

## Document Management

### Upload Capacity
- **Maximum file size**: 50MB per document
- **Supported formats**: PDF, DOCX, TXT, MD
- **Optimal document size**: 5K-500K characters
- **Character limit**: No hard limit, but larger documents are chunked

### Document Size Guidelines

| Size Range | Recommendation | Use Case |
|------------|----------------|----------|
| < 5K chars | ✅ Good for FAQs | Quick reference documents |
| 5K-50K chars | ✅ Optimal | Standard documentation |
| 50K-500K chars | ⚠️ Good but chunked | Technical manuals, guides |
| 500K-2M chars | ⚠️ Use with caution | Large reference materials |
| > 2M chars | ❌ Split into multiple docs | Books, extensive documentation |

## Chunking Strategy

### Default Configuration
- **Chunk size**: 1,200 characters
- **Overlap**: 150 characters
- **Max chunks per document**: 200
- **Total chunks limit**: Unlimited (database constrained)

### Why Chunking Matters
1. **Semantic coherence**: Smaller chunks maintain topic focus
2. **Retrieval accuracy**: Precise matching to user queries
3. **Context window**: Fits within LLM token limits
4. **Performance**: Faster vector similarity search

### Optimization Tips
- Structure documents with clear sections
- Use headings and subheadings
- Keep paragraphs focused on single topics
- Avoid extremely long sentences

## Vector Embeddings

### Technical Details
- **Model**: OpenAI text-embedding-ada-002
- **Dimensions**: 1,536 per vector
- **Storage**: PostgreSQL with pgvector extension
- **Similarity metric**: Cosine similarity

### Memory Considerations
- Each vector: ~6KB storage (1,536 floats)
- 1,000 vectors: ~6MB
- 10,000 vectors: ~60MB
- 100,000 vectors: ~600MB

### Performance Optimization
1. **Index strategy**: Automatic indexing on approval
2. **Deduplication**: Checksum-based to avoid duplicates
3. **Batch processing**: Efficient bulk operations
4. **Real-time updates**: Supabase Realtime for live sync

## Classification & Access Control

### Classification Levels

#### Public
- **Visibility**: All users (including unauthenticated)
- **Use case**: General knowledge, FAQs, public documentation
- **RAG availability**: Always available
- **Spokesman mode**: Eligible

#### Internal
- **Visibility**: Authenticated users only
- **Use case**: Company policies, internal procedures
- **RAG availability**: Authenticated sessions
- **Spokesman mode**: Not eligible

#### Restricted
- **Visibility**: Specific users via ACL
- **Use case**: Confidential data, personal information
- **RAG availability**: ACL-matched users only
- **Spokesman mode**: Not eligible

### Trust Levels (0-100)

| Range | Meaning | Use Case |
|-------|---------|----------|
| 0-30 | Low trust | Unverified sources, experimental |
| 31-60 | Medium trust | General documentation |
| 61-80 | High trust | Reviewed and approved content |
| 81-100 | Verified | Official, authoritative sources |

**Note**: Trust levels are currently used for governance signals but not yet for ranking. Future updates will incorporate trust into retrieval scoring.

## Workflow Best Practices

### 1. Document Preparation
- ✅ Clean formatting (remove unnecessary styling)
- ✅ Clear structure (headings, lists, sections)
- ✅ Consistent terminology
- ✅ Remove redundant information
- ❌ Avoid scanned images without OCR
- ❌ Don't include large tables (convert to text)

### 2. Upload Process
1. Select appropriate classification
2. Set trust level based on source authority
3. Add descriptive title (auto-generated from filename if omitted)
4. Use "Restrict to me" for personal documents
5. Upload and wait for parsing

### 3. Admin Approval
- **Pending status**: Document uploaded, awaiting approval
- **Approved status**: Document indexed and available in RAG
- **Rejected status**: Document not suitable (currently manual)

### 4. Maintenance
- **Edit metadata**: Update title, classification, trust level without re-upload
- **Delete outdated**: Remove obsolete documents to maintain quality
- **Monitor status**: Check RAG status badge for system health

## Real-Time Updates

### Supabase Realtime Integration
- **Automatic sync**: Changes propagate instantly
- **Event types**: INSERT, UPDATE, DELETE
- **Notifications**: Toast messages for status changes
- **No polling**: Efficient WebSocket-based updates

### What Updates in Real-Time
- ✅ New document uploads
- ✅ Approval status changes
- ✅ Document edits
- ✅ Document deletions
- ✅ RAG status metrics

## Performance Monitoring

### Key Metrics

#### Sources
- **Total**: All uploaded documents
- **Approved**: Documents available in RAG
- **Pending**: Awaiting admin approval
- **Ratio**: Approved/Total (aim for >80%)

#### Chunks
- **Total**: All text segments
- **Per document**: Average chunks (aim for 10-50)
- **Distribution**: Check for outliers

#### Vectors
- **Total**: All embeddings
- **Match rate**: Vectors/Chunks (should be 1:1)
- **Index time**: Last successful indexing

#### RAG State
- **OFF**: No approved documents
- **DEGRADED**: Some documents but issues detected
- **ON**: Fully operational

### Troubleshooting

#### Document Stuck in Pending
- **Cause**: Awaiting admin approval
- **Solution**: Admin must click "Approve & Index"
- **Real-time**: Status updates automatically when approved

#### Indexing Failed
- **Cause**: Empty parsed text, embedding errors
- **Solution**: Check document format, re-upload if needed
- **Logs**: Check audit events for details

#### Low Retrieval Quality
- **Cause**: Poor document structure, wrong classification
- **Solution**: Edit metadata, improve document formatting
- **Test**: Use RAG test query to verify

## Advanced Features

### Deduplication
- **Checksum-based**: SHA-256 of raw content
- **Automatic**: Duplicate uploads reuse existing data
- **Scope**: Per tenant + classification
- **Benefit**: Saves storage and processing

### Audit Trail
- **All actions logged**: Upload, approve, edit, delete
- **Actor tracking**: User ID for accountability
- **Trace IDs**: Correlate related events
- **Compliance**: Full audit history

### Multi-Tenancy
- **Tenant isolation**: Data separated by tenant_id
- **Default tenant**: 'default' for single-tenant setups
- **Header-based**: X-Tenant-ID for multi-tenant

## API Integration

### Upload Document
```bash
POST /api/admin/kb/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <file>
title: "Document Title" (optional)
classification: "public" | "internal" | "restricted"
trust_level: 0-100
restricted_only_me: true | false
```

### List Documents
```bash
GET /api/admin/kb/sources
Authorization: Bearer <token>

Response: { sources: [...], role: "admin" | "user" }
```

### Approve Document
```bash
POST /api/admin/kb/{source_id}/approve
Authorization: Bearer <token>

Response: { indexed: { chunks: N, vectors: N } }
```

### Edit Document
```bash
PATCH /api/admin/kb/{source_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "New Title",
  "classification": "internal",
  "trust_level": 75
}
```

### Delete Document
```bash
DELETE /api/admin/kb/{source_id}
Authorization: Bearer <token>

Response: { ok: true, source_id: "..." }
```

### RAG Status
```bash
GET /api/rag/status
Authorization: Bearer <token>

Response: {
  data: {
    sources_total: N,
    sources_approved: N,
    chunks_total: N,
    vectors_total: N,
    last_index_time: "ISO-8601",
    rag_state: "OFF" | "DEGRADED" | "ON"
  }
}
```

## Future Enhancements

### Planned Features
- [ ] Trust-based ranking in retrieval
- [ ] Automatic document summarization
- [ ] Multi-language support
- [ ] Custom chunking strategies
- [ ] Document versioning
- [ ] Bulk operations
- [ ] Advanced search filters
- [ ] Analytics dashboard

### Experimental
- [ ] Hybrid search (keyword + vector)
- [ ] Re-ranking models
- [ ] Query expansion
- [ ] Contextual compression

## Troubleshooting Common Issues

### Issue: Documents not appearing in RAG
**Solution**: 
1. Check if document is approved
2. Verify classification matches user access
3. Ensure vectors were created (check RAG status)
4. Refresh the page or wait for real-time update

### Issue: Poor retrieval results
**Solution**:
1. Improve document structure and formatting
2. Increase trust level for authoritative sources
3. Use more specific document titles
4. Consider splitting large documents

### Issue: Upload fails
**Solution**:
1. Check file size (max 50MB)
2. Verify file format (PDF, DOCX, TXT, MD)
3. Ensure file is not corrupted
4. Check network connection

### Issue: Real-time updates not working
**Solution**:
1. Check browser console for WebSocket errors
2. Verify Supabase Realtime is enabled
3. Refresh the page to re-establish connection
4. Check authentication token validity

## Best Practices Summary

### ✅ Do
- Structure documents with clear sections
- Use descriptive titles
- Set appropriate classification levels
- Approve documents promptly
- Monitor RAG status regularly
- Delete outdated content
- Use edit feature for metadata updates
- Test retrieval quality

### ❌ Don't
- Upload extremely large files (>50MB)
- Use vague or generic titles
- Mix multiple topics in one document
- Leave documents pending indefinitely
- Ignore RAG status warnings
- Duplicate content unnecessarily
- Change classification without review

## Support & Resources

- **Documentation**: `/docs` directory
- **API Reference**: This guide
- **Audit Logs**: Check database `audit_events` table
- **Status Monitoring**: RAG Status Badge in UI
- **Real-time Updates**: Automatic via Supabase

---

**Last Updated**: 2024-01-31
**Version**: 1.0.0
**Maintained by**: AKIOR Team
