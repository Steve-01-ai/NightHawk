const config = require("../config");

async function handleMessage(sock, msg) {
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text;

  const sender = msg.key.remoteJid;

  if (!text) return;

  if (text === ".ping") {
    await sock.sendMessage(sender, {
      text: "🦅 Night Hawk is alive!"
    });
  }

  if (text === ".menu") {
    await sock.sendMessage(sender, {
      text: `
🦅 NIGHT HAWK BOT MENU

Commands:
.ping
.menu
`
    });
  }
}

module.exports = { handleMessage };
