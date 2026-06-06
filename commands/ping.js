module.exports = async (sock, sender) => {
  await sock.sendMessage(sender, {
    text: "🦅 Night Hawk is alive and running!"
  });
};
