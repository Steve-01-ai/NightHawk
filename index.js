const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const readline = require("readline");
const { handleMessage } = require("./lib/handler");

function ask(q) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(q, ans => {
    rl.close();
    resolve(ans);
  }));
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection }) => {
    if (connection === "open") {
      console.log("🦅 Night Hawker Connected");
    }

    if (connection === "close") {
      console.log("Restarting...");
      startBot();
    }
  });

  // ⭐ WAIT UNTIL SOCKET IS READY BEFORE PAIRING
  setTimeout(async () => {
    try {
      if (!sock.authState.creds.registered) {

        let phone = await ask("📱 Enter number (+2547XXXXXXX): ");

        // CLEAN PHONE FORMAT (VERY IMPORTANT)
        phone = phone.replace(/[^0-9]/g, "");

        const code = await sock.requestPairingCode(phone);

        console.log("\n━━━━━━━━━━━━━━━━━━");
        console.log("🦅 PAIRING CODE:");
        console.log(code);
        console.log("━━━━━━━━━━━━━━━━━━\n");
      }
    } catch (err) {
      console.log("❌ Pairing failed:", err.message);
    }
  }, 3000);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    await handleMessage(sock, msg);
  });
}

startBot();
