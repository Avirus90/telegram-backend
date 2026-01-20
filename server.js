const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ✅ FIXED: ALLOW ALL ORIGINS
app.use(cors());
app.use(express.json());

// Home page
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Telegram Files API - DIRECT VIEW</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                .channel { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
                a { color: #007bff; text-decoration: none; }
                .cors-info { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API - DIRECT VIEW VERSION</h1>
            
            <div class="cors-info">
                <strong>Features:</strong> All files can be viewed directly (PDF, Images, Videos, Audio)
            </div>
            
            <p>Channel: <strong>@Anon271999</strong></p>
            <p>Channel ID: <code>-1003585777964</code></p>
            
            <div class="channel">
                <h3>📡 Available Endpoints:</h3>
                <p><a href="/api/test" target="_blank">GET /api/test</a> - API Status</p>
                <p><a href="/api/files" target="_blank">GET /api/files</a> - Get Files</p>
                <p><a href="/api/channel-info" target="_blank">GET /api/channel-info</a> - Channel Details</p>
            </div>
            
            <p>✅ Support for: PDF, JPG, PNG, GIF, MP4, WEBM, MKV, MP3, WAV, etc.</p>
            
            <div class="channel">
                <h3>🔗 Frontend:</h3>
                <p>All files can be viewed directly without downloading</p>
            </div>
            
            <p>Bot: @StorageAjit_bot | Status: ✅ WORKING</p>
        </body>
        </html>
    `);
});

// API status (same as before)
app.get('/api/test', (req, res) => {
    res.json({
        status: 'active',
        service: 'Telegram Files API - Direct View',
        channel_id: '-1003585777964',
        channel_username: '@Anon271999',
        cors_enabled: true,
        features: 'Direct viewing of PDF, Images, Videos, Audio',
        timestamp: new Date().toISOString()
    });
});

// Channel info (same as before)
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

// Main files endpoint - ENHANCED for better file type detection
app.get('/api/files', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        console.log(`📥 Fetching files from @Anon271999`);

        // ✅ WORKING: Use getUpdates to get recent messages
        const updatesResponse = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
            {
                params: {
                    limit: 100,
                    offset: -100
                },
                timeout: 15000
            }
        );

        console.log(`📊 Updates received: ${updatesResponse.data.result?.length || 0}`);
        
        const files = [];
        
        if (updatesResponse.data.ok && updatesResponse.data.result) {
            for (const update of updatesResponse.data.result) {
                const msg = update.channel_post || update.edited_channel_post || update.message;
                
                if (!msg) continue;
                
                let fileData = null;
                let fileType = 'other';
                
                // Check for different file types
                if (msg.document) {
                    fileData = msg.document;
                    fileType = 'document';
                } else if (msg.photo && msg.photo.length > 0) {
                    fileData = msg.photo[msg.photo.length - 1];
                    fileType = 'image';
                } else if (msg.video) {
                    fileData = msg.video;
                    fileType = 'video';
                } else if (msg.audio) {
                    fileData = msg.audio;
                    fileType = 'audio';
                } else if (msg.video_note) {
                    fileData = msg.video_note;
                    fileType = 'video';
                } else if (msg.voice) {
                    fileData = msg.voice;
                    fileType = 'audio';
                }
                
                if (fileData) {
                    try {
                        const fileRes = await axios.get(
                            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
                            { 
                                params: { file_id: fileData.file_id },
                                timeout: 5000
                            }
                        );
                        
                        if (fileRes.data.ok) {
                            const fileInfo = {
                                id: msg.message_id,
                                date: new Date(msg.date * 1000).toLocaleString('hi-IN'),
                                caption: msg.caption || `${fileType} file`,
                                type: fileType,
                                name: fileData.file_name || `${fileType}_${msg.message_id}`,
                                size: fileData.file_size,
                                mime_type: fileData.mime_type,
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                            };
                            
                            // Determine file extension from name or mime type
                            if (!fileInfo.name.includes('.')) {
                                if (fileInfo.mime_type) {
                                    const ext = fileInfo.mime_type.split('/')[1];
                                    if (ext) {
                                        fileInfo.name += `.${ext}`;
                                    }
                                }
                            }
                            
                            files.push(fileInfo);
                        }
                    } catch (fileError) {
                        console.log(`⚠️ File error: ${fileError.message}`);
                    }
                }
            }
        }

        console.log(`✅ Total files found: ${files.length}`);
        
        // Sort files by date (newest first)
        files.sort((a, b) => b.id - a.id);
        
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
            hint: 'Bot token or API issue',
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
        features: 'direct_file_viewing',
        timestamp: new Date().toISOString()
    });
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
    👁️  FEATURE: Direct file viewing enabled
    ✅ STATUS: WORKING
    `);
});

module.exports = app;
