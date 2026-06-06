const {
  default: makeWASocket,
  useMultiFileAuthState
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, qr }) => {
    if (qr) {
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open") {
      console.log("🦅 Night Hawk Bot Connected");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text;

    if (text === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "🦅 Night Hawk is alive!"
      });
    }

    if (text === ".menu") {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `
🦅 NIGHT HAWK BOT

Commands:
.ping
.menu
        `
      });
    }
  });
}

startBot();
