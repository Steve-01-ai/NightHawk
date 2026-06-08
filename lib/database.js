const fs = require('fs-extra');
const path = require('path');
const config = require('../config');

const DB_PATH = path.resolve(config.dbPath);

const defaultState = {
  groups: {},
  owner: {
    autoStatusView: config.autoStatusView,
    antideletePm: config.antideletePm,
    autoRecordTyping: config.autoRecordTyping,
    typing: config.typingStatus,
    record: config.recordStatus,
  },
  warnCount: {},
};

let db = {};

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      db = fs.readJsonSync(DB_PATH);
    } else {
      db = JSON.parse(JSON.stringify(defaultState));
      saveDB();
    }
  } catch {
    db = JSON.parse(JSON.stringify(defaultState));
  }
  if (!db.groups) db.groups = {};
  if (!db.owner) db.owner = JSON.parse(JSON.stringify(defaultState.owner));
  if (!db.warnCount) db.warnCount = {};
}

function saveDB() {
  fs.ensureDirSync(path.dirname(DB_PATH));
  fs.writeJsonSync(DB_PATH, db, { spaces: 2 });
}

function getGroup(jid) {
  if (!db.groups[jid]) {
    db.groups[jid] = {
      antilink: { status: false, action: 'delete' },
      antigroupmention: { status: false, action: 'delete' },
    };
    saveDB();
  }
  return db.groups[jid];
}

function setGroupProp(jid, prop, value) {
  const g = getGroup(jid);
  g[prop] = value;
  saveDB();
}

function getOwner() { return db.owner; }

function setOwnerProp(prop, value) {
  db.owner[prop] = value;
  saveDB();
}

function getWarn(userJid, groupJid) {
  return db.warnCount[`${userJid}@${groupJid}`] || 0;
}

function addWarn(userJid, groupJid) {
  const key = `${userJid}@${groupJid}`;
  db.warnCount[key] = (db.warnCount[key] || 0) + 1;
  saveDB();
  return db.warnCount[key];
}

function resetWarn(userJid, groupJid) {
  db.warnCount[`${userJid}@${groupJid}`] = 0;
  saveDB();
}

loadDB();

module.exports = { db, loadDB, saveDB, getGroup, setGroupProp, getOwner, setOwnerProp, getWarn, addWarn, resetWarn };
