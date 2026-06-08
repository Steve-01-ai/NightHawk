const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} = require('@whiskeysockets/baileys');

const pino = require('pino');
const NodeCache = require('node-cache');
const readline = require('readline');
require('dotenv').config();

const config = require('./config');
const { menuMain, menuGroup, menuOwner, menuDownload } = require('./lib/menu');
const { isOwner, containsLink, containsGroupMention, getMessageText, parseCommand, sleep } = require('./lib/helper');
const { getOwner } = require('./lib/database');

const {
  antilink: cmdAntilink,
  antigroupmention: cmdAntigroupmention,
  tagall: cmdTagall,
  hidetag: cmdHidetag,
  handleAntilink,
  handleAntigroupmention,
} = require('./commands/group/group');

const {
  autostatusview: cmdAutostatusview,
  antideletepn: cmdAntideletepn,
  autorecordtyping: cmdAutorecordtyping,
  typing: cmdTyping,
  record: cmdRecord,
  handleAntideletePm,
} = require('./commands/owner/owner');

const {
  play: cmdPlay,
  song: cmdSong,
  video: cmdVideo,
  instagram: cmdInstagram,
  twitter: cmdTwitter,
  tiktok: cmdTiktok,
  facebook: cmdFacebook,
} = require('./commands/download/download');

const msgRetryCounterCache = new NodeCache();
const recentMessages = new Map();
const logger = pino({ level: 'silent' });

// ─── Ask for phone number in terminal ────────────────────────
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

async function startNightHawk() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  console.log('\n╔══════════════════════════════╗');
  console.log('║    🦅  NIGHT HAWK BOT 🦅     ║');
  console.log('╚══════════════════════════════╝\n');

  const sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    // Required for pairing code to work
    browser: ['NIGHT HAWK', 'Chrome', '120.0.0'],
  });

  // ── Request pairing code if not yet registered ─────────────
  if (!sock.authState.creds.registered) {
    // Give socket a moment to initialize
    await sleep(2000);

    let phoneNumber = process.env.OWNER_NUMBER || '';

    if (!phoneNumber) {
      phoneNumber = await askQuestion('📱 Enter your WhatsApp number (with country code, no + or spaces)\nExample: 2548012345678\n> ');
    }

    // Strip any non-digit characters just in case
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '');

    console.log(`\n⏳ Requesting pairing code for +${phoneNumber}...\n`);

    try {
      const code = await sock.requestPairingCode(phoneNumber);
      // Format code as XXXX-XXXX for readability
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      console.log('╔══════════════════════════════╗');
      console.log(`║  🔑 YOUR PAIRING CODE:        ║`);
      console.log(`║                               ║`);
      console.log(`║       ${formatted.padEnd(23)}║`);
      console.log(`║                               ║`);
      console.log('╚══════════════════════════════╝');
      console.log('\n📲 Steps to link:');
      console.log('   1. Open WhatsApp on your phone');
      console.log('   2. Tap ⋮ Menu → Linked Devices');
      console.log('   3. Tap "Link a Device"');
      console.log('   4. Tap "Link with phone number instead"');
      console.log(`   5. Enter the code: ${formatted}\n`);
    } catch (err) {
      console.error('❌ Failed to get pairing code:', err.message);
      console.log('Retrying in 5 seconds...');
      await sleep(5000);
      return startNightHawk();
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = code !== DisconnectReason.loggedOut;
      console.log(`❌ Connection closed (code ${code}). Reconnecting: ${shouldReconnect}`);
      if (shouldReconnect) {
        await sleep(3000);
        startNightHawk();
      } else {
        console.log('⚠️  Logged out. Delete the sessions/ folder and restart.');
      }
    }

    if (connection === 'open') {
      console.log('✅ NIGHT HAWK Connected!\n');
      const ownerJid = config.ownerNumber + '@s.whatsapp.net';
      await sleep(2000);
      await sock.sendMessage(ownerJid, { text: config.connectMessage });
    }
  });

  // ── Auto status view ──────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages: msgs }) => {
    for (const m of msgs) {
      const owner = getOwner();
      if (owner.autoStatusView && m.key.remoteJid === 'status@broadcast') {
        await sock.readMessages([m.key]);
      }
    }
  });

  // ── Anti delete PM ────────────────────────────────────────
  sock.ev.on('messages.delete', async (item) => {
    try {
      const ownerJid = config.ownerNumber + '@s.whatsapp.net';
      if (item.keys) {
        for (const key of item.keys) {
          const cached = recentMessages.get(key.id);
          if (cached) await handleAntideletePm(sock, ownerJid, key, cached);
        }
      }
    } catch (err) {
      console.error('[ANTI-DELETE ERROR]', err.message);
    }
  });

  // ── Main message handler ──────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages: msgs, type }) => {
    if (type !== 'notify') return;
    for (const message of msgs) {
      try {
        await handleMessage(sock, message);
      } catch (err) {
        console.error('[MESSAGE HANDLER ERROR]', err.message);
      }
    }
  });

  return sock;
}

async function handleMessage(sock, message) {
  if (!message.message) return;
  if (message.key.fromMe) return;

  const from = message.key.remoteJid;
  const sender = message.key.participant || from;
  const isGroup = from.endsWith('@g.us');
  const ownerJid = config.ownerNumber + '@s.whatsapp.net';

  if (!isGroup && config.botPrivate && sender !== ownerJid) return;

  const rawText = getMessageText(message);
  const text = rawText?.trim() || '';

  if (text) {
    recentMessages.set(message.key.id, { ...message, _text: text });
    if (recentMessages.size > 500) {
      recentMessages.delete(recentMessages.keys().next().value);
    }
  }

  const owner = getOwner();
  if (owner.autoRecordTyping) {
    await sock.sendPresenceUpdate('composing', from).catch(() => {});
  }

  if (isGroup) {
    let groupMetadata;
    try { groupMetadata = await sock.groupMetadata(from); }
    catch { groupMetadata = { participants: [] }; }

    if (containsLink(text)) { await handleAntilink(sock, message, text, groupMetadata); return; }
    if (containsGroupMention(text)) { await handleAntigroupmention(sock, message, text, groupMetadata); return; }

    if (text.startsWith(config.prefix)) {
      const parsed = parseCommand(text, config.prefix);
      if (!parsed) return;
      const { command, args } = parsed;
      const senderIsOwner = isOwner(sender);

      switch (command) {
        case 'menu': case 'help':
          return sock.sendMessage(from, { text: menuMain() }, { quoted: message });
        case 'groupmenu':
          return sock.sendMessage(from, { text: menuGroup() }, { quoted: message });
        case 'ownermenu':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only command.*' }, { quoted: message });
          return sock.sendMessage(from, { text: menuOwner() }, { quoted: message });
        case 'dlmenu':
          return sock.sendMessage(from, { text: menuDownload() }, { quoted: message });
        case 'ping':
          return sock.sendMessage(from, { text: config.pingMessage }, { quoted: message });
        case 'antilink':
          return cmdAntilink(sock, message, args, groupMetadata);
        case 'antigroupmention':
          return cmdAntigroupmention(sock, message, args, groupMetadata);
        case 'tagall':
          return cmdTagall(sock, message, args, groupMetadata);
        case 'hidetag':
          return cmdHidetag(sock, message, args, groupMetadata);
        case 'play': return cmdPlay(sock, message, args);
        case 'song': return cmdSong(sock, message, args);
        case 'video': return cmdVideo(sock, message, args);
        case 'instagram': case 'ig': return cmdInstagram(sock, message, args);
        case 'twitter': case 'tw': return cmdTwitter(sock, message, args);
        case 'tiktok': case 'tt': return cmdTiktok(sock, message, args);
        case 'facebook': case 'fb': return cmdFacebook(sock, message, args);
        case 'autostatusview':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only.*' }, { quoted: message });
          return cmdAutostatusview(sock, message, args);
        case 'antideletepn':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only.*' }, { quoted: message });
          return cmdAntideletepn(sock, message, args);
        case 'autorecordtyping':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only.*' }, { quoted: message });
          return cmdAutorecordtyping(sock, message, args);
        case 'typing':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only.*' }, { quoted: message });
          return cmdTyping(sock, message, args);
        case 'record':
          if (!senderIsOwner) return sock.sendMessage(from, { text: '❌ *Owner only.*' }, { quoted: message });
          return cmdRecord(sock, message, args);
        default: break;
      }
    }
    return;
  }

  if (!text.startsWith(config.prefix)) return;
  const parsed = parseCommand(text, config.prefix);
  if (!parsed) return;
  const { command, args } = parsed;

  switch (command) {
    case 'menu': case 'help': return sock.sendMessage(from, { text: menuMain() }, { quoted: message });
    case 'groupmenu': return sock.sendMessage(from, { text: menuGroup() }, { quoted: message });
    case 'ownermenu': return sock.sendMessage(from, { text: menuOwner() }, { quoted: message });
    case 'dlmenu': return sock.sendMessage(from, { text: menuDownload() }, { quoted: message });
    case 'ping': return sock.sendMessage(from, { text: config.pingMessage }, { quoted: message });
    case 'autostatusview': return cmdAutostatusview(sock, message, args);
    case 'antideletepn': return cmdAntideletepn(sock, message, args);
    case 'autorecordtyping': return cmdAutorecordtyping(sock, message, args);
    case 'typing': return cmdTyping(sock, message, args);
    case 'record': return cmdRecord(sock, message, args);
    case 'play': return cmdPlay(sock, message, args);
    case 'song': return cmdSong(sock, message, args);
    case 'video': return cmdVideo(sock, message, args);
    case 'instagram': case 'ig': return cmdInstagram(sock, message, args);
    case 'twitter': case 'tw': return cmdTwitter(sock, message, args);
    case 'tiktok': case 'tt': return cmdTiktok(sock, message, args);
    case 'facebook': case 'fb': return cmdFacebook(sock, message, args);
    default: break;
  }
}

startNightHawk().catch(err => {
  console.error('[STARTUP ERROR]', err);
  process.exit(1);
});
