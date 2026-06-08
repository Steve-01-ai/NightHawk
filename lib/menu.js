const config = require('../config');
const p = config.prefix;

const menuMain = () => `
╔══════════════════════════╗
║   🦅  *NIGHT HAWK BOT*   ║
╚══════════════════════════╝

*Version:* ${config.botVersion}
*Prefix:* \`${p}\`

*${p}groupmenu* — Group Commands
*${p}ownermenu* — Owner Commands
*${p}dlmenu* — Download Commands
`.trim();

const menuGroup = () => `
╔══════════════════════════╗
║  🦅 *GROUP COMMANDS MENU* ║
╚══════════════════════════╝

*┌─── ANTILINK ───*
*${p}antilink on* — Enable antilink
*${p}antilink off* — Disable antilink
*${p}antilink delete* — Action: delete msg
*${p}antilink kick* — Action: kick sender
*${p}antilink warn* — Action: warn sender

*┌─── ANTI GROUP MENTION ───*
*${p}antigroupmention on* — Enable
*${p}antigroupmention off* — Disable
*${p}antigroupmention delete* — Action: delete

*┌─── TAG COMMANDS ───*
*${p}tagall [message]* — Tag all members
*${p}hidetag [message]* — Tag all silently
`.trim();

const menuOwner = () => `
╔══════════════════════════╗
║  🦅 *OWNER COMMANDS MENU* ║
╚══════════════════════════╝

*${p}autostatusview on/off* — Auto view statuses
*${p}antideletepn on/off* — Recover deleted PMs
*${p}autorecordtyping on/off* — Typing on all chats
*${p}typing on/off* — Manual typing indicator
*${p}record on/off* — Manual recording indicator
`.trim();

const menuDownload = () => `
╔══════════════════════════╗
║ 🦅 *DOWNLOAD COMMANDS MENU* ║
╚══════════════════════════╝

*${p}play [song name]* — Play audio
*${p}song [song name]* — Download MP3
*${p}video [search/url]* — Download MP4
*${p}instagram [url]* — Download IG media
*${p}twitter [url]* — Download Twitter media
*${p}tiktok [url]* — Download TikTok video
*${p}facebook [url]* — Download FB video
`.trim();

module.exports = { menuMain, menuGroup, menuOwner, menuDownload };
