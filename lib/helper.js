const config = require('../config');

function isOwner(senderJid) {
  return senderJid === config.ownerNumber + '@s.whatsapp.net';
}

function isAdmin(groupMetadata, senderJid) {
  if (!groupMetadata?.participants) return false;
  const p = groupMetadata.participants.find(p => p.id === senderJid);
  return p && (p.admin === 'admin' || p.admin === 'superadmin');
}

function isBotAdmin(groupMetadata, botJid) {
  if (!groupMetadata?.participants) return false;
  const p = groupMetadata.participants.find(p => p.id === botJid);
  return p && (p.admin === 'admin' || p.admin === 'superadmin');
}

function containsLink(text) {
  if (!text) return false;
  return /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|net|org|io|co|gg|tv|me|ly|link|app|xyz)[^\s]*)/gi.test(text);
}

function containsGroupMention(text) {
  if (!text) return false;
  return /@everyone|@all|@here/gi.test(text);
}

function getMessageText(message) {
  try {
    const msg = message.message;
    if (!msg) return '';
    return msg.conversation || msg.extendedTextMessage?.text || msg.imageMessage?.caption || msg.videoMessage?.caption || '';
  } catch { return ''; }
}

function parseCommand(text, prefix) {
  if (!text || !text.startsWith(prefix)) return null;
  const parts = text.slice(prefix.length).trim().split(/\s+/);
  return { command: parts[0].toLowerCase(), args: parts.slice(1), body: parts.slice(1).join(' ') };
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

module.exports = { isOwner, isAdmin, isBotAdmin, containsLink, containsGroupMention, getMessageText, parseCommand, sleep };
