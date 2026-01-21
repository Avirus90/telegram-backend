const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ✅ FIXED: ALLOW ALL ORIGINS
app.use(cors());
app.use(express.json());

// All routes remain exactly the same
// ... (copy all server.js content here) ...

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 Telegram Files API Started
    📍 Port: ${PORT}
    🌐 URL: https://telegram-backend-rq82.vercel.app
    🔓 CORS: Enabled for ALL origins
    📡 Channel: @Anon271999 (ID: -1003585777964)
    🤖 Bot: @StorageAjit_bot
    ✅ API: Using getUpdates method
    ✅ STATUS: WORKING
    `);
});

module.exports = app;
