const fetch = require("node-fetch");

async function chatAI(text) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_OPENAI_API_KEY"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: text }]
      })
    });

    const data = await res.json();
    return data.choices[0].message.content;
  } catch (err) {
    return "⚠ AI error, try again later.";
  }
}

module.exports = { chatAI };
