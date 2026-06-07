const settings = {
  autorecord: true,
  antilink: {},
  antigroupmention: {}
};

const warnings = {};

async function handleMessage(sock, msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const sender = msg.key.remoteJid;

  if (!text) return;

  const args = text.trim().split(" ");
  const cmd = args[0].toLowerCase();

  // AUTO RECORD
  if (settings.autorecord) {
    try {
      await sock.sendPresenceUpdate("recording", sender);
    } catch {}
  }

  // ANTILINK DETECTION
  if (
    settings.antilink[sender] &&
    /(https?:\/\/|chat\.whatsapp\.com)/i.test(text)
  ) {
    try {
      await sock.sendMessage(sender, {
        delete: msg.key
      });
    } catch {}

    return sock.sendMessage(sender, {
      text: "🚫 Link detected and deleted."
    });
  }

  // ANTIGROUPMENTION DETECTION
  if (
    settings.antigroupmention[sender] &&
    text.includes("@")
  ) {
    const user =
      msg.key.participant ||
      msg.key.remoteJid;

    warnings[user] = (warnings[user] || 0) + 1;

    try {
      await sock.sendMessage(sender, {
        delete: msg.key
      });
    } catch {}

    await sock.sendMessage(sender, {
      text: `⚠️ Warning ${warnings[user]}/3`
    });

    if (warnings[user] >= 3) {
      try {
        await sock.groupParticipantsUpdate(
          sender,
          [user],
          "remove"
        );
      } catch {}

      delete warnings[user];
    }

    return;
  }

  // PING
  if (cmd === ".ping") {
    return sock.sendMessage(sender, {
      text: "🦅 Night Hawker Online"
    });
  }

  // MENU
  if (cmd === ".menu") {
    return sock.sendMessage(sender, {
      text: `
╭━━〔 🦅 NIGHT HAWKER 〕━━╮
┃ ⚙️ Prefix : .
┃ 📡 Mode : Public
╰━━━━━━━━━━━━━━━╯

╭━━〔 🛡️ SECURITY 〕━━╮
┃ .autorecord
┃ .antilink on
┃ .antilink off
┃ .antigroupmention on
┃ .antigroupmention off
┃ .tagall
┃ .hidetag <message>
╰━━━━━━━━━━━━━━━╯

╭━━〔 ⚡ SYSTEM 〕━━╮
┃ .ping
┃ .menu
╰━━━━━━━━━━━━━━━╯

🦅 Night Hawker V1
`
    });
  }

  // AUTORECORD
  if (cmd === ".autorecord") {
    settings.autorecord = !settings.autorecord;

    return sock.sendMessage(sender, {
      text: `🎙️ AutoRecord ${
        settings.autorecord ? "ON" : "OFF"
      }`
    });
  }

  // ANTILINK
  if (cmd === ".antilink") {
    const state = args[1];

    if (!state) {
      return sock.sendMessage(sender, {
        text: "Usage:\n.antilink on\n.antilink off"
      });
    }

    if (state === "on") {
      settings.antilink[sender] = true;
    }

    if (state === "off") {
      settings.antilink[sender] = false;
    }

    return sock.sendMessage(sender, {
      text: `🚫 AntiLink ${state.toUpperCase()}`
    });
  }

  // ANTIGROUPMENTION
  if (cmd === ".antigroupmention") {
    const state = args[1];

    if (!state) {
      return sock.sendMessage(sender, {
        text:
          "Usage:\n.antigroupmention on\n.antigroupmention off"
      });
    }

    if (state === "on") {
      settings.antigroupmention[sender] = true;
    }

    if (state === "off") {
      settings.antigroupmention[sender] = false;
    }

    return sock.sendMessage(sender, {
      text: `⚠️ AntiGroupMention ${state.toUpperCase()}`
    });
  }

  // TAGALL
  if (cmd === ".tagall") {
    try {
      const metadata =
        await sock.groupMetadata(sender);

      const members =
        metadata.participants.map(
          p => p.id
        );

      let txt = "📢 *TAG ALL*\n\n";

      for (const member of members) {
        txt += `@${member.split("@")[0]}\n`;
      }

      return sock.sendMessage(sender, {
        text: txt,
        mentions: members
      });
    } catch {
      return sock.sendMessage(sender, {
        text: "❌ Use this command in a group."
      });
    }
  }

  // HIDETAG
  if (cmd === ".hidetag") {
    try {
      const metadata =
        await sock.groupMetadata(sender);

      const members =
        metadata.participants.map(
          p => p.id
        );

      const message =
        args.slice(1).join(" ");

      if (!message) {
        return sock.sendMessage(sender, {
          text:
            "Example:\n.hidetag Hello everyone"
        });
      }

      return sock.sendMessage(sender, {
        text: message,
        mentions: members
      });
    } catch {
      return sock.sendMessage(sender, {
        text: "❌ Use this command in a group."
      });
    }
  }
}

module.exports = { handleMessage };
