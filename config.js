require('dotenv').config();

const config = {
  botName: 'NIGHT HAWK',
  botVersion: '1.0.0',
  prefix: '.',
  // ⚠️ IMPORTANT: Set this in your hosting ENV variables
  // Leave blank here — bot will ask for it at startup if not set
  ownerNumber: process.env.OWNER_NUMBER || '',
  botPrivate: true,
  sessionPath: './sessions/auth_info_baileys',
  connectMessage: '🦅 *NIGHT HAWK connected successfully*',
  pingMessage: '🦅 *Sleeping is for the weak* 💀',
  dbPath: './lib/db.json',
  downloadsDir: './downloads/',
  maxVideoSize: 50,
  maxAudioSize: 16,
  defaultAntilink: { status: false, action: 'delete' },
  defaultAntigroupmention: { status: false, action: 'delete' },
  autoStatusView: false,
  antideletePm: false,
  autoRecordTyping: false,
  typingStatus: false,
  recordStatus: false,
};

module.exports = config;
