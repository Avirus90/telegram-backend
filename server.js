const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// CORS - Allow only your frontend
app.use(cors({
    origin: 'https://anonedu.github.io',
    credentials: false
}));

app.use(express.json());

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Telegram Files API</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                .box { background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0; }
                code { background: #333; color: white; padding: 10px; display: block; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API</h1>
            
            <div class="box">
                <h3>📡 API Endpoints:</h3>
                <p><strong>GET</strong> <code>/api/test</code> - Test API</p>
                <p><strong>GET</strong> <code>/api/files?channel=@username</code> - Get files</p>
                <p><strong>Example:</strong> <a href="/api/files?channel=@Anon27199">/api/files?channel=@Anon27199</a></p>
            </div>
            
            <p>Backend: telegram-backend | Bot: @StorageAjit_bot</p>
        </body>
        </html>
    `);
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({
        status: 'active',
        service: 'Telegram Files API',
        frontend: 'https://anonedu.github.io/telegram-frontend/',
        timestamp: new Date().toISOString()
    });
});

// Main files endpoint
app.get('/api/files', async (req, res) => {
    try {
        const channel = req.query.channel || '@Anon27199';
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return res.json({ success: false, error: 'Bot token not configured' });
        }

        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory`,
            { params: { chat_id: channel, limit: 30 } }
        );

        const files = [];
        if (response.data.ok) {
            for (const msg of response.data.result) {
                if (msg.document || msg.video || msg.audio || msg.photo) {
                    let fileData = msg.document || msg.video || msg.audio || msg.photo[msg.photo.length - 1];
                    let fileType = msg.document ? 'document' : msg.video ? 'video' : msg.audio ? 'audio' : 'image';
                    
                    if (fileData.file_id) {
                        const fileRes = await axios.get(
                            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
                            { params: { file_id: fileData.file_id } }
                        );
                        
                        if (fileRes.data.ok) {
                            files.push({
                                id: msg.message_id,
                                date: new Date(msg.date * 1000).toLocaleString('hi-IN'),
                                caption: msg.caption || '',
                                type: fileType,
                                name: fileData.file_name || `${fileType}_${msg.message_id}`,
                                size: fileData.file_size,
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                            });
                        }
                    }
                }
            }
        }

        res.json({ success: true, channel: channel, files: files });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
});
