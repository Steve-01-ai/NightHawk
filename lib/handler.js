const fs = require("fs");
const path = require("path");

const commands = {};

// LOAD ALL COMMAND FILES
fs.readdirSync(__dirname + "/commands").forEach(file => {
  if (file.endsWith(".js")) {
    const cmd = require("./commands/" + file);
    Object.assign(commands, cmd);
  }
});

async function handleMessage(sock, msg) {
  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  const sender = msg.key.remoteJid;

  if (!text) return;

  const cmd = text.trim().split(" ")[0].toLowerCase();

  if (commands[cmd]) {
    return commands[cmd](sock, msg, text, sender);
  }
}

module.exports = { handleMessage };
