const config = {
  owner: "2547XXXXXXXX@s.whatsapp.net"
};

function isAdmin(sender) {
  return sender === config.owner;
}

module.exports = {

  ".admin": async (sock, msg, text, sender) => {
    if (!isAdmin(sender)) return;

    return sock.sendMessage(sender, {
      text: `
👑 ADMIN PANEL

.kick
.promote
.demote
.ban
.unban
`
    });
  }

};
