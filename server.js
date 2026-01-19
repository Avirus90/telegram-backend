const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ✅ FIXED: ALLOW ALL ORIGINS (Temporary fix)
app.use(cors()); // This allows ALL origins - frontend will work

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
                .cors-info { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API</h1>
            
            <div class="cors-info">
                <strong>CORS Status:</strong> All origins allowed
            </div>
            
            <p>Channel: <strong>@Anon271999</strong></p>
            <p>Channel ID: <code>-1003585777964</code></p>
            
            <div class="channel">
                <h3>📡 Available Endpoints:</h3>
                <p><a href="/api/test" target="_blank">GET /api/test</a> - API Status</p>
                <p><a href="/api/files" target="_blank">GET /api/files</a> - Get Files</p>
                <p><a href="/api/channel-info" target="_blank">GET /api/channel-info</a> - Channel Details</p>
            </div>
            
            <div class="channel">
                <h3>🔗 Test Links:</h3>
                <p><a href="https://anonedu.github.io/telegram-frontend/" target="_blank">Frontend Website</a></p>
                <p>Backend URL: <code>https://telegram-backend-rq82.vercel.app</code></p>
            </div>
            
            <p>Bot: @StorageAjit_bot | CORS: Enabled for all</p>
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
        cors_enabled: true,
        allowed_origins: 'all',
        timestamp: new Date().toISOString()
    });
});

// Channel info
app.get('/api/channel-info', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
            { 
                params: { chat_id: '@Anon271999' },
                timeout: 10000
            }
        );
        
        res.json({
            success: true,
            channel: response.data.result,
            cors: 'enabled'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            cors: 'enabled'
        });
    }
});

// Main files endpoint
app.get('/api/files', async (req, res) => {
    try {
        let channel = req.query.channel || '@Anon271999';
        
        // Convert username to ID
        if (channel === '@Anon271999') {
            channel = '-1003585777964';
        }
        
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        console.log(`📥 Fetching files for channel: ${channel}`);

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

        console.log(`📊 Telegram response OK: ${response.data.ok}`);
        
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
                                { 
                                    params: { file_id: fileData.file_id },
                                    timeout: 5000
                                }
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
                            console.log(`⚠️ File error: ${error.message}`);
                        }
                    }
                }
            }
        }

        console.log(`✅ Found ${files.length} files`);
        
        res.json({
            success: true,
            channel: '@Anon271999',
            channel_id: '-1003585777964',
            total_files: files.length,
            files: files,
            cors: 'enabled',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            hint: 'Check bot token and channel permissions',
            channel: '@Anon271999',
            channel_id: '-1003585777964',
            cors: 'enabled'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        cors: 'enabled',
        timestamp: new Date().toISOString()
    });
});

// Direct file test endpoint
app.get('/api/test-files', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory`,
            {
                params: {
                    chat_id: '-1003585777964',
                    limit: 5
                }
            }
        );
        
        res.json({
            test: true,
            channel_accessible: response.data.ok,
            message_count: response.data.result ? response.data.result.length : 0,
            cors: 'enabled'
        });
    } catch (error) {
        res.json({
            test: false,
            error: error.message,
            cors: 'enabled'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🚀 Telegram Files API Started
    📍 Port: ${PORT}
    🌐 URL: https://telegram-backend-rq82.vercel.app
    🔓 CORS: Enabled for ALL origins
    📡 Channel: @Anon271999 (ID: -1003585777964)
    🤖 Bot: @StorageAjit_bot
    ✅ Ready to serve!
    `);
});

module.exports = app;
