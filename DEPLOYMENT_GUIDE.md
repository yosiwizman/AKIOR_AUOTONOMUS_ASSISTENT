# AKIOR Deployment Guide

## Prerequisites

- Node.js 20+ installed
- Supabase account and project
- Vercel account (recommended) or any Node.js hosting
- OpenAI API key (optional, can be user-provided)
- Upstash Redis account (optional, for distributed rate limiting)

---

## Environment Variables

### Required Variables

```bash
# Supabase (Public - exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption (Server-side only)
ENCRYPTION_SECRET=your-random-secret-key-min-32-chars
```

### Optional Variables

```bash
# OpenAI (Server-side only)
OPENAI_API_KEY=sk-your-openai-key

# Admin Access
AKIOR_ADMIN_EMAILS=admin@example.com,admin2@example.com
# OR
AKIOR_ADMIN_EMAIL_DOMAIN=example.com

# Redis Rate Limiting (Production recommended)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Redaction (for audit logs)
AKIOR_INTERNAL_HOSTNAMES=internal.example.com,staging.example.com
```

---

## Deployment Steps

### 1. Supabase Setup

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

#### B. Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

Or manually run migrations from `supabase/migrations/` in the SQL editor.

#### C. Create Storage Buckets
Run in Supabase SQL Editor:
```sql
-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
  ('kb-raw', 'kb-raw', false, 52428800),
  ('kb-parsed', 'kb-parsed', false, 52428800)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies (see supabase/migrations for full policies)
```

### 2. Vercel Deployment

#### A. Install Vercel CLI
```bash
npm install -g vercel
```

#### B. Deploy
```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

#### C. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add all required variables.

### 3. GitHub Actions Setup (CI/CD)

#### A. Required Secrets
Add these secrets in GitHub → Settings → Secrets:

```
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### B. Get Vercel Credentials
```bash
# Get Vercel token
vercel login
# Create token at: https://vercel.com/account/tokens

# Get org and project IDs
vercel link
# IDs are in .vercel/project.json
```

### 4. Redis Setup (Optional but Recommended)

#### A. Create Upstash Redis
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy REST URL and token

#### B. Add to Environment Variables
```bash
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## Post-Deployment Checklist

### Security
- [ ] `ENCRYPTION_SECRET` is set (not using dev default)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set
- [ ] Admin emails configured (`AKIOR_ADMIN_EMAILS`)
- [ ] Security headers enabled (automatic in next.config.ts)
- [ ] HTTPS enabled (automatic on Vercel)

### Performance
- [ ] Redis rate limiting configured (optional)
- [ ] Vercel Analytics enabled (automatic)
- [ ] Speed Insights enabled (automatic)

### Functionality
- [ ] OpenAI API key set (or users can provide their own)
- [ ] Storage buckets created and accessible
- [ ] Database migrations applied
- [ ] RLS policies active

### Testing
- [ ] Health check: `https://your-domain.com/api/health`
- [ ] RAG status: `https://your-domain.com/api/rag/status`
- [ ] Login works
- [ ] Chat works
- [ ] Voice interface works (Chrome/Edge only)
- [ ] Knowledge base upload works

---

## Monitoring

### Vercel Dashboard
- View deployment logs
- Monitor function execution
- Check analytics

### Supabase Dashboard
- Monitor database performance
- Check storage usage
- View auth logs

### Application Logs
```bash
# View Vercel logs
vercel logs

# View real-time logs
vercel logs --follow
```

---

## Troubleshooting

### Build Fails
```bash
# Check TypeScript errors
npm run typecheck

# Check linting
npm run lint

# Test build locally
npm run build
```

### Database Issues
```bash
# Check migrations
supabase db diff

# Reset database (CAUTION: deletes data)
supabase db reset
```

### Storage Issues
- Verify buckets exist in Supabase Dashboard
- Check RLS policies are correct
- Verify file size limits (50MB default)

### Rate Limiting Issues
- Check Redis connection (if using Upstash)
- Verify environment variables are set
- Falls back to in-memory if Redis unavailable

---

## Scaling Considerations

### Database
- Enable connection pooling in Supabase
- Add indexes for frequently queried columns
- Consider read replicas for high traffic

### Storage
- Use CDN for static assets (Vercel provides)
- Consider separate storage for large files
- Implement file compression

### Rate Limiting
- Use Redis for multi-instance deployments
- Adjust limits based on usage patterns
- Implement user-specific rate limits

### Caching
- Enable Vercel Edge Caching
- Implement Redis caching for embeddings
- Cache OpenAI responses (with TTL)

---

## Backup & Recovery

### Database Backups
Supabase provides automatic daily backups. To create manual backup:
```bash
supabase db dump > backup.sql
```

### Restore from Backup
```bash
psql -h your-db-host -U postgres -d postgres < backup.sql
```

### Storage Backups
Use Supabase CLI or API to download files from storage buckets.

---

## Security Best Practices

1. **Rotate Secrets Regularly**
   - Change `ENCRYPTION_SECRET` annually
   - Rotate API keys quarterly
   - Update Supabase keys if compromised

2. **Monitor Access Logs**
   - Review `audit_events` table regularly
   - Check `interaction_logs` for anomalies
   - Monitor failed auth attempts

3. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

4. **Enable 2FA**
   - Vercel account
   - Supabase account
   - GitHub account

---

## Support

For issues or questions:
1. Check the [README.md](./README.md)
2. Review [COMPREHENSIVE_AUDIT_2025.md](./COMPREHENSIVE_AUDIT_2025.md)
3. Check GitHub Issues
4. Contact support

---

## License

MIT
