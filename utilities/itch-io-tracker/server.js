const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Paste your Discord URL inside the quotes below
const DISCORD_WEBHOOK_URL = process.env.WEBHOOK_URL;

// 1x1 Transparent GIF image data
const pixelBuffer = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// This array holds incoming traffic rows in memory temporarily
let logQueue = [];

// The tracking route that itch.io will trigger
app.get("/track.gif", (req, res) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const userAgent = req.headers["user-agent"] || "Unknown";

  // Push this individual hit directly into memory
  logQueue.push(`⏰ \`${timestamp}\` | 🌐 \`${ip}\` | 🤖 \`${userAgent}\``);

  // Serve the invisible image back to itch.io immediately
  res.writeHead(200, {
    "Content-Type": "image/gif",
    "Content-Length": pixelBuffer.length,
    "Cache-Control": "no-store, must-revalidate",
  });
  res.end(pixelBuffer);
});

// A background loop that flushes the memory queue to Discord every 5 seconds
setInterval(() => {
  if (logQueue.length === 0) return; // Do nothing if there is no traffic

  // Take up to 15 entries out of the queue to keep the message under Discord's character limit
  const batchToSend = logQueue.splice(0, 15);

  const messageContent =
    `🚨 **Batch Traffic Report (${batchToSend.length} hits logged):**\n` +
    batchToSend.join("\n") +
    `\n───────────────────`;

  fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: messageContent }),
  }).catch((err) => console.error("Discord Webhook Error:", err));
}, 5000); // 5000 milliseconds = 5 seconds

app.listen(PORT, () => console.log(`Itch.io tracker online.`));
