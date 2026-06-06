const auto = {
  autoread: true,
  autotyping: false,
  autorecord: false,
  autostatus: true
};

module.exports = {

  ".autoread": async (sock, msg, text, sender) => {
    auto.autoread = !auto.autoread;

    return sock.sendMessage(sender, {
      text: `👁️ AutoRead: ${auto.autoread ? "ON" : "OFF"}`
    });
  },

  ".autotyping": async (sock, msg, text, sender) => {
    auto.autotyping = !auto.autotyping;

    return sock.sendMessage(sender, {
      text: `⌨️ AutoTyping: ${auto.autotyping ? "ON" : "OFF"}`
    });
  },

  ".autorecord": async (sock, msg, text, sender) => {
    auto.autorecord = !auto.autorecord;

    return sock.sendMessage(sender, {
      text: `🎙️ AutoRecord: ${auto.autorecord ? "ON" : "OFF"}`
    });
  }

};
