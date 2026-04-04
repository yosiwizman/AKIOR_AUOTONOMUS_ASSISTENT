#!/usr/bin/env node

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');

// Load config
const configPath = path.join(process.env.HOME, '.config', 'imap-smtp-email', '.env');
const config = {};

if (fs.existsSync(configPath)) {
  const envContent = fs.readFileSync(configPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });
}

const imap = new Imap({
  user: config.IMAP_USER,
  password: config.IMAP_PASS,
  host: config.IMAP_HOST,
  port: config.IMAP_PORT || 993,
  tls: config.IMAP_TLS === 'true',
  tlsOptions: { rejectUnauthorized: config.IMAP_REJECT_UNAUTHORIZED !== 'false' }
});

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

function classifyEmail(subject, from, body) {
  const subjectLower = (subject || '').toLowerCase();
  const fromLower = (from || '').toLowerCase();
  const bodyLower = (body || '').toLowerCase();

  // Check for Wix notifications
  if (fromLower.includes('wix') || fromLower.includes('livepilates')) {
    return 'URGENT (Live Pilates Activity)';
  }

  // Urgent patterns
  const urgentPatterns = [
    'urgent', 'asap', 'immediately', 'emergency', 'critical',
    'payment failed', 'security alert', 'account suspended',
    'action required', 'expires today', 'deadline'
  ];

  if (urgentPatterns.some(pattern => 
    subjectLower.includes(pattern) || bodyLower.includes(pattern)
  )) {
    return 'URGENT';
  }

  // Action needed patterns
  const actionPatterns = [
    'please confirm', 'please review', 'please respond',
    'needs approval', 'awaiting', 'pending', 'follow up',
    'meeting request', 'invitation', 'rsvp'
  ];

  if (actionPatterns.some(pattern => 
    subjectLower.includes(pattern) || bodyLower.includes(pattern)
  )) {
    return 'ACTION_NEEDED';
  }

  // Informational patterns (newsletters, notifications, etc.)
  const infoPatterns = [
    'newsletter', 'unsubscribe', 'digest', 'notification',
    'update', 'news', 'blog', 'weekly', 'monthly'
  ];

  if (infoPatterns.some(pattern => 
    subjectLower.includes(pattern) || fromLower.includes(pattern)
  )) {
    return 'INFORMATIONAL';
  }

  // Default to routine
  return 'ROUTINE';
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    
    // Search for unread messages
    imap.search(['UNSEEN'], function(err, results) {
      if (err) throw err;
      
      if (results.length === 0) {
        console.log(JSON.stringify({
          count: 0,
          messages: []
        }, null, 2));
        imap.end();
        return;
      }

      const f = imap.fetch(results.slice(0, 20), { bodies: '', struct: true });
      const messages = [];

      f.on('message', function(msg, seqno) {
        const msgData = { uid: null, classification: 'ROUTINE' };

        msg.on('body', function(stream, info) {
          simpleParser(stream, (err, parsed) => {
            if (err) return;
            
            msgData.subject = parsed.subject || 'No Subject';
            msgData.from = parsed.from ? parsed.from.text : 'Unknown';
            msgData.date = parsed.date;
            msgData.body = parsed.text ? parsed.text.substring(0, 500) : '';
            msgData.classification = classifyEmail(
              msgData.subject,
              msgData.from,
              msgData.body
            );
          });
        });

        msg.once('attributes', function(attrs) {
          msgData.uid = attrs.uid;
        });

        msg.once('end', function() {
          messages.push(msgData);
        });
      });

      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });

      f.once('end', function() {
        setTimeout(() => {
          console.log(JSON.stringify({
            count: messages.length,
            messages: messages
          }, null, 2));
          imap.end();
        }, 1000);
      });
    });
  });
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  process.exit(0);
});

imap.connect();