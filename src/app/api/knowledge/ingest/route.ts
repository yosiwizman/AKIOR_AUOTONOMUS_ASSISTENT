import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { verifyAuth, isAuthError } from '@/lib/server-auth';
import { decrypt } from '@/lib/encryption';

function getOpenAI(apiKey?: string | null) {
  const key = apiKey || process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function getSupabaseAuthed(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ruftuoilatlzniuasoza.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZnR1b2lsYXRsem5pdWFzb3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NjUxNzEsImV4cCI6MjA4NTI0MTE3MX0.JqPbHquY6lF6I2sYPoNLJjpvwP3aEvmIjAL4llk-hJ0';

  return createClient(url, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

async function getUserApiKey(userId: string) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from('agent_settings')
    .select('openai_api_key')
    .eq('user_id', userId)
    .single();

  if (!data?.openai_api_key) return null;
  return decrypt(data.openai_api_key) || null;
}

function safeBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9 _-]+/g, '').trim().slice(0, 80) || 'Document';
}

function chunkText(text: string, opts?: { chunkSize?: number; overlap?: number; maxChunks?: number }) {
  const chunkSize = opts?.chunkSize ?? 6000;
  const overlap = opts?.overlap ?? 400;
  const maxChunks = opts?.maxChunks ?? 30;

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();

  if (!cleaned) return [];

  const chunks: string[] = [];
  let i = 0;
  while (i < cleaned.length && chunks.length < maxChunks) {
    const end = Math.min(cleaned.length, i + chunkSize);
    const slice = cleaned.slice(i, end).trim();
    if (slice) chunks.push(slice);
    if (end >= cleaned.length) break;
    i = Math.max(0, end - overlap);
  }

  return chunks;
}

async function extractTextFromFile(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mime = (file.type || '').toLowerCase();
  const name = file.name || 'document';

  // Best-effort: handle some cases when browser doesn't set mime.
  const lowerName = name.toLowerCase();

  if (mime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const parsed = await pdf(buffer);
    return parsed.text || '';
  }

  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  }

  // Plain text / markdown / csv / json
  return buffer.toString('utf8');
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAuth(req);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    // Basic safety limits
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 400 });
    }

    const titleOverride = (form.get('title') as string | null)?.trim() || '';
    const baseTitle = titleOverride.slice(0, 100) || safeBaseName(file.name);

    const userApiKey = await getUserApiKey(auth.userId);
    const openai = getOpenAI(userApiKey);
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Add your key in Settings first.' },
        { status: 503 }
      );
    }

    const rawText = await extractTextFromFile(file);
    const chunks = chunkText(rawText, { chunkSize: 6000, overlap: 400, maxChunks: 30 });

    if (chunks.length === 0) {
      return NextResponse.json({ error: 'No readable text found in document' }, { status: 400 });
    }

    const db = getSupabaseAdmin() || (token ? getSupabaseAuthed(token) : null);
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    const groupId = crypto.randomUUID();

    const insertedIds: string[] = [];

    for (let idx = 0; idx < chunks.length; idx++) {
      const content = chunks[idx].slice(0, 50000);

      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: content.slice(0, 8000),
      });

      const embedding = embeddingRes.data[0].embedding;

      const partTitle = chunks.length === 1
        ? baseTitle
        : `${baseTitle} — Part ${idx + 1}/${chunks.length}`;

      const { data, error } = await db
        .from('knowledge_base')
        .insert({
          user_id: auth.userId,
          title: partTitle,
          content,
          content_type: 'document',
          embedding,
          metadata: {
            source: 'upload',
            fileName: file.name,
            mimeType: file.type,
            size: file.size,
            groupId,
            part: idx + 1,
            totalParts: chunks.length,
          },
        })
        .select('id')
        .single();

      if (error) {
        return NextResponse.json({ error: `Failed to save document chunk: ${error.message}` }, { status: 500 });
      }

      insertedIds.push(data.id);
    }

    return NextResponse.json({
      success: true,
      title: baseTitle,
      chunks: insertedIds.length,
      groupId,
      ids: insertedIds,
    });
  } catch (err) {
    console.error('Document ingest error:', err);
    return NextResponse.json({ error: 'Failed to ingest document' }, { status: 500 });
  }
}
