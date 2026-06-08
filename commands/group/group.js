const { setGroupProp, getGroup, addWarn } = require('../../lib/database');
const { isAdmin, isBotAdmin } = require('../../lib/helper');

async function antilink(sock, message, args, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  if (!isAdmin(groupMetadata, sender)) {
    return sock.sendMessage(from, { text: '❌ *Admins only.*' }, { quoted: message });
  }
  const option = args[0]?.toLowerCase();
  const groupData = getGroup(from);

  if (option === 'on') {
    setGroupProp(from, 'antilink', { ...groupData.antilink, status: true });
    return sock.sendMessage(from, { text: `✅ *Antilink ON*\n🔧 Action: *${groupData.antilink.action}*` }, { quoted: message });
  }
  if (option === 'off') {
    setGroupProp(from, 'antilink', { ...groupData.antilink, status: false });
    return sock.sendMessage(from, { text: `🔕 *Antilink OFF*` }, { quoted: message });
  }
  if (['delete', 'kick', 'warn'].includes(option)) {
    setGroupProp(from, 'antilink', { ...groupData.antilink, action: option });
    return sock.sendMessage(from, { text: `⚙️ *Antilink action: ${option.toUpperCase()}*` }, { quoted: message });
  }
  return sock.sendMessage(from, {
    text: `🔗 *ANTILINK*\nStatus: *${groupData.antilink.status ? 'ON ✅' : 'OFF ❌'}*\nAction: *${groupData.antilink.action.toUpperCase()}*\n\n_Usage: .antilink on/off/delete/kick/warn_`
  }, { quoted: message });
}

async function antigroupmention(sock, message, args, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  if (!isAdmin(groupMetadata, sender)) {
    return sock.sendMessage(from, { text: '❌ *Admins only.*' }, { quoted: message });
  }
  const option = args[0]?.toLowerCase();
  const groupData = getGroup(from);

  if (option === 'on') {
    setGroupProp(from, 'antigroupmention', { ...groupData.antigroupmention, status: true });
    return sock.sendMessage(from, { text: `✅ *Anti Group Mention ON*` }, { quoted: message });
  }
  if (option === 'off') {
    setGroupProp(from, 'antigroupmention', { ...groupData.antigroupmention, status: false });
    return sock.sendMessage(from, { text: `🔕 *Anti Group Mention OFF*` }, { quoted: message });
  }
  if (option === 'delete') {
    setGroupProp(from, 'antigroupmention', { ...groupData.antigroupmention, action: 'delete' });
    return sock.sendMessage(from, { text: `⚙️ *Action set to: DELETE*` }, { quoted: message });
  }
  return sock.sendMessage(from, {
    text: `📢 *ANTI GROUP MENTION*\nStatus: *${groupData.antigroupmention.status ? 'ON ✅' : 'OFF ❌'}*\n\n_Usage: .antigroupmention on/off/delete_`
  }, { quoted: message });
}

async function tagall(sock, message, args, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  if (!isAdmin(groupMetadata, sender)) {
    return sock.sendMessage(from, { text: '❌ *Admins only.*' }, { quoted: message });
  }
  const mentions = groupMetadata.participants.map(p => p.id);
  const customMessage = args.join(' ') || '📢 *ATTENTION EVERYONE!*';
  let text = `${customMessage}\n\n`;
  groupMetadata.participants.forEach((p, i) => {
    text += `@${p.id.split('@')[0]} `;
    if ((i + 1) % 5 === 0) text += '\n';
  });
  return sock.sendMessage(from, { text: text.trim(), mentions }, { quoted: message });
}

async function hidetag(sock, message, args, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  if (!isAdmin(groupMetadata, sender)) {
    return sock.sendMessage(from, { text: '❌ *Admins only.*' }, { quoted: message });
  }
  const mentions = groupMetadata.participants.map(p => p.id);
  const customMessage = args.join(' ') || '📢 *Message from admin*';
  let hiddenMentions = '';
  groupMetadata.participants.forEach(p => { hiddenMentions += `\u200B@${p.id.split('@')[0]} `; });
  return sock.sendMessage(from, { text: `${customMessage}\n${hiddenMentions}`.trim(), mentions }, { quoted: message });
}

async function handleAntilink(sock, message, text, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  const botJid = sock.user.id;
  const groupData = getGroup(from);
  if (!groupData.antilink.status) return;
  if (isAdmin(groupMetadata, sender) || sender === botJid) return;

  await sock.sendMessage(from, { delete: message.key });
  const action = groupData.antilink.action;

  if (action === 'delete') {
    await sock.sendMessage(from, { text: `🔗 *Link deleted!*\n@${sender.split('@')[0]} no links allowed.`, mentions: [sender] });
  } else if (action === 'kick') {
    await sock.sendMessage(from, { text: `⛔ *@${sender.split('@')[0]} removed for sending a link.*`, mentions: [sender] });
    if (isBotAdmin(groupMetadata, botJid)) await sock.groupParticipantsUpdate(from, [sender], 'remove');
  } else if (action === 'warn') {
    const warns = addWarn(sender, from);
    if (warns >= 3) {
      await sock.sendMessage(from, { text: `⛔ *@${sender.split('@')[0]} — 3 warnings reached. Removing...*`, mentions: [sender] });
      if (isBotAdmin(groupMetadata, botJid)) await sock.groupParticipantsUpdate(from, [sender], 'remove');
    } else {
      await sock.sendMessage(from, { text: `⚠️ *Warning ${warns}/3*\n@${sender.split('@')[0]} — ${3 - warns} warning(s) left.`, mentions: [sender] });
    }
  }
}

async function handleAntigroupmention(sock, message, text, groupMetadata) {
  const from = message.key.remoteJid;
  const sender = message.key.participant || message.key.remoteJid;
  const botJid = sock.user.id;
  const groupData = getGroup(from);
  if (!groupData.antigroupmention.status) return;
  if (isAdmin(groupMetadata, sender) || sender === botJid) return;
  await sock.sendMessage(from, { delete: message.key });
  await sock.sendMessage(from, { text: `🚫 *Group mention deleted!*\n@${sender.split('@')[0]} do not use @everyone/@all.`, mentions: [sender] });
}

module.exports = { antilink, antigroupmention, tagall, hidetag, handleAntilink, handleAntigroupmention };
