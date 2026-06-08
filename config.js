require('dotenv').config();

const config = {
  botName: 'NIGHT HAWK',
  botVersion: '2.0.0',
  prefix: '.',
  ownerNumber: process.env.OWNER_NUMBER || '',
  botPrivate: true,
  sessionPath: './sessions/auth_info_baileys',
  connectMessage: '🦅 *NIGHT HAWK v2.0.0 connected successfully*\n\n_Type .menu to get started_',
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
