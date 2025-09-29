const express = require("express");
const axios = require("axios");

// Minimal Express server that forwards to HighLevel via Private Integration Token (PIT)
const app = express();
app.use(express.json());

// Health
app.get("/", (_req, res) => {
  res.json({ ok: true, msg: "HighLevel bridge is up" });
});

// Create contact
app.post("/tools/create_contact", async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body || {};
    if (!firstName && !lastName) {
      return res.status(400).json({ ok: false, error: "firstName or lastName required" });
    }
    const resp = await axios.post(
      "https://services.leadconnectorhq.com/contacts/",
      { firstName, lastName, email, phone },
      {
        headers: {
          Accept: "application/json",
          Authorization: process.env.ACCESS_TOKEN, // <-- set on Render
          Version: "2021-07-28",
        },
      }
    );
    res.json({ ok: true, data: resp.data });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.response?.data || e.message });
  }
});

// Send SMS (requires a valid contactId in your HighLevel account)
app.post("/tools/send_message", async (req, res) => {
  try {
    const { contactId, message } = req.body || {};
    if (!contactId || !message) {
      return res.status(400).json({ ok: false, error: "contactId and message required" });
    }
    const resp = await axios.post(
      "https://services.leadconnectorhq.com/conversations/messages",
      { contactId, message, type: "SMS" },
      {
        headers: {
          Accept: "application/json",
          Authorization: process.env.ACCESS_TOKEN,
          Version: "2021-07-28",
        },
      }
    );
    res.json({ ok: true, data: resp.data });
  } catch (e) {
    res.status(400).json({ ok: false, error: e?.response?.data || e.message });
  }
});

const PORT = process.env.PORT || 3000; // Render injects PORT
app.listen(PORT, () => {
  console.log(`HighLevel bridge listening on port ${PORT}`);
});
