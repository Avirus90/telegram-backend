const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// CORS - Allow frontend
app.use(cors({
    origin: ['https://anonedu.github.io', 'http://localhost:3000'],
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
                .channel { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
                a { color: #007bff; text-decoration: none; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API</h1>
            <p>Channel ID: <code>-1003585777964</code></p>
            
            <div class="channel">
                <h3>📡 Available Endpoints:</h3>
                <p><a href="/api/test">/api/test</a> - API Status</p>
                <p><a href="/api/files">/api/files?channel=@Anon271999</a> - Get Files</p>
                <p><a href="/api/channel-info">/api/channel-info</a> - Channel Details</p>
            </div>
            
            <p>Bot: @StorageAjit_bot | Channel: @Anon271999</p>
        </body>
        </html>
    `);
});

// API status
app.get('/api/test', (req, res) => {
    res.json({
        status: 'active',
        service: 'Telegram Files API',
        channel_id: '-1003585777964',
        channel_username: '@Anon271999',
        timestamp: new Date().toISOString()
    });
});

// Channel info
app.get('/api/channel-info', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
            { params: { chat_id: '@Anon271999' } }
        );
        
        res.json({
            success: true,
            channel: response.data.result
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

// Main files endpoint
app.get('/api/files', async (req, res) => {
    try {
        let channel = req.query.channel || '@Anon271999';
        
        // Convert username to ID if needed
        if (channel === '@Anon271999') {
            channel = '-1003585777964';
        }
        
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return res.json({
                success: false,
                error: 'Bot token not configured'
            });
        }

        // Get channel messages
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory`,
            {
                params: {
                    chat_id: channel,
                    limit: 50
                },
                timeout: 15000
            }
        );

        const files = [];
        if (response.data.ok && response.data.result) {
            for (const msg of response.data.result) {
                if (msg.document || msg.video || msg.audio || msg.photo) {
                    let fileData = null;
                    let fileType = 'file';
                    
                    if (msg.document) {
                        fileData = msg.document;
                        fileType = 'document';
                    } else if (msg.video) {
                        fileData = msg.video;
                        fileType = 'video';
                    } else if (msg.audio) {
                        fileData = msg.audio;
                        fileType = 'audio';
                    } else if (msg.photo) {
                        fileData = msg.photo[msg.photo.length - 1];
                        fileType = 'image';
                    }

                    if (fileData && fileData.file_id) {
                        try {
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
                                    mime_type: fileData.mime_type,
                                    download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                                });
                            }
                        } catch (error) {
                            // Skip file if error
                        }
                    }
                }
            }
        }

        res.json({
            success: true,
            channel: '@Anon271999',
            channel_id: '-1003585777964',
            total_files: files.length,
            files: files
        });
        
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            channel: '@Anon271999',
            channel_id: '-1003585777964'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ✅ Server started on port ${PORT}
    📍 Channel: @Anon271999
    🔢 Channel ID: -1003585777964
    🚀 API Ready!
    `);
});
