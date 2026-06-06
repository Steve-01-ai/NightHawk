const config = require("../config");

async function handleMessage(sock, msg) {
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text;

  const sender = msg.key.remoteJid;

  if (!text) return;

  // ⭐ MENU
  if (text === ".menu") {
    return sock.sendMessage(sender, {
      text: `
┏▣ ◈ *NIGHT HAWKER* ◈
┃ *ᴏᴡɴᴇʀ* : Not Set
┃ *ᴘʀᴇғɪx* : [ . ]
┃ *ᴍᴏᴅᴇ* : Public
┃ *ᴠᴇʀsɪᴏɴ* : 1.0.0
┗▣

┏▣ ◈ *COMMANDS* ◈
│➽ .menu
│➽ .ping
│➽ .repo
┗▣
`
    });
  }

  // ⭐ PING
  if (text === ".ping") {
    return sock.sendMessage(sender, {
      text: "🦅 Night Hawker is alive!"
    });
  }

  // ⭐ REPO
  if (text === ".repo") {
    return sock.sendMessage(sender, {
      text: "📦 Night Hawker V1 Bot (Fresh Build)"
    });
  }
}

module.exports = { handleMessage };
