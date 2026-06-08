const axios = require("axios");

async function ytSearch(q) {
  const res = await axios.get(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
  );

  const id = res.data.split("watch?v=")[1]?.split('"')[0];
  if (!id) return null;

  return `https://youtu.be/${id}`;
}

module.exports = {

  ".play": async (sock, msg, text, sender) => {
    const query = text.replace(".play", "").trim();
    const url = await ytSearch(query);

    return sock.sendMessage(sender, {
      text: `🎧 Playing: ${query}\n${url}`
    });
  },

  ".song": async (sock, msg, text, sender) => {
    const query = text.replace(".song", "").trim();
    const url = await ytSearch(query);

    return sock.sendMessage(sender, {
      text: `🎵 Song: ${query}\n${url}`
    });
  },

  ".video": async (sock, msg, text, sender) => {
    const query = text.replace(".video", "").trim();
    const url = await ytSearch(query);

    return sock.sendMessage(sender, {
      text: `📺 Video: ${query}\n${url}`
    });
  }

};
