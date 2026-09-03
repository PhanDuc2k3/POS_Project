const fs = require('fs');
const net = require('net');
const tls = require('tls');
const crypto = require('crypto');
const config = require('./config');
const logger = require('./logger');

function normalizeRecipients(value) {
  if (!value) return [];
  return (Array.isArray(value) ? value : String(value).split(','))
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function parseAddress(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/<([^>]+)>/);
  return (match ? match[1] : raw).trim();
}

function encodeHeader(value) {
  const text = String(value || '');
  return /^[\x00-\x7F]*$/.test(text)
    ? text
    : `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildMessage({ from, to, subject, text, html }) {
  const boundary = `pos-mail-${crypto.randomBytes(8).toString('hex')}`;
  const recipients = normalizeRecipients(to).join(', ');
  const plain = String(text || '').replace(/\r?\n/g, '\r\n');
  const markup = html || `<pre>${escapeHtml(plain)}</pre>`;

  return [
    `From: ${from}`,
    `To: ${recipients}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
    `Message-ID: <${crypto.randomUUID()}@pos.local>`,
    `Date: ${new Date().toUTCString()}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    plain,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    markup.replace(/\r?\n/g, '\r\n'),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

function writeOutbox(message, meta) {
  fs.mkdirSync(config.MAIL_OUTBOX_DIR, { recursive: true });
  const safeSubject = String(meta.subject || 'email')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'email';
  const filename = `${new Date().toISOString().replace(/[:.]/g, '-')}-${safeSubject}.eml`;
  const filepath = `${config.MAIL_OUTBOX_DIR}/${filename}`;
  fs.writeFileSync(filepath, message, 'utf8');
  logger.info('Email written to local outbox', { to: meta.to, subject: meta.subject, filepath });
  return { mode: 'outbox', filepath };
}

function getStatus() {
  return {
    enabled: Boolean(config.SMTP_ENABLED && config.SMTP_HOST),
    dryRun: Boolean(config.MAIL_DRY_RUN),
    host: config.SMTP_HOST || '',
    port: config.SMTP_PORT,
    secure: Boolean(config.SMTP_SECURE),
    starttls: Boolean(config.SMTP_STARTTLS),
    hasAuth: Boolean(config.SMTP_USER && config.SMTP_PASS),
    from: config.SMTP_FROM,
    adminNotifyEmail: config.ADMIN_NOTIFY_EMAIL,
    outboxDir: config.MAIL_OUTBOX_DIR,
  };
}

function readHeader(message, name) {
  const pattern = new RegExp(`^${name}:\\s*(.+)$`, 'im');
  return message.match(pattern)?.[1]?.trim() || '';
}

function decodeHeader(value) {
  return String(value || '').replace(/=\?UTF-8\?B\?([^?]+)\?=/gi, (_, encoded) => {
    try {
      return Buffer.from(encoded, 'base64').toString('utf8');
    } catch {
      return _;
    }
  });
}

function listOutbox(limit = 20) {
  if (!fs.existsSync(config.MAIL_OUTBOX_DIR)) return [];
  return fs.readdirSync(config.MAIL_OUTBOX_DIR)
    .filter((name) => name.toLowerCase().endsWith('.eml'))
    .map((name) => {
      const filepath = `${config.MAIL_OUTBOX_DIR}/${name}`;
      const stat = fs.statSync(filepath);
      const message = fs.readFileSync(filepath, 'utf8');
      return {
        filename: name,
        size: stat.size,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
        to: readHeader(message, 'To'),
        subject: decodeHeader(readHeader(message, 'Subject')),
      };
    })
    .sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt))
    .slice(0, Number(limit) || 20);
}

function smtpSend({ from, to, message }) {
  return new Promise((resolve, reject) => {
    const sender = parseAddress(from);
    const recipients = normalizeRecipients(to).map(parseAddress);
    let socket = null;
    let buffer = '';

    const connectOptions = {
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      servername: config.SMTP_HOST,
      timeout: config.SMTP_TIMEOUT_MS,
    };

    function cleanup() {
      if (socket) socket.removeAllListeners();
    }

    function readResponse() {
      return new Promise((resolveRead, rejectRead) => {
        const onData = (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split(/\r?\n/).filter(Boolean);
          const last = lines[lines.length - 1] || '';
          if (/^\d{3}\s/.test(last)) {
            socket.off('data', onData);
            const response = buffer;
            buffer = '';
            resolveRead(response);
          }
        };
        socket.on('data', onData);
        socket.once('error', rejectRead);
      });
    }

    async function command(line, accepted = /^[23]/) {
      socket.write(`${line}\r\n`);
      const response = await readResponse();
      if (!accepted.test(response)) throw new Error(`SMTP command failed: ${line} -> ${response.trim()}`);
      return response;
    }

    async function run() {
      try {
        socket = config.SMTP_SECURE ? tls.connect(connectOptions) : net.connect(connectOptions);
        socket.setTimeout(config.SMTP_TIMEOUT_MS);
        socket.once('timeout', () => socket.destroy(new Error('SMTP connection timed out')));
        await new Promise((resolveConnect, rejectConnect) => {
          socket.once('connect', resolveConnect);
          socket.once('secureConnect', resolveConnect);
          socket.once('error', rejectConnect);
        });

        await readResponse();
        let ehlo = await command('EHLO localhost');

        if (config.SMTP_STARTTLS && !config.SMTP_SECURE) {
          await command('STARTTLS');
          socket = tls.connect({ socket, servername: config.SMTP_HOST });
          await new Promise((resolveTls, rejectTls) => {
            socket.once('secureConnect', resolveTls);
            socket.once('error', rejectTls);
          });
          ehlo = await command('EHLO localhost');
        }

        if (config.SMTP_USER && config.SMTP_PASS) {
          if (/AUTH[^\r\n]*PLAIN/i.test(ehlo)) {
            const token = Buffer.from(`\0${config.SMTP_USER}\0${config.SMTP_PASS}`, 'utf8').toString('base64');
            await command(`AUTH PLAIN ${token}`);
          } else {
            await command('AUTH LOGIN', /^3/);
            await command(Buffer.from(config.SMTP_USER, 'utf8').toString('base64'), /^3/);
            await command(Buffer.from(config.SMTP_PASS, 'utf8').toString('base64'));
          }
        }

        await command(`MAIL FROM:<${sender}>`);
        for (const recipient of recipients) {
          await command(`RCPT TO:<${recipient}>`);
        }
        await command('DATA', /^3/);
        socket.write(`${message.replace(/^\./gm, '..')}\r\n.\r\n`);
        await readResponse();
        await command('QUIT').catch(() => null);
        cleanup();
        resolve({ mode: 'smtp' });
      } catch (error) {
        cleanup();
        reject(error);
      }
    }

    run();
  });
}

async function sendMail({ to, subject, text, html, from = config.SMTP_FROM }) {
  const recipients = normalizeRecipients(to);
  if (!recipients.length) return { skipped: true, reason: 'no_recipients' };

  const message = buildMessage({ from, to: recipients, subject, text, html });
  if (!config.SMTP_ENABLED || !config.SMTP_HOST) {
    return writeOutbox(message, { to: recipients, subject });
  }

  try {
    const result = await smtpSend({ from, to: recipients, message });
    logger.info('Email sent by SMTP', { to: recipients, subject });
    return result;
  } catch (error) {
    if (!config.MAIL_DRY_RUN) throw error;
    logger.warn('SMTP failed, writing email to outbox', { to: recipients, subject, error: error.message });
    return writeOutbox(message, { to: recipients, subject });
  }
}

module.exports = {
  getStatus,
  listOutbox,
  sendMail,
};
