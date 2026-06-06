const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const { handleMessage } = require("./lib/handler");

function ask(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve =>
    rl.question(query, ans => {
      rl.close();
      resolve(ans);
    })
  );
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("🦅 Night Hawker connected");
    }

    if (connection === "close") {
      console.log("Reconnecting...");
      startBot();
    }
  });

  // ⭐ PAIRING CODE MODE (NO QR)
  if (!sock.authState.creds.registered) {
    const phone = await ask("📱 Enter number (+2547XXXXXXX): ");

    const code = await sock.requestPairingCode(phone);

    console.log("\n━━━━━━━━━━━━━━");
    console.log("🦅 YOUR PAIRING CODE:");
    console.log(code);
    console.log("━━━━━━━━━━━━━━\n");
    console.log("Go to WhatsApp → Link device → Pair with code\n");
  }

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    await handleMessage(sock, msg);
  });
}

startBot();
