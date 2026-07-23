/**
 * @desc changelog
 * @version 0.3.5
 * - FIXED: pong
 * @version 0.3.1
 * - FIXED: package.json name
 * @version 0.3.0
 * - ADDED: consolidation of feedback-poster and itch-io-tracker
 * @version 0.1.1
 * - ADDED: get("/ping")
 * @version 0.1.0
 */
const version = "0.3.5 2026 07 23";
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const FEEDBACK_WEBHOOK = "/feedback";
const FEEDBACK_WEBHOOK_URL = process.env.FEEDBACK_WEBHOOK_URL;
const TRACKER_WEBHOOK = "/track.gif";
const TRACKER_WEBHOOK_URL = process.env.TRACKER_WEBHOOK_URL;
const ePrefix = "[RENDER-HELPER]: ";
/**
 * @name
 * @desc
 *
 */
//------------------------------------------------------------------------
// #region > express
//------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("OK");
});
// The tracking route that itch.io will trigger
app.get(TRACKER_WEBHOOK, (req, res) => {
  try {
    track(req, res);
  } catch (e) {
    console.error(e);
  }
});

app.get("/ping", (req, res) => {
  res.status(204).send();
});
app.post(FEEDBACK_WEBHOOK, async (req, res) => {
  sendFeedback(req, res);
});
app.listen(PORT, () => {
  console.log(`${version} ${ePrefix}online, listening on port ${PORT}.`);
});
// #endregion
//------------------------------------------------------------------------
/**
 * @name
 * @desc
 *
 */
//------------------------------------------------------------------------
// #region > Tracker
//------------------------------------------------------------------------
// 1x1 Transparent GIF image data
const pixelBuffer = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);
// This array holds incoming traffic rows in memory temporarily
let logQueue = [];
// Pinger endpoint

function track(req, res) {
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
}
// A background loop that flushes the memory queue to Discord every 5 seconds
setInterval(() => {
  if (logQueue.length === 0) return; // Do nothing if there is no traffic

  // Take up to 15 entries out of the queue to keep the message under Discord's character limit
  const batchToSend = logQueue.splice(0, 15);
  const messageContent =
    `🚨 **Batch Traffic Report (${batchToSend.length} hits logged):**\n` +
    batchToSend.join("\n") +
    `\n───────────────────`;
  fetch(TRACKER_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content: messageContent }),
  })
    .then((res) =>
      res.ok ? null : console.error(`Webhook HTTP Error: ${res.status}`),
    )
    .catch((err) => console.error("Webhook network error:", err));
}, 5000); // 5000 milliseconds = 5 seconds
//
// #endregion
//------------------------------------------------------------------------
/**
 * @name
 * @desc
 *
 */
//------------------------------------------------------------------------
// #region > Feedback
//------------------------------------------------------------------------
async function sendFeedback(req, res) {
  try {
    const data = req.body;
    if (!FEEDBACK_WEBHOOK_URL)
      throw new Error(
        `${ePrefix}missing env variable for 'FEEDBACK_WEBHOOK_URL'`,
      );
    const feedback = [
      {
        name: "Plugin",
        value: `**${data?.pluginName || "unknown"}**`,
        inline: true,
      },
    ];
    if (data?.feedback) {
      data.feedback.forEach((entry, index) => {
        const obj = {
          name: `Entry ${index + 1}`,
          value: String(entry),
          inline: false,
        };
        feedback.push(obj);
      });
    }
    const discordMessage = {
      embeds: [
        {
          title: "🎮 RMMZ.MAGPIE.sendDemoFeedback",
          color: 0x3498db, // Visual anchor color (Blue)
          fields: feedback,
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const response = await fetch(`${FEEDBACK_WEBHOOK_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordMessage),
    });
    if (!response.ok)
      throw new Error(
        ePrefix + `Discord API error! Status: ${response.status}`,
      );
    res
      .status(200)
      .json({ success: true, message: ePrefix + "dispacthed to Discord." });
  } catch (e) {
    console.error(ePrefix);
    res.status(500).json({ success: false, error: e.message });
  }
}
// #endregion
//------------------------------------------------------------------------
