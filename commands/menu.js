if (cmd === ".menu") {
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
┃ .antilink on
┃ .antilink off
┃ .antigroupmention on
┃ .antigroupmention off
┃ .tagall
┃ .hidetag
╰━━━━━━━━━━━━━━━╯

╭━━〔 👑 ADMIN 〕━━╮
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
`
  });
}
