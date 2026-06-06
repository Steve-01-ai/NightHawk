const { chatAI } = require("./ai");

// SIMPLE ADMIN LIST
const admins = ["2547XXXXXXX@s.whatsapp.net"];

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
🦅 NIGHT HAWK AI BOT

Commands:
.menu
.ping
.ai <message>
`
    });
  }

  // ⭐ PING
  if (text === ".ping") {
    return sock.sendMessage(sender, {
      text: "🦅 Night Hawk is alive 24/7"
    });
  }

  // ⭐ AI CHAT
  if (text.startsWith(".ai ")) {
    const prompt = text.replace(".ai ", "");
    const reply = await chatAI(prompt);

    return sock.sendMessage(sender, {
      text: reply
    });
  }

  // ⭐ ANTI-LINK SYSTEM
  if (text.includes("http") || text.includes("https")) {
    await sock.sendMessage(sender, {
      text: "🚫 Links are not allowed in Night Hawk group!"
    });

    // optional kick (only if group)
    try {
      await sock.groupParticipantsUpdate(sender, [msg.key.participant], "remove");
    } catch {}
  }
}

module.exports = { handleMessage };
