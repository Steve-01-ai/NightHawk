const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const { handleMessage } = require("./lib/handler");

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, qr } = update;

    if (connection === "open") {
      console.log("🦅 Night Hawk Connected");
    }
  });

  // 🔥 PAIRING CODE SYSTEM
  if (!sock.authState.creds.registered) {
    const phoneNumber = await askQuestion("📱 Enter your number (e.g +2547xxxxxxx): ");

    const code = await sock.requestPairingCode(phoneNumber);

    console.log("\n🦅 YOUR PAIRING CODE:\n", code);
    console.log("👉 Open WhatsApp → Link device → Enter this code\n");
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    await handleMessage(sock, msg);
  });
}

startBot();
