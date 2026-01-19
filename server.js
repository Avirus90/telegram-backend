const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// Allow all origins for testing
app.use(cors());

app.use(express.json());

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Telegram API</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                .channels { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .channel { padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API</h1>
            <p>Supports multiple channels</p>
            
            <div class="channels">
                <h3>📡 Available Channels:</h3>
                <div class="channel">
                    <strong>@Anon271999</strong>
                    <a href="/api/files?channel=@Anon271999">Get Files</a>
                </div>
                <div class="channel">
                    <strong>@StorageAjit_bot</strong>
                    <a href="/api/files?channel=@StorageAjit_bot">Get Files</a>
                </div>
            </div>
            
            <h3>API Endpoints:</h3>
            <p><code>GET /api/test</code> - API status</p>
            <p><code>GET /api/files?channel=@username</code> - Get files from any channel</p>
            
            <p>Bot: @StorageAjit_bot | Supports multiple channels</p>
        </body>
        </html>
    `);
});

// API status
app.get('/api/test', (req, res) => {
    res.json({
        status: 'active',
        service: 'Telegram Files API',
        supported_channels: ['@Anon271999', '@StorageAjit_bot'],
        timestamp: new Date().toISOString(),
        endpoints: {
            home: '/',
            test: '/api/test',
            files: '/api/files?channel=@username'
        }
    });
});

// Get files from any channel
app.get('/api/files', async (req, res) => {
    try {
        // Get channel from query or use default
        let channel = req.query.channel;
        
        // If no channel provided, return error with suggestions
        if (!channel) {
            return res.json({
                success: false,
                error: 'Channel parameter required',
                supported_channels: [
                    { name: '@Anon271999', url: '/api/files?channel=@Anon271999' },
                    { name: '@StorageAjit_bot', url: '/api/files?channel=@StorageAjit_bot' }
                ],
                usage: 'Add ?channel=@username to URL'
            });
        }
        
        // Ensure channel starts with @
        if (!channel.startsWith('@')) {
            channel = '@' + channel;
        }
        
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
        
        if (!BOT_TOKEN) {
            return res.json({ 
                success: false, 
                error: 'Bot token not configured',
                hint: 'Check Vercel environment variables'
            });
        }

        console.log(`📥 Fetching from channel: ${channel}`);
        
        // Try to get channel info first
        try {
            const chatInfo = await axios.get(
                `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
                { params: { chat_id: channel } }
            );
            console.log(`✅ Channel accessible: ${channel}`);
        } catch (chatError) {
            console.log(`❌ Channel access error: ${chatError.message}`);
            return res.json({
                success: false,
                error: `Cannot access channel ${channel}`,
                hint: 'Check: 1) Bot is admin 2) Channel exists 3) Channel is public',
                alternative_channels: ['@Anon271999', '@StorageAjit_bot']
            });
        }
        
        // Get messages from channel
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChatHistory`,
            { 
                params: { 
                    chat_id: channel, 
                    limit: 30 
                },
                timeout: 10000
            }
        );

        console.log(`📊 Telegram response: ${response.data.ok}`);
        
        const files = [];
        if (response.data.ok && response.data.result) {
            for (const msg of response.data.result) {
                if (msg.document || msg.video || msg.audio || msg.photo) {
                    let fileData = null;
                    let fileType = 'unknown';
                    
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
                                { params: { file_id: fileData.file_id }, timeout: 5000 }
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
                                    download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`,
                                    channel: channel
                                });
                            }
                        } catch (fileError) {
                            console.log(`⚠️ File error: ${fileError.message}`);
                        }
                    }
                }
            }
        }

        res.json({ 
            success: true, 
            channel: channel,
            files: files,
            total_files: files.length,
            channel_info: `Bot can access ${channel}`,
            supported_channels: ['@Anon271999', '@StorageAjit_bot'],
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ API Error:', error.message);
        
        // Better error messages
        let errorMessage = error.message;
        let hint = '';
        
        if (error.message.includes('chat not found')) {
            errorMessage = `Channel ${req.query.channel || '@Anon271999'} not found`;
            hint = 'Check channel username or try @Anon271999 or @StorageAjit_bot';
        } else if (error.message.includes('Not Found')) {
            errorMessage = 'Telegram API error - Bot may not have access';
            hint = 'Ensure bot is admin in the channel';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timeout';
            hint = 'Telegram API is slow, please try again';
        }
        
        res.json({ 
            success: false, 
            error: errorMessage,
            hint: hint,
            alternative_channels: [
                { name: '@Anon271999', url: '/api/files?channel=@Anon271999' },
                { name: '@StorageAjit_bot', url: '/api/files?channel=@StorageAjit_bot' }
            ]
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        supported_channels: 2,
        timestamp: new Date().toISOString()
    });
});

// Test specific channels
app.get('/api/test/anonedu', async (req, res) => {
    res.redirect('/api/files?channel=@Anon271999');
});

app.get('/api/test/bot', async (req, res) => {
    res.redirect('/api/files?channel=@StorageAjit_bot');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    ✅ Telegram Files API Started
    📍 Port: ${PORT}
    📡 Supported Channels:
      1. @Anon271999
      2. @StorageAjit_bot
    🌐 Home: http://localhost:${PORT}
    🚀 Ready to serve!
    `);
});

module.exports = app;
