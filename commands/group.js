const settings = {
  antilink: {},
  antigroupmention: {}
};

module.exports = {

  ".antilink": async (sock, msg, text, sender) => {
    const state = text.split(" ")[1];

    if (state === "on") {
      settings.antilink[sender] = true;
    }

    if (state === "off") {
      settings.antilink[sender] = false;
    }

    return sock.sendMessage(sender, {
      text: `🚫 Antilink: ${state.toUpperCase()}`
    });
  },

  ".tagall": async (sock, msg, text, sender) => {
    const metadata = await sock.groupMetadata(sender);
    const users = metadata.participants.map(p => p.id);

    let txt = "📢 TAG ALL\n\n";
    users.forEach(u => txt += `@${u.split("@")[0]}\n`);

    return sock.sendMessage(sender, {
      text: txt,
      mentions: users
    });
  },

  ".hidetag": async (sock, msg, text, sender) => {
    const metadata = await sock.groupMetadata(sender);
    const users = metadata.participants.map(p => p.id);

    const msgText = text.replace(".hidetag", "");

    return sock.sendMessage(sender, {
      text: msgText,
      mentions: users
    });
  }

};
