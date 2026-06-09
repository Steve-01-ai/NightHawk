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
const fs = require('fs-extra');
require('dotenv').config();

const config = require('./config');
const { menuMain, menuGroup, menuOwner, menuDownload } = require('./lib/menu');
const { isOwner, containsLink, containsGroupMention, getMessageText, parseCommand, sleep } = require('./lib/helper');
const { getOwner } = require('./lib/database');

const { antilink: cmdAntilink, antigroupmention: cmdAntigroupmention, tagall: cmdTagall, hidetag: cmdHidetag, handleAntilink, handleAntigroupmention } = require('./commands/group/group');
const { autostatusview: cmdAutostatusview, antideletepn: cmdAntideletepn, autorecordtyping: cmdAutorecordtyping, typing: cmdTyping, record: cmdRecord, handleAntideletePm } = require('./commands/owner/owner');
const { play: cmdPlay, song: cmdSong, video: cmdVideo, instagram: cmdInstagram, twitter: cmdTwitter, tiktok: cmdTiktok, facebook: cmdFacebook } = require('./commands/download/download');

const msgRetryCounterCache = new NodeCache();
const recentMessages = new Map();
const logger = pino({ level: 'silent' });

fs.ensureDirSync('./sessions');
fs.ensureDirSync('./downloads');
fs.ensureDirSync('./lib');

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

// ─── Strip device suffix from JID ────────────────────────────
// Baileys adds :0 :1 :5 etc after pairing code login
// 254752979317:5@s.whatsapp.net → 254752979317
function cleanNumber(jid) {
  return (jid || '').replace(/:[0-9]+/, '').replace('@s.whatsapp.net', '').replace('@c.us', '').replace(/[^0-9]/g, '');
}

function isSenderOwner(senderJid) {
  return cleanNumber(senderJid) === cleanNumber(config.ownerNumber);
}

// ─────────────────────────────────────────────────────────────
async function startNightHawk() {
  console.log('\n╔══════════════════════════════════╗');
  console.log('║   🦅   N I G H T  H A W K   🦅   ║');
  console.log('║          Version  2.0.0           ║');
  console.log('╚══════════════════════════════════╝\n');

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionPath);
  const { version } = await fetchLatestBaileysVersion();

  console.log(`📡 WA version: ${version.join('.')}`);

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
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
    keepAliveIntervalMs: 30000,
    connectTimeoutMs: 60000,
  });

  // ── Pairing code ──────────────────────────────────────────
  if (!sock.authState.creds.registered) {
    await sleep(3000);

    let phoneNumber = (process.env.OWNER_NUMBER || '').replace(/[^0-9]/g, '');

    if (!phoneNumber) {
      phoneNumber = await askQuestion(
        '📱 Enter your WhatsApp number\n   Country code + number, no + no spaces\n   Example: 254752979317\n\n> '
      );
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
    }

    if (phoneNumber.startsWith('0')) {
      phoneNumber = '254' + phoneNumber.slice(1);
    }

    if (!phoneNumber || phoneNumber.length < 7) {
      console.error('❌ Invalid number. Restart and try again.');
      process.exit(1);
    }

    console.log(`\n✅ Number: ${phoneNumber}`);
    console.log('⏳ Generating pairing code...\n');

    try {
      const pairingCode = await sock.requestPairingCode(phoneNumber);
      const display = pairingCode?.match(/.{1,4}/g)?.join('-') || pairingCode;

      console.log('┌──────────────────────────────┐');
      console.log('│    🔑  YOUR PAIRING CODE      │');
      console.log('│                              │');
      console.log(`│         ${display}           │`);
      console.log('│                              │');
      console.log('└──────────────────────────────┘\n');
      console.log('📲 WhatsApp → ⋮ → Linked Devices → Link a Device');
      console.log('   → Link with phone number instead');
      console.log(`   → Type: ${display}\n`);
    } catch (err) {
      console.error('❌ Pairing error:', err.message);
      await sleep(5000);
      return startNightHawk();
    }
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') console.log('🔄 Connecting...');

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      console.log(`❌ Disconnected. Code: ${code}`);
      if (code === DisconnectReason.loggedOut) {
        console.log('⚠️  Logged out — clearing session...');
        fs.removeSync('./sessions');
        await sleep(2000);
      }
      await sleep(4000);
      startNightHawk();
    }

    if (connection === 'open') {
      console.log('✅ NIGHT HAWK Connected!\n');
      console.log(`   Version : ${config.botVersion}`);
      console.log(`   Prefix  : ${config.prefix}`);
      console.log(`   Owner   : +${config.ownerNumber}\n`);

      // Send connect message to owner
      const ownerJid = config.ownerNumber + '@s.whatsapp.net';
      await sleep(2000);
      try {
        await sock.sendMessage(ownerJid, { text: config.connectMessage });
      } catch (e) {
        console.error('⚠️  Connect message failed:', e.message);
      }
    }
  });

  // ── Auto status view ──────────────────────────────────────
  sock.ev.on('messages.upsert', async ({ messages: msgs }) => {
    for (const m of msgs) {
      try {
        const owner = getOwner();
        if (owner.autoStatusView && m.key.remoteJid === 'status@broadcast') {
          await sock.readMessages([m.key]);
        }
      } catch {}
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
        console.error('[MSG ERROR]', err.message);
      }
    }
  });

  return sock;
}

// ─────────────────────────────────────────────────────────────
//  PER-MESSAGE HANDLER
// ─────────────────────────────────────────────────────────────
async function handleMessage(sock, message) {
  if (!message.message) return;
  if (message.key.fromMe) return;

  const from = message.key.remoteJid;
  const sender = message.key.participant || from;
  const isGroup = from.endsWith('@g.us');

  // ── Privacy check using cleanNumber so :5 suffix never blocks owner ──
  const senderIsOwner = isSenderOwner(sender);
  if (!isGroup && config.botPrivate && !senderIsOwner) return;

  const rawText = getMessageText(message);
  const text = rawText?.trim() || '';

  // Debug log — remove after confirming commands work
  if (text.startsWith(config.prefix)) {
    console.log(`[CMD] from: ${sender} | text: ${text} | isOwner: ${senderIsOwner} | isGroup: ${isGroup}`);
  }

  // Cache message for anti-delete
  if (text) {
    recentMessages.set(message.key.id, { ...message, _text: text });
    if (recentMessages.size > 500) recentMessages.delete(recentMessages.keys().next().value);
  }

  // Auto presence
  const owner = getOwner();
  if (owner.autoRecordTyping) {
    await sock.sendPresenceUpdate('composing', from).catch(() => {});
  }

  // ── GROUP HANDLING ────────────────────────────────────────
  if (isGroup) {
    let groupMetadata;
    try { groupMetadata = await sock.groupMetadata(from); }
    catch { groupMetadata = { participants: [] }; }

    if (containsLink(text)) { await handleAntilink(sock, message, text, groupMetadata); return; }
    if (containsGroupMention(text)) { await handleAntigroupmention(sock, message, text, groupMetadata); return; }

    if (!text.startsWith(config.prefix)) return;

    const parsed = parseCommand(text, config.prefix);
    if (!parsed) return;
    const { command, args } = parsed;

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
    return;
  }

  // ── PM HANDLING (owner only) ──────────────────────────────
  if (!text.startsWith(config.prefix)) return;
  const parsed = parseCommand(text, config.prefix);
  if (!parsed) return;
  const { command, args } = parsed;

  switch (command) {
    case 'menu': case 'help':
      return sock.sendMessage(from, { text: menuMain() }, { quoted: message });
    case 'groupmenu':
      return sock.sendMessage(from, { text: menuGroup() }, { quoted: message });
    case 'ownermenu':
      return sock.sendMessage(from, { text: menuOwner() }, { quoted: message });
    case 'dlmenu':
      return sock.sendMessage(from, { text: menuDownload() }, { quoted: message });
    case 'ping':
      return sock.sendMessage(from, { text: config.pingMessage }, { quoted: message });
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
  console.error('[FATAL ERROR]', err);
  process.exit(1);
});
