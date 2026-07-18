/**
 * @desc changelog
 * @version 0.1.1
 * - ADDED: get("/ping")
 * @version 0.1.0
 */
const version = "0.1.1 2026 07 18";
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;
const url = process.env.url;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const ePrefix = "[FEEDBACK_POSTER]: ";
app.use(
  cors({
    origin: url,
  }),
);
app.use(express.json());
app.get("/ping", (req, res) => {
  res.status(200).send(ePrefix + "pong!");
});
app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;
    if (!DISCORD_WEBHOOK_URL)
      throw new Error(
        `${ePrefix}missing env variable for 'DISCORD_WEBHOOK_URL'`,
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
    const response = await fetch(`${DISCORD_WEBHOOK_URL}`, {
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
});
app.listen(PORT, () => {
  console.log(ePrefix + `listening on port ${PORT}.`);
});
