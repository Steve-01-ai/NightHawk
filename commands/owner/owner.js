const { getOwner, setOwnerProp } = require('../../lib/database');

async function autostatusview(sock, message, args) {
  const from = message.key.remoteJid;
  const option = args[0]?.toLowerCase();
  if (option === 'on') {
    setOwnerProp('autoStatusView', true);
    return sock.sendMessage(from, { text: '✅ *Auto Status View: ON*' }, { quoted: message });
  }
  if (option === 'off') {
    setOwnerProp('autoStatusView', false);
    return sock.sendMessage(from, { text: '🔕 *Auto Status View: OFF*' }, { quoted: message });
  }
  const owner = getOwner();
  return sock.sendMessage(from, { text: `👁️ *AUTO STATUS VIEW*\nStatus: *${owner.autoStatusView ? 'ON ✅' : 'OFF ❌'}*\n_Usage: .autostatusview on/off_` }, { quoted: message });
}

async function antideletepn(sock, message, args) {
  const from = message.key.remoteJid;
  const option = args[0]?.toLowerCase();
  if (option === 'on') {
    setOwnerProp('antideletePm', true);
    return sock.sendMessage(from, { text: '🛡️ *Anti Delete PM: ON*' }, { quoted: message });
  }
  if (option === 'off') {
    setOwnerProp('antideletePm', false);
    return sock.sendMessage(from, { text: '🔕 *Anti Delete PM: OFF*' }, { quoted: message });
  }
  const owner = getOwner();
  return sock.sendMessage(from, { text: `🗑️ *ANTI DELETE PM*\nStatus: *${owner.antideletePm ? 'ON ✅' : 'OFF ❌'}*\n_Usage: .antideletepn on/off_` }, { quoted: message });
}

async function autorecordtyping(sock, message, args) {
  const from = message.key.remoteJid;
  const option = args[0]?.toLowerCase();
  if (option === 'on') {
    setOwnerProp('autoRecordTyping', true);
    return sock.sendMessage(from, { text: '⌨️ *Auto Record Typing: ON*' }, { quoted: message });
  }
  if (option === 'off') {
    setOwnerProp('autoRecordTyping', false);
    return sock.sendMessage(from, { text: '🔕 *Auto Record Typing: OFF*' }, { quoted: message });
  }
  const owner = getOwner();
  return sock.sendMessage(from, { text: `🎙️ *AUTO RECORD TYPING*\nStatus: *${owner.autoRecordTyping ? 'ON ✅' : 'OFF ❌'}*\n_Usage: .autorecordtyping on/off_` }, { quoted: message });
}

async function typing(sock, message, args) {
  const from = message.key.remoteJid;
  const option = args[0]?.toLowerCase();
  if (option === 'on') {
    setOwnerProp('typing', true);
    await sock.sendPresenceUpdate('composing', from);
    return sock.sendMessage(from, { text: '⌨️ *Typing Indicator: ON*' }, { quoted: message });
  }
  if (option === 'off') {
    setOwnerProp('typing', false);
    await sock.sendPresenceUpdate('paused', from);
    return sock.sendMessage(from, { text: '🔕 *Typing Indicator: OFF*' }, { quoted: message });
  }
  const owner = getOwner();
  return sock.sendMessage(from, { text: `⌨️ *TYPING*\nStatus: *${owner.typing ? 'ON ✅' : 'OFF ❌'}*\n_Usage: .typing on/off_` }, { quoted: message });
}

async function record(sock, message, args) {
  const from = message.key.remoteJid;
  const option = args[0]?.toLowerCase();
  if (option === 'on') {
    setOwnerProp('record', true);
    await sock.sendPresenceUpdate('recording', from);
    return sock.sendMessage(from, { text: '🎙️ *Recording Indicator: ON*' }, { quoted: message });
  }
  if (option === 'off') {
    setOwnerProp('record', false);
    await sock.sendPresenceUpdate('paused', from);
    return sock.sendMessage(from, { text: '🔕 *Recording Indicator: OFF*' }, { quoted: message });
  }
  const owner = getOwner();
  return sock.sendMessage(from, { text: `🎙️ *RECORD*\nStatus: *${owner.record ? 'ON ✅' : 'OFF ❌'}*\n_Usage: .record on/off_` }, { quoted: message });
}

async function handleAntideletePm(sock, ownerJid, deletedKey, cachedMessage) {
  const owner = getOwner();
  if (!owner.antideletePm || !cachedMessage) return;
  const from = cachedMessage.key.remoteJid;
  if (from.endsWith('@g.us')) return;
  const senderNum = from.split('@')[0];
  await sock.sendMessage(ownerJid, {
    text: `🗑️ *Anti Delete PM*\n\nDeleted message from *+${senderNum}*:\n\n"${cachedMessage._text || '[Media/Unknown]'}"`,
  });
}

module.exports = { autostatusview, antideletepn, autorecordtyping, typing, record, handleAntideletePm };
