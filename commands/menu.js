module.exports = async (sock, sender) => {
  await sock.sendMessage(sender, {
    text: `
🦅 NIGHT HAWK BOT MENU

Commands:
.ping - check bot status
.menu - show this menu
`
  });
};
