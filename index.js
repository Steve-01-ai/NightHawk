sock.ev.on("connection.update", (update) => {
  const { connection } = update;

  if (connection === "close") {
    console.log("Reconnecting Night Hawk...");
    startBot();
  }

  if (connection === "open") {
    console.log("🦅 Night Hawk Online 24/7");
  }
});
