const axios = require('axios');
const ytSearch = require('yt-search');
const fs = require('fs-extra');
const config = require('../../config');

fs.ensureDirSync(config.downloadsDir);

async function sendSearching(sock, from, message) {
  await sock.sendMessage(from, { text: '🔍 *Searching... please wait*' }, { quoted: message });
}

async function getYoutubeAudio(url) {
  const res = await axios.post('https://api.cobalt.tools/api/json', {
    url, vCodec: 'h264', vQuality: '720', aFormat: 'mp3', isAudioOnly: true,
  }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
  if (res.data?.status === 'stream' || res.data?.status === 'redirect') return res.data.url;
  if (res.data?.status === 'picker') return res.data.picker[0]?.url;
  return null;
}

async function getYoutubeVideo(url) {
  const res = await axios.post('https://api.cobalt.tools/api/json', {
    url, vCodec: 'h264', vQuality: '720', aFormat: 'mp3', isAudioOnly: false,
  }, { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 30000 });
  if (res.data?.status === 'stream' || res.data?.status === 'redirect') return res.data.url;
  if (res.data?.status === 'picker') return res.data.picker[0]?.url;
  return null;
}

async function play(sock, message, args) {
  const from = message.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(from, { text: '❌ *Usage: .play <song name>*' }, { quoted: message });
  await sendSearching(sock, from, message);
  try {
    const results = await ytSearch(query);
    const video = results.videos[0];
    if (!video) return sock.sendMessage(from, { text: '❌ *No results found.*' }, { quoted: message });
    await sock.sendMessage(from, { text: `🎵 *Now Playing*\n*${video.title}*\n_${video.timestamp} • ${video.author.name}_\n\n_Downloading..._` }, { quoted: message });
    const audioUrl = await getYoutubeAudio(video.url);
    if (!audioUrl) throw new Error('Could not extract audio.');
    await sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mpeg', ptt: false }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Play failed:* ${err.message}` }, { quoted: message });
  }
}

async function song(sock, message, args) {
  const from = message.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(from, { text: '❌ *Usage: .song <song name>*' }, { quoted: message });
  await sendSearching(sock, from, message);
  try {
    const results = await ytSearch(query);
    const video = results.videos[0];
    if (!video) return sock.sendMessage(from, { text: '❌ *No results found.*' }, { quoted: message });
    await sock.sendMessage(from, { text: `🎶 *Downloading:* ${video.title}` }, { quoted: message });
    const audioUrl = await getYoutubeAudio(video.url);
    if (!audioUrl) throw new Error('Could not extract audio.');
    await sock.sendMessage(from, { audio: { url: audioUrl }, mimetype: 'audio/mp4', ptt: false }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Song download failed:* ${err.message}` }, { quoted: message });
  }
}

async function video(sock, message, args) {
  const from = message.key.remoteJid;
  const query = args.join(' ');
  if (!query) return sock.sendMessage(from, { text: '❌ *Usage: .video <search/url>*' }, { quoted: message });
  await sendSearching(sock, from, message);
  try {
    let videoUrl = query, title = query, duration = '';
    if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
      const results = await ytSearch(query);
      const v = results.videos[0];
      if (!v) return sock.sendMessage(from, { text: '❌ *No results found.*' }, { quoted: message });
      videoUrl = v.url; title = v.title; duration = v.timestamp;
    }
    await sock.sendMessage(from, { text: `🎬 *Downloading:* ${title}${duration ? ` • ${duration}` : ''}` }, { quoted: message });
    const dlUrl = await getYoutubeVideo(videoUrl);
    if (!dlUrl) throw new Error('Could not extract video.');
    await sock.sendMessage(from, { video: { url: dlUrl }, caption: `🦅 *NIGHT HAWK* | ${title}` }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Video failed:* ${err.message}` }, { quoted: message });
  }
}

async function instagram(sock, message, args) {
  const from = message.key.remoteJid;
  const url = args[0];
  if (!url || !url.includes('instagram.com')) return sock.sendMessage(from, { text: '❌ *Usage: .instagram <url>*' }, { quoted: message });
  await sock.sendMessage(from, { text: '📥 *Downloading from Instagram...*' }, { quoted: message });
  try {
    const res = await axios.get('https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index', {
      params: { url },
      headers: { 'X-RapidAPI-Host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com', 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '' },
      timeout: 20000,
    });
    const media = res.data?.media;
    if (!media) throw new Error('No media found.');
    const mediaUrl = Array.isArray(media) ? media[0] : media;
    const isVideo = mediaUrl.includes('.mp4');
    if (isVideo) {
      await sock.sendMessage(from, { video: { url: mediaUrl }, caption: '🦅 *NIGHT HAWK* | Instagram' }, { quoted: message });
    } else {
      await sock.sendMessage(from, { image: { url: mediaUrl }, caption: '🦅 *NIGHT HAWK* | Instagram' }, { quoted: message });
    }
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Instagram failed:* ${err.message}` }, { quoted: message });
  }
}

async function twitter(sock, message, args) {
  const from = message.key.remoteJid;
  const url = args[0];
  if (!url || (!url.includes('twitter.com') && !url.includes('x.com'))) return sock.sendMessage(from, { text: '❌ *Usage: .twitter <url>*' }, { quoted: message });
  await sock.sendMessage(from, { text: '🐦 *Downloading from Twitter/X...*' }, { quoted: message });
  try {
    const res = await axios.get('https://twitter-video-downloader6.p.rapidapi.com/twitter', {
      params: { url },
      headers: { 'X-RapidAPI-Host': 'twitter-video-downloader6.p.rapidapi.com', 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '' },
      timeout: 20000,
    });
    const videos = res.data?.videos;
    if (!videos?.length) throw new Error('No video found.');
    const best = videos.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    await sock.sendMessage(from, { video: { url: best.url }, caption: '🦅 *NIGHT HAWK* | Twitter/X' }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Twitter failed:* ${err.message}` }, { quoted: message });
  }
}

async function tiktok(sock, message, args) {
  const from = message.key.remoteJid;
  const url = args[0];
  if (!url || !url.includes('tiktok.com')) return sock.sendMessage(from, { text: '❌ *Usage: .tiktok <url>*' }, { quoted: message });
  await sock.sendMessage(from, { text: '🎵 *Downloading from TikTok...*' }, { quoted: message });
  try {
    const res = await axios.post('https://api.tikmate.app/api/lookup', { url }, { headers: { 'Content-Type': 'application/json' }, timeout: 20000 });
    const token = res.data?.token;
    const id = res.data?.id;
    if (!token || !id) throw new Error('Could not fetch TikTok.');
    await sock.sendMessage(from, { video: { url: `https://tikmate.app/download/${token}/${id}.mp4` }, caption: '🦅 *NIGHT HAWK* | TikTok' }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *TikTok failed:* ${err.message}` }, { quoted: message });
  }
}

async function facebook(sock, message, args) {
  const from = message.key.remoteJid;
  const url = args[0];
  if (!url || (!url.includes('facebook.com') && !url.includes('fb.watch'))) return sock.sendMessage(from, { text: '❌ *Usage: .facebook <url>*' }, { quoted: message });
  await sock.sendMessage(from, { text: '📘 *Downloading from Facebook...*' }, { quoted: message });
  try {
    const res = await axios.get('https://facebook-video-downloader6.p.rapidapi.com/fbdown/getLinks', {
      params: { url },
      headers: { 'X-RapidAPI-Host': 'facebook-video-downloader6.p.rapidapi.com', 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '' },
      timeout: 20000,
    });
    const dlUrl = res.data?.hd_links?.[0]?.url || res.data?.sd_links?.[0]?.url;
    if (!dlUrl) throw new Error('No video found.');
    await sock.sendMessage(from, { video: { url: dlUrl }, caption: '🦅 *NIGHT HAWK* | Facebook' }, { quoted: message });
  } catch (err) {
    await sock.sendMessage(from, { text: `❌ *Facebook failed:* ${err.message}` }, { quoted: message });
  }
}

module.exports = { play, song, video, instagram, twitter, tiktok, facebook };
