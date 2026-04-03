/**
 * Health Check API
 * Enterprise-grade health monitoring endpoint
 * 
 * GET /api/health
 * Returns system health status
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: ServiceStatus;
    openai: ServiceStatus;
    auth: ServiceStatus;
  };
  uptime: number;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'unconfigured';
  latency?: number;
  message?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return { status: 'unconfigured', message: 'Database credentials not configured' };
  }

  const start = Date.now();
  
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    
    // Simple query to check connection
    const { error } = await supabase.from('profiles').select('id').limit(1);
    
    if (error && error.code !== 'PGRST116') {
      return { status: 'down', latency: Date.now() - start, message: error.message };
    }
    
    return { status: 'up', latency: Date.now() - start };
  } catch (err) {
    return { 
      status: 'down', 
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

function checkOpenAI(): ServiceStatus {
  if (!process.env.OPENAI_API_KEY) {
    return { status: 'unconfigured', message: 'OpenAI API key not configured' };
  }
  
  // We don't make an actual API call to avoid costs
  // Just verify the key is present
  return { status: 'up' };
}

function checkAuth(): ServiceStatus {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return { status: 'unconfigured', message: 'Auth credentials not configured' };
  }
  
  return { status: 'up' };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // Check all services
  const [database] = await Promise.all([
    checkDatabase(),
  ]);
  
  const openai = checkOpenAI();
  const auth = checkAuth();

  // Determine overall status
  const services = { database, openai, auth };
  const serviceStatuses = Object.values(services);
  
  let overallStatus: HealthStatus['status'] = 'healthy';
  
  if (serviceStatuses.some(s => s.status === 'down')) {
    overallStatus = 'unhealthy';
  } else if (serviceStatuses.some(s => s.status === 'unconfigured')) {
    overallStatus = 'degraded';
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: '2.0.0',
    services,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    }
  });
}
