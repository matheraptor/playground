const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
/**
 * @desc changelog
 * @version 0.2.1
 * - TWEAKED: logMessage formatting (one line per stat)
 */
const version = "0.2.1 2026 07 14";

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
  //EXTRACT THE PAGE ID FROM THE URL QUERY
  //if the link is just /track.gif, it falls back to 'Unknown Page'
  const pageID = req.query.id || "Unknown Page";
  //USER-AGENT EVALUATION
  const rawAgent = req.headers["user-agent"] || "Unknown";
  const lowerAgent = rawAgent.toLocaleLowerCase();
  const clientType_Human = "🌐 Human";
  const clientType_Bot = "🤖 Bot / Scraper";
  let clientType = clientType_Human;
  if (rawAgent === "Unknown" || rawAgent.trim() === "") {
    clientType = "❓ Unknown";
  } else {
    const known_bot_libraries = [
      "bot",
      "crawler",
      "spider",
      "python",
      "curl",
      "wget",
      "go-http-client",
      "axios",
      "headless",
    ];
    for (const botLib of known_bot_libraries) {
      if (lowerAgent.includes(botLib)) {
        clientType = clientType_Bot;
        break;
      }
    }
  }
  // Push this individual hit directly into memory
  const logMessage = `📄 \`${pageID}\`\n⏰ \`${timestamp}\`\n**${clientType}**`;
  logQueue.push(logMessage);
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

app.listen(PORT, () => console.log(`Itch.io tracker online.\nv${version}`));
