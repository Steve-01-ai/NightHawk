async function handleMessage(sock, msg) {
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    "";

  const sender = msg.key.remoteJid;

  if (!text) return;

  const args = text.trim().split(" ");
  const cmd = args[0].toLowerCase();

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
┃ 👤 Owner : Steve
┃ ⚙️ Prefix : .
┃ 📡 Mode : Public
╰━━━━━━━━━━━━━━━╯

╭━━〔 📥 DOWNLOAD 〕━━╮
┃ .play
┃ .song
┃ .video
┃ .tiktok
┃ .facebook
┃ .instagram
┃ .twitter
╰━━━━━━━━━━━━━━━╯

╭━━〔 👥 GROUP 〕━━╮
┃ .antilink on/off
┃ .antigroupmention on/off
┃ .tagall
┃ .hidetag
╰━━━━━━━━━━━━━━━╯

╭━━〔 👑 ADMIN 〕━━╮
┃ .kick
┃ .promote
┃ .demote
╰━━━━━━━━━━━━━━━╯

╭━━〔 ⚙️ AUTO 〕━━╮
┃ .autoread
┃ .autotyping
┃ .autorecord
┃ .autostatus
╰━━━━━━━━━━━━━━━╯

╭━━〔 ⚡ OTHER 〕━━╮
┃ .ping
┃ .menu
╰━━━━━━━━━━━━━━━╯

🦅 Night Hawker V1
`
    });
  }

  // PLAY
  if (cmd === ".play") {
    const query = args.slice(1).join(" ");
    return sock.sendMessage(sender, {
      text: `🎵 Searching song:\n${query || "No song provided"}`
    });
  }

  // SONG
  if (cmd === ".song") {
    const query = args.slice(1).join(" ");
    return sock.sendMessage(sender, {
      text: `🎧 Downloading song:\n${query || "No song provided"}`
    });
  }

  // VIDEO
  if (cmd === ".video") {
    const query = args.slice(1).join(" ");
    return sock.sendMessage(sender, {
      text: `🎬 Downloading video:\n${query || "No video provided"}`
    });
  }

  // TAGALL
  if (cmd === ".tagall") {
    return sock.sendMessage(sender, {
      text: "📢 Tagall feature coming soon."
    });
  }

  // HIDETAG
  if (cmd === ".hidetag") {
    return sock.sendMessage(sender, {
      text: "👥 Hidetag feature coming soon."
    });
  }

  // ANTILINK
  if (cmd === ".antilink") {
    const state = args[1] || "off";
    return sock.sendMessage(sender, {
      text: `🚫 Antilink ${state.toUpperCase()}`
    });
  }

  // ANTIGROUPMENTION
  if (cmd === ".antigroupmention") {
    const state = args[1] || "off";
    return sock.sendMessage(sender, {
      text: `📛 AntiGroupMention ${state.toUpperCase()}`
    });
  }
}

module.exports = { handleMessage };
