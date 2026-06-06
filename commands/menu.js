module.exports = {
  ".menu": async (sock, msg, text, sender) => {
    return sock.sendMessage(sender, {
      text: `
╭━━〔 🦅 NIGHT HAWKER 〕━━╮
┃ 👤 Owner : Not Set
┃ ⚙️ Prefix : .
┃ 📡 Mode : Public
╰━━━━━━━━━━━━━━━╯

╭━━〔 📥 DOWNLOAD 〕━━╮
┃ .play
┃ .song
┃ .video
┃ .tiktok
┃ .instagram
┃ .facebook
┃ .twitter
╰━━━━━━━━━━━━━━━╯

╭━━〔 👥 GROUP 〕━━╮
┃ .antilink on/off
┃ .antigroupmention on/off
┃ .tagall
┃ .hidetag
╰━━━━━━━━━━━━━━━╯

╭━━〔 👑 ADMIN 〕━━╮
┃ .admin
┃ .kick
┃ .promote
┃ .demote
┃ .ban
┃ .unban
╰━━━━━━━━━━━━━━━╯

╭━━〔 ⚙️ AUTO 〕━━╮
┃ .autoread
┃ .autotyping
┃ .autorecord
┃ .autostatus
╰━━━━━━━━━━━━━━━╯

╭━━〔 ⚡ OTHER 〕━━╮
┃ .ping
┃ .repo
╰━━━━━━━━━━━━━━━╯

〘 Night Hawker 〙
`
    });
  }
};
