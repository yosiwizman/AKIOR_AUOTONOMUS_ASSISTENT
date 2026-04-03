#!/usr/bin/env python3
"""AKIOR Ops Console — lightweight local operator UI.
Reads from canonical AKIOR paths. No cloud dependency.
Run: python3 server.py
Then open: http://localhost:8420
"""

import http.server
import json
import os
import glob
import re
from datetime import datetime
from pathlib import Path

PORT = 8420
AKIOR_ROOT = os.path.expanduser("~/akior")

PATHS = {
    "ssot": f"{AKIOR_ROOT}/docs/ssot",
    "evidence": f"{AKIOR_ROOT}/evidence/terminal",
    "screenshots": f"{AKIOR_ROOT}/evidence/screenshots",
    "ledgers": f"{AKIOR_ROOT}/ledgers",
    "checkpoints": f"{AKIOR_ROOT}/checkpoints",
}

SSOT_FILES = [
    "AKIOR-OS-SSOT-v1.0-EXPERIMENT-LOCK.md",
    "AKIOR-SSOT-LOCK-MEMO.md",
    "AKIOR-OWNER-INTERACTION-MODEL.md",
    "AKIOR-BUILD-AUTHORIZATION-GATE.md",
    "AKIOR-CONSTITUTIONAL-OVERRIDE-SUMMARY.md",
    "AKIOR-BOOTSTRAP-HANDOFF.md",
    "AKIOR-FINAL-FILING-INDEX.md",
    "RUNTIME-REFERENCE.md",
    "SSOT-REGISTER.md",
    "AKIOR-TOOL-ADOPTION-DECISIONS-01.md",
]

LIVE_PILATES_FILES = {
    "monitor": "livepilates-postsend-monitor-01.md",
    "send_status": "livepilates-followup-send-status-01.md",
    "send_operator": "livepilates-followup-send-operator-01.md",
    "spec_sheet": "livepilates-v12-spec-sheet-final-01.md",
    "color_chart": "livepilates-v12-color-chart-final-01.md",
    "playbook_michelle": "livepilates-reply-playbook-michelle-liu-01.md",
    "playbook_shinkai": "livepilates-reply-playbook-shin-kai-01.md",
    "inbox_read": "livepilates-wix-inbox-read-01.md",
}


def read_file(path, max_lines=50):
    try:
        with open(path, "r") as f:
            lines = f.readlines()
        return "".join(lines[:max_lines])
    except FileNotFoundError:
        return None


def get_tail(path, n=15):
    try:
        with open(path, "r") as f:
            lines = f.readlines()
        return "".join(lines[-n:])
    except FileNotFoundError:
        return None


def check_ssot_status():
    results = []
    for fname in SSOT_FILES:
        path = os.path.join(PATHS["ssot"], fname)
        exists = os.path.isfile(path)
        size = os.path.getsize(path) if exists else 0
        results.append({"file": fname, "exists": exists, "size": size})
    return results


def get_recent_evidence(n=10):
    pattern = os.path.join(PATHS["evidence"], "*.md")
    files = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)
    return [{"name": os.path.basename(f), "modified": datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M")} for f in files[:n]]


def get_checkpoint_status():
    latest = os.path.join(PATHS["checkpoints"], "bootstrap-complete.json")
    if os.path.isfile(latest):
        try:
            with open(latest) as f:
                return json.load(f)
        except:
            return {"status": "parse_error"}
    return {"status": "no_checkpoint"}


def get_live_pilates_status():
    status = {}
    for key, fname in LIVE_PILATES_FILES.items():
        path = os.path.join(PATHS["evidence"], fname)
        exists = os.path.isfile(path)
        status[key] = {"file": fname, "exists": exists}
        if exists:
            content = read_file(path, 200)
            if "SENT" in (content or ""):
                status[key]["has_sent"] = True
            if "AWAITING REPLY" in (content or ""):
                status[key]["awaiting"] = True
    return status


def extract_contact_status(monitor_content):
    contacts = []
    if not monitor_content:
        return contacts
    for name in ["Michelle Liu", "Shin Kai", "Nora Gallardo", "Danielle Luttje", "Karen Berg", "Griselda", "Lance"]:
        idx = monitor_content.find(name)
        if idx >= 0:
            chunk = monitor_content[idx:idx+300]
            status = "SENT" if "SENT" in chunk else ("AWAITING" if "Awaiting" in chunk else "UNKNOWN")
            contacts.append({"name": name, "status": status})
    return contacts


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_html():
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Gather data
    ssot = check_ssot_status()
    ssot_ok = sum(1 for s in ssot if s["exists"])
    action_tail = get_tail(os.path.join(PATHS["ledgers"], "action.md"), 20)
    decision_tail = get_tail(os.path.join(PATHS["ledgers"], "decision.md"), 10)
    recent_evidence = get_recent_evidence(12)
    checkpoint = get_checkpoint_status()
    lp_status = get_live_pilates_status()
    monitor_content = read_file(os.path.join(PATHS["evidence"], LIVE_PILATES_FILES["monitor"]), 200)
    contacts = extract_contact_status(monitor_content)

    # Determine phase
    if any(c.get("status") == "SENT" for c in contacts):
        phase = "MONITORING / CONVERSION"
        next_action = "Check Wix Inbox for customer replies. 48h follow-up if silent."
    else:
        phase = "PRE-SEND / PREPARATION"
        next_action = "Review send-ready drafts and execute via Wix Inbox."

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AKIOR Ops Console</title>
<meta http-equiv="refresh" content="30">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:'SF Mono',Menlo,Consolas,monospace;background:#0a0a0a;color:#e0e0e0;padding:16px;font-size:13px;line-height:1.5}}
h1{{color:#00ff88;font-size:20px;margin-bottom:4px}}
h2{{color:#00ccff;font-size:14px;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:4px}}
h3{{color:#ffaa00;font-size:13px;margin:12px 0 4px}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
.card{{background:#111;border:1px solid #222;border-radius:6px;padding:12px}}
.ok{{color:#00ff88}}.fail{{color:#ff4444}}.warn{{color:#ffaa00}}.info{{color:#888}}
table{{width:100%;border-collapse:collapse;margin:4px 0}}
td,th{{padding:3px 8px;text-align:left;border-bottom:1px solid #1a1a1a;font-size:12px}}
th{{color:#888;font-weight:normal}}
pre{{background:#0d0d0d;padding:8px;border-radius:4px;overflow-x:auto;font-size:11px;max-height:300px;overflow-y:auto;white-space:pre-wrap;word-break:break-word}}
.tag{{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:bold}}
.tag-sent{{background:#003300;color:#00ff88;border:1px solid #00ff88}}
.tag-await{{background:#332200;color:#ffaa00;border:1px solid #ffaa00}}
.tag-missing{{background:#330000;color:#ff4444;border:1px solid #ff4444}}
.subtitle{{color:#666;font-size:11px}}
</style>
</head>
<body>
<h1>AKIOR OPS CONSOLE</h1>
<div class="subtitle">Local fallback UI — refreshes every 30s — {now}</div>

<div class="grid">
<div class="card">
<h2>Current Phase</h2>
<div style="font-size:16px;color:#00ff88;margin:8px 0">{phase}</div>
<h3>Next Action</h3>
<div>{next_action}</div>
</div>

<div class="card">
<h2>SSOT Status</h2>
<div><span class="{'ok' if ssot_ok == len(SSOT_FILES) else 'warn'}">{ssot_ok}/{len(SSOT_FILES)} files present</span></div>
<table>
<tr><th>File</th><th>Status</th></tr>
"""
    for s in ssot:
        icon = '<span class="ok">OK</span>' if s["exists"] else '<span class="fail">MISSING</span>'
        html += f'<tr><td>{s["file"][:40]}</td><td>{icon}</td></tr>\n'

    html += f"""</table>
</div>
</div>

<div class="grid">
<div class="card">
<h2>Live Pilates — Contact Pipeline</h2>
<table>
<tr><th>Contact</th><th>Status</th></tr>
"""
    for c in contacts:
        tag = "tag-sent" if "SENT" in c["status"] else ("tag-await" if "AWAIT" in c["status"] else "tag-missing")
        html += f'<tr><td>{c["name"]}</td><td><span class="tag {tag}">{c["status"]}</span></td></tr>\n'
    if not contacts:
        html += '<tr><td colspan="2" class="info">No monitor data loaded</td></tr>\n'

    html += f"""</table>
<h3>Asset Files</h3>
<table>
<tr><th>Asset</th><th>Status</th></tr>
"""
    for key, info in lp_status.items():
        label = key.replace("_", " ").title()
        icon = '<span class="ok">OK</span>' if info["exists"] else '<span class="fail">MISSING</span>'
        html += f'<tr><td>{label}</td><td>{icon}</td></tr>\n'

    html += """</table>
</div>

<div class="card">
<h2>Checkpoint / Bootstrap</h2>
<table>
"""
    if isinstance(checkpoint, dict):
        for k, v in checkpoint.items():
            if isinstance(v, dict):
                v = ", ".join(f"{sk}:{sv}" for sk, sv in v.items())
            elif isinstance(v, list):
                v = ", ".join(str(i) for i in v)
            html += f'<tr><td>{k}</td><td>{esc(str(v))}</td></tr>\n'

    html += f"""</table>
</div>
</div>

<div class="card">
<h2>Recent Evidence Files</h2>
<table>
<tr><th>File</th><th>Modified</th></tr>
"""
    for ev in recent_evidence:
        html += f'<tr><td>{ev["name"]}</td><td>{ev["modified"]}</td></tr>\n'

    html += f"""</table>
</div>

<div class="grid">
<div class="card">
<h2>Action Ledger (latest)</h2>
<pre>{esc(action_tail or 'FILE NOT FOUND')}</pre>
</div>

<div class="card">
<h2>Decision Log (latest)</h2>
<pre>{esc(decision_tail or 'FILE NOT FOUND')}</pre>
</div>
</div>

<div class="card" style="margin-top:16px">
<h2>Project Health</h2>
<table>
<tr><th>System</th><th>Status</th><th>Notes</th></tr>
<tr><td>Claude Code CLI</td><td><span class="ok">ACTIVE</span></td><td>This console is served from it</td></tr>
<tr><td>Claude Desktop / Cowork</td><td><span class="warn">CHECK MANUALLY</span></td><td>Used for Computer Use / Wix sends</td></tr>
<tr><td>Wix Inbox</td><td><span class="{'ok' if any(c.get('status')=='SENT' for c in contacts) else 'warn'}">{'OPERATIONAL' if any(c.get('status')=='SENT' for c in contacts) else 'UNKNOWN'}</span></td><td>Canonical customer reply surface</td></tr>
<tr><td>Ollama</td><td><span class="warn">CHECK</span></td><td>curl localhost:11434</td></tr>
<tr><td>Docker</td><td><span class="warn">CHECK</span></td><td>docker ps</td></tr>
</table>
</div>

<div style="text-align:center;color:#333;margin-top:20px;font-size:11px">
AKIOR Ops Console v1.0 — Local fallback UI — No cloud dependency — Reads ~/akior/ directly
</div>
</body></html>"""
    return html


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            html = build_html()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(html.encode())
        elif self.path == "/api/status":
            data = {
                "ssot": check_ssot_status(),
                "checkpoint": get_checkpoint_status(),
                "live_pilates": get_live_pilates_status(),
                "recent_evidence": get_recent_evidence(),
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data, indent=2).encode())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass  # suppress request logs


if __name__ == "__main__":
    server = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"AKIOR Ops Console running at http://localhost:{PORT}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
