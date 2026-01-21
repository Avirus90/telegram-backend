const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// ✅ ALLOW ALL ORIGINS
app.use(cors());
app.use(express.json());

// Private Channel Configuration
const PRIVATE_CHANNEL_INVITE_LINK = 'https://t.me/+IDJHuyJbiTg2ZmNl';
const PRIVATE_CHANNEL_USERNAME = '@+IDJHuyJbiTg2ZmNl'; // Private channels use + format
const PRIVATE_CHANNEL_ID = null; // Will be fetched dynamically

// Home page with private channel info
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Telegram Files API - PRIVATE CHANNEL</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                .channel { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
                a { color: #007bff; text-decoration: none; }
                .cors-info { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
                .private-badge { background: #dc3545; color: white; padding: 5px 10px; border-radius: 5px; display: inline-block; margin: 5px 0; }
                .warning { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>🔒 Telegram Files API - PRIVATE CHANNEL VERSION</h1>
            
            <div class="private-badge">PRIVATE CHANNEL ACCESS</div>
            
            <div class="cors-info">
                <strong>CORS Status:</strong> All origins allowed | API: getUpdates
            </div>
            
            <div class="warning">
                <strong>⚠️ Important:</strong> Bot must be admin in the private channel to access files
            </div>
            
            <p>Private Channel Invite Link: <strong>${PRIVATE_CHANNEL_INVITE_LINK}</strong></p>
            <p>Channel Username: <code>${PRIVATE_CHANNEL_USERNAME}</code></p>
            
            <div class="channel">
                <h3>📡 Available Endpoints:</h3>
                <p><a href="/api/test" target="_blank">GET /api/test</a> - API Status</p>
                <p><a href="/api/files" target="_blank">GET /api/files</a> - Get Files (PRIVATE CHANNEL)</p>
                <p><a href="/api/channel-info" target="_blank">GET /api/channel-info</a> - Channel Details</p>
                <p><a href="/api/bot-test" target="_blank">GET /api/bot-test</a> - Bot Status</p>
            </div>
            
            <p>✅ Using getUpdates for private channel access</p>
            
            <div class="channel">
                <h3>🔗 Frontend:</h3>
                <p><a href="https://anonedu.github.io/telegram-frontend/" target="_blank">Open Frontend (Updated for Private)</a></p>
                <p>Backend URL: <code>https://telegram-backend-rq82.vercel.app</code></p>
            </div>
            
            <p>Bot: @StorageAjit_bot | Status: ✅ PRIVATE CHANNEL MODE</p>
        </body>
        </html>
    `);
});

// API status
app.get('/api/test', (req, res) => {
    res.json({
        status: 'active',
        service: 'Telegram Files API - PRIVATE CHANNEL',
        private_channel: true,
        channel_invite: PRIVATE_CHANNEL_INVITE_LINK,
        channel_username: PRIVATE_CHANNEL_USERNAME,
        cors_enabled: true,
        allowed_origins: 'all',
        timestamp: new Date().toISOString()
    });
});

// Helper function to get channel ID from invite link
async function getChannelIdFromInvite(botToken, inviteLink) {
    try {
        // Extract invite hash from link
        const inviteHash = inviteLink.split('+').pop();
        
        // Use getChat with invite link
        const response = await axios.get(
            `https://api.telegram.org/bot${botToken}/getChat`,
            { 
                params: { chat_id: inviteLink },
                timeout: 10000
            }
        );
        
        if (response.data.ok) {
            return response.data.result.id;
        }
    } catch (error) {
        console.log('Could not get channel ID from invite:', error.message);
    }
    return null;
}

// Channel info for private channel
app.get('/api/channel-info', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        // Try to get channel info using the invite link
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
            { 
                params: { chat_id: PRIVATE_CHANNEL_INVITE_LINK },
                timeout: 10000
            }
        );
        
        if (response.data.ok) {
            res.json({
                success: true,
                channel: response.data.result,
                is_private: true,
                invite_link: PRIVATE_CHANNEL_INVITE_LINK,
                cors: 'enabled'
            });
        } else {
            // If direct access fails, check bot status
            const botInfo = await axios.get(
                `https://api.telegram.org/bot${BOT_TOKEN}/getMe`,
                { timeout: 5000 }
            );
            
            res.json({
                success: false,
                error: 'Bot might not be admin in the private channel',
                bot_status: botInfo.data.ok ? 'active' : 'inactive',
                is_private: true,
                required: 'Bot must be added as admin to the private channel',
                cors: 'enabled'
            });
        }
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            hint: 'For private channel, bot must be admin. Add bot to channel as admin first.',
            is_private: true,
            invite_link: PRIVATE_CHANNEL_INVITE_LINK,
            cors: 'enabled'
        });
    }
});

// Main files endpoint for PRIVATE CHANNEL
app.get('/api/files', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        console.log(`🔒 Fetching files from PRIVATE channel: ${PRIVATE_CHANNEL_INVITE_LINK}`);

        // ✅ For private channel: Use getUpdates - bot will only see messages from channels it's in
        const updatesResponse = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`,
            {
                params: {
                    limit: 100,
                    offset: -100,
                    timeout: 30  // Long polling timeout
                },
                timeout: 20000  // Extended timeout for private channels
            }
        );

        console.log(`📊 Updates received: ${updatesResponse.data.result?.length || 0}`);
        
        const files = [];
        
        if (updatesResponse.data.ok && updatesResponse.data.result) {
            for (const update of updatesResponse.data.result) {
                const msg = update.channel_post || update.edited_channel_post || update.message;
                
                if (!msg) continue;
                
                // Check if message is from our private channel
                const chatId = msg.chat?.id?.toString() || '';
                const chatUsername = msg.chat?.username || msg.chat?.invite_link || '';
                
                // For private channel, we accept all channel posts (since bot is only in our target channel)
                // OR we could filter by checking if it matches our channel invite
                
                if (msg.document) {
                    // Handle documents
                    const fileData = msg.document;
                    
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
                                caption: msg.caption || 'Document',
                                chat_info: {
                                    id: chatId,
                                    title: msg.chat?.title || 'Private Channel',
                                    type: msg.chat?.type || 'channel'
                                },
                                type: 'document',
                                name: fileData.file_name || `document_${msg.message_id}`,
                                size: fileData.file_size,
                                mime_type: fileData.mime_type,
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                            });
                        }
                    } catch (fileError) {
                        console.log(`⚠️ File error: ${fileError.message}`);
                    }
                }
                
                // Handle photos
                if (msg.photo && msg.photo.length > 0) {
                    const photoData = msg.photo[msg.photo.length - 1];
                    
                    try {
                        const fileRes = await axios.get(
                            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
                            { 
                                params: { file_id: photoData.file_id },
                                timeout: 5000
                            }
                        );
                        
                        if (fileRes.data.ok) {
                            files.push({
                                id: msg.message_id,
                                date: new Date(msg.date * 1000).toLocaleString('hi-IN'),
                                caption: msg.caption || 'Photo',
                                chat_info: {
                                    id: chatId,
                                    title: msg.chat?.title || 'Private Channel',
                                    type: msg.chat?.type || 'channel'
                                },
                                type: 'image',
                                name: `photo_${msg.message_id}.jpg`,
                                size: photoData.file_size,
                                mime_type: 'image/jpeg',
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                            });
                        }
                    } catch (photoError) {
                        console.log(`⚠️ Photo error: ${photoError.message}`);
                    }
                }
                
                // Handle videos
                if (msg.video) {
                    const videoData = msg.video;
                    
                    try {
                        const fileRes = await axios.get(
                            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
                            { 
                                params: { file_id: videoData.file_id },
                                timeout: 5000
                            }
                        );
                        
                        if (fileRes.data.ok) {
                            files.push({
                                id: msg.message_id,
                                date: new Date(msg.date * 1000).toLocaleString('hi-IN'),
                                caption: msg.caption || 'Video',
                                chat_info: {
                                    id: chatId,
                                    title: msg.chat?.title || 'Private Channel',
                                    type: msg.chat?.type || 'channel'
                                },
                                type: 'video',
                                name: videoData.file_name || `video_${msg.message_id}.mp4`,
                                size: videoData.file_size,
                                mime_type: videoData.mime_type || 'video/mp4',
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`
                            });
                        }
                    } catch (videoError) {
                        console.log(`⚠️ Video error: ${videoError.message}`);
                    }
                }
            }
        }

        console.log(`✅ Total files from private channel: ${files.length}`);
        
        // If no files found, check bot status
        if (files.length === 0) {
            console.log('No files found. Checking bot permissions...');
            
            try {
                const botStatus = await axios.get(
                    `https://api.telegram.org/bot${BOT_TOKEN}/getMe`,
                    { timeout: 5000 }
                );
                
                res.json({
                    success: true,
                    channel: 'PRIVATE CHANNEL',
                    channel_invite: PRIVATE_CHANNEL_INVITE_LINK,
                    bot_status: botStatus.data.ok ? 'active' : 'inactive',
                    total_files: 0,
                    files: [],
                    message: 'Bot is active but no files found. Make sure: 1. Bot is admin in the private channel 2. Channel has files 3. Try sending a file to channel',
                    is_private: true,
                    cors: 'enabled',
                    timestamp: new Date().toISOString()
                });
                return;
                
            } catch (statusError) {
                console.log('Bot status error:', statusError.message);
            }
        }
        
        // Success response
        res.json({
            success: true,
            channel: 'PRIVATE CHANNEL',
            channel_invite: PRIVATE_CHANNEL_INVITE_LINK,
            is_private: true,
            total_files: files.length,
            files: files,
            cors: 'enabled',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ PRIVATE CHANNEL API Error:', error.message);
        
        res.json({
            success: false,
            error: error.message,
            hint: 'For private channel access, ensure: 1. Bot token is valid 2. Bot is added as admin to the private channel 3. Bot has message reading permissions',
            channel: 'PRIVATE CHANNEL',
            channel_invite: PRIVATE_CHANNEL_INVITE_LINK,
            is_private: true,
            cors: 'enabled'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        private_channel: true,
        cors: 'enabled',
        timestamp: new Date().toISOString()
    });
});

// Bot test endpoint
app.get('/api/bot-test', async (req, res) => {
    try {
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        const response = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getMe`,
            { timeout: 5000 }
        );
        
        res.json({
            success: true,
            bot: response.data.result,
            private_channel_mode: true,
            required_permissions: 'Bot must be admin in private channel',
            cors: 'enabled'
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message,
            hint: 'Check bot token and ensure bot is active',
            private_channel_mode: true,
            cors: 'enabled'
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
    🔒 Telegram Files API - PRIVATE CHANNEL VERSION
    📍 Port: ${PORT}
    🌐 URL: https://telegram-backend-rq82.vercel.app
    🔓 CORS: Enabled for ALL origins
    🔒 Channel: PRIVATE (Invite: ${PRIVATE_CHANNEL_INVITE_LINK})
    🤖 Bot: @StorageAjit_bot
    ⚠️  IMPORTANT: Bot must be ADMIN in the private channel
    ✅ API: Using getUpdates method for private access
    ✅ STATUS: PRIVATE CHANNEL MODE
    `);
});

module.exports = app;
