async function handleMessage(sock, msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const sender = msg.key.remoteJid;

  if (!text) return;

  const cmd = text.split(" ")[0].toLowerCase();

  if (cmd === ".ping") {
    return sock.sendMessage(sender, {
      text: "🦅 Night Hawker Online"
    });
  }

  if (cmd === ".menu") {
    return sock.sendMessage(sender, {
      text: `
🦅 NIGHT HAWKER

.ping
.menu
`
    });
  }
}

module.exports = { handleMessage };
