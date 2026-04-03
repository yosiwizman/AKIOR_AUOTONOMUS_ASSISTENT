#!/usr/bin/env node
/**
 * AKIOR Dashboard API Server
 * Port: 8422
 * Pure Node.js — no external dependencies
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PORT = 8422;
const DASHBOARD_DIR = __dirname;
const REPORTS_DIR = path.join(__dirname, "..", "reports");

// MIME types for static file serving
const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".md": "text/plain",
};

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...corsHeaders(),
  });
  res.end(body);
}

/**
 * Find the latest file matching a glob-like prefix in a directory.
 * e.g., findLatestFile(REPORTS_DIR, 'cto-briefing-') returns the newest match.
 */
function findLatestFile(dir, prefix) {
  try {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(prefix) && f.endsWith(".md"))
      .sort()
      .reverse();
    return files.length > 0 ? path.join(dir, files[0]) : null;
  } catch {
    return null;
  }
}

function tryExec(cmd) {
  try {
    return execSync(cmd, { timeout: 5000, encoding: "utf-8" });
  } catch {
    return null;
  }
}

// ---- Route handlers ----

function handleStatus(req, res) {
  // Try openclaw status first, fall back to manual checks
  const raw = tryExec("openclaw status --json 2>/dev/null");
  if (raw) {
    try {
      jsonResponse(res, 200, JSON.parse(raw));
      return;
    } catch {
      /* fall through */
    }
  }

  // Manual status checks
  const services = [];

  // Docker
  const dockerOut = tryExec("docker ps --format json 2>/dev/null");
  const dockerCount = dockerOut
    ? dockerOut.trim().split("\n").filter(Boolean).length
    : 0;

  // Ollama
  const ollamaOut = tryExec("ollama list 2>/dev/null");
  const ollamaModels = ollamaOut
    ? ollamaOut.trim().split("\n").filter(Boolean).length - 1
    : 0;

  // tmux
  const tmuxOut = tryExec("tmux list-sessions 2>/dev/null");
  const tmuxActive = !!tmuxOut;

  services.push({
    name: "Docker",
    status: dockerCount > 0 ? "running" : "stopped",
    detail: `${dockerCount} containers`,
  });
  services.push({
    name: "Ollama",
    status: ollamaModels > 0 ? "running" : "stopped",
    detail: `${ollamaModels} models`,
  });
  services.push({ name: "tmux", status: tmuxActive ? "active" : "inactive" });
  services.push({
    name: "Dashboard API",
    status: "running",
    detail: `:${PORT}`,
  });

  jsonResponse(res, 200, { services, timestamp: new Date().toISOString() });
}

function handleCron(req, res) {
  const raw = tryExec("openclaw cron list --json 2>/dev/null");
  if (raw) {
    try {
      jsonResponse(res, 200, JSON.parse(raw));
      return;
    } catch {
      /* fall through */
    }
  }
  // Return static cron config if openclaw not available
  jsonResponse(res, 200, {
    jobs: [
      {
        name: "Morning Briefing",
        schedule: "Daily 8:03 AM ET",
        status: "idle",
      },
      { name: "Email Triage", schedule: "Every 4h", status: "idle" },
      { name: "LP Inbox Sweep", schedule: "Every 6h", status: "idle" },
      { name: "Canary Health", schedule: "Daily 6:57 AM ET", status: "idle" },
      { name: "Evening Summary", schedule: "Daily 9:07 PM ET", status: "idle" },
      { name: "Weekly Regression", schedule: "Sundays 6 AM ET", status: "new" },
    ],
    timestamp: new Date().toISOString(),
  });
}

function handleBriefing(req, res) {
  const filePath = findLatestFile(REPORTS_DIR, "cto-briefing-");
  if (!filePath) {
    jsonResponse(res, 404, { error: "No briefing report found" });
    return;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const filename = path.basename(filePath);
    jsonResponse(res, 200, {
      filename,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}

function handleEmailTriage(req, res) {
  const filePath = findLatestFile(REPORTS_DIR, "email-triage-");
  if (!filePath) {
    jsonResponse(res, 404, { error: "No email triage report found" });
    return;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const filename = path.basename(filePath);
    jsonResponse(res, 200, {
      filename,
      content,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
}

function handleHealth(req, res) {
  jsonResponse(res, 200, {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}

// ---- Static file server ----

function serveStatic(req, res) {
  let filePath = path.join(
    DASHBOARD_DIR,
    req.url === "/" ? "index.html" : req.url,
  );
  filePath = path.normalize(filePath);

  // Security: prevent directory traversal outside dashboard dir
  if (!filePath.startsWith(DASHBOARD_DIR)) {
    res.writeHead(403, corsHeaders());
    res.end("Forbidden");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, corsHeaders());
        res.end("Not Found");
      } else {
        res.writeHead(500, corsHeaders());
        res.end("Internal Server Error");
      }
      return;
    }
    res.writeHead(200, { "Content-Type": contentType, ...corsHeaders() });
    res.end(data);
  });
}

// ---- Router ----

const routes = {
  "/api/status": handleStatus,
  "/api/cron": handleCron,
  "/api/briefing": handleBriefing,
  "/api/email-triage": handleEmailTriage,
  "/api/health": handleHealth,
};

const server = http.createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = routes[url.pathname];

  if (handler && req.method === "GET") {
    handler(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[AKIOR Dashboard API] Running on http://localhost:${PORT}`);
  console.log(
    `[AKIOR Dashboard API] Serving static files from ${DASHBOARD_DIR}`,
  );
  console.log(
    `[AKIOR Dashboard API] API endpoints: ${Object.keys(routes).join(", ")}`,
  );
});
