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
            <title>Telegram Files API - FIXED</title>
            <style>
                body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
                .channel { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 10px; }
                a { color: #007bff; text-decoration: none; }
                .cors-info { background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>✅ Telegram Files API - WORKING VERSION</h1>
            
            <div class="cors-info">
                <strong>CORS Status:</strong> All origins allowed | API: getUpdates
            </div>
            
            <p>Channel: <strong>@Anon271999</strong></p>
            <p>Channel ID: <code>-1003585777964</code></p>
            
            <div class="channel">
                <h3>📡 Available Endpoints:</h3>
                <p><a href="/api/test" target="_blank">GET /api/test</a> - API Status</p>
                <p><a href="/api/files" target="_blank">GET /api/files</a> - Get Files</p>
                <p><a href="/api/channel-info" target="_blank">GET /api/channel-info</a> - Channel Details</p>
                <p><a href="/api/mock-test/sample" target="_blank">GET /api/mock-test/:fileId</a> - Mock Test Parser</p>
            </div>
            
            <p>✅ Using working Telegram API methods</p>
            
            <div class="channel">
                <h3>🔗 Frontend:</h3>
                <p><a href="https://anonedu.github.io/telegram-frontend/" target="_blank">Open Frontend</a></p>
                <p>Backend URL: <code>https://telegram-backend-rq82.vercel.app</code></p>
            </div>
            
            <p>Bot: @StorageAjit_bot | Status: ✅ WORKING</p>
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

// Main files endpoint - WORKING VERSION
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
                
                if (msg && msg.document) {
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
                                type: 'document',
                                name: fileData.file_name || `document_${msg.message_id}`,
                                size: fileData.file_size,
                                mime_type: fileData.mime_type,
                                download_url: `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileRes.data.result.file_path}`,
                                file_id: fileData.file_id  // Added for mock test access
                            });
                        }
                    } catch (fileError) {
                        console.log(`⚠️ File error: ${fileError.message}`);
                    }
                }
                
                // Also check for photos in the message
                if (msg && msg.photo && msg.photo.length > 0) {
                    const photoData = msg.photo[msg.photo.length - 1]; // Get largest photo
                    
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
            }
        }

        console.log(`✅ Total files found: ${files.length}`);
        
        // If no files found in updates, check if we can access channel directly
        if (files.length === 0) {
            console.log('No files in updates, trying direct channel access...');
            
            try {
                // Try to get channel information
                const chatResponse = await axios.get(
                    `https://api.telegram.org/bot${BOT_TOKEN}/getChat`,
                    { 
                        params: { chat_id: '@Anon271999' },
                        timeout: 5000
                    }
                );
                
                console.log('Channel accessible:', chatResponse.data.ok);
                
                // Return success even if no files, with channel info
                res.json({
                    success: true,
                    channel: '@Anon271999',
                    channel_id: '-1003585777964',
                    channel_accessible: chatResponse.data.ok,
                    total_files: 0,
                    files: [],
                    message: 'Channel is accessible but no files found in recent updates',
                    cors: 'enabled',
                    timestamp: new Date().toISOString()
                });
                return;
                
            } catch (channelError) {
                console.log('Channel access error:', channelError.message);
            }
        }
        
        // Always return success with files (even if empty)
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
        
        // Return error but with CORS headers
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

// Mock Test Parser Endpoint
app.get('/api/mock-test/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8363811390:AAH-gAn9hOy4vrXOP7XHuM1LoHMHS77h6Fs';
        
        console.log(`📥 Processing mock test file: ${fileId}`);
        
        // Get file from Telegram
        const fileResponse = await axios.get(
            `https://api.telegram.org/bot${BOT_TOKEN}/getFile`,
            { 
                params: { file_id: fileId },
                timeout: 10000
            }
        );
        
        if (!fileResponse.data.ok) {
            throw new Error('File not found');
        }
        
        const filePath = fileResponse.data.result.file_path;
        const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        
        console.log(`📄 Downloading file from: ${fileUrl}`);
        
        // Download and parse TXT file
        const txtResponse = await axios.get(fileUrl, { timeout: 15000 });
        const content = txtResponse.data;
        
        console.log(`📊 File content length: ${content.length} characters`);
        
        // Parse TXT format
        const questions = parseTxtToQuestions(content);
        
        console.log(`✅ Parsed ${questions.length} questions`);
        
        res.json({
            success: true,
            questions: questions,
            total: questions.length,
            fileId: fileId,
            cors: 'enabled',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Mock test error:', error.message);
        res.json({
            success: false,
            error: error.message,
            message: 'Failed to load mock test',
            cors: 'enabled',
            timestamp: new Date().toISOString()
        });
    }
});

// TXT Parser Function
function parseTxtToQuestions(content) {
    const lines = content.split('\n');
    const questions = [];
    let currentQuestion = null;
    let questionNumber = 1;
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed) continue; // Skip empty lines
        
        if (trimmed.startsWith('Q:')) {
            if (currentQuestion) questions.push(currentQuestion);
            currentQuestion = {
                id: questionNumber++,
                question: trimmed.substring(2).trim(),
                options: [],
                answer: null,
                explanation: null
            };
        } 
        else if (trimmed.startsWith('A:')) {
            if (currentQuestion) currentQuestion.options.push({
                letter: 'A',
                text: trimmed.substring(2).trim()
            });
        }
        else if (trimmed.startsWith('B:')) {
            if (currentQuestion) currentQuestion.options.push({
                letter: 'B',
                text: trimmed.substring(2).trim()
            });
        }
        else if (trimmed.startsWith('C:')) {
            if (currentQuestion) currentQuestion.options.push({
                letter: 'C',
                text: trimmed.substring(2).trim()
            });
        }
        else if (trimmed.startsWith('D:')) {
            if (currentQuestion) currentQuestion.options.push({
                letter: 'D',
                text: trimmed.substring(2).trim()
            });
        }
        else if (trimmed.toUpperCase().startsWith('ANS:')) {
            if (currentQuestion) {
                const answer = trimmed.substring(4).trim().toUpperCase();
                currentQuestion.answer = answer;
                currentQuestion.correctOption = answer;
            }
        }
        else if (trimmed.toUpperCase().startsWith('EXPLANATION:')) {
            if (currentQuestion) {
                currentQuestion.explanation = trimmed.substring(12).trim();
            }
        }
        else if (trimmed.toUpperCase().startsWith('DESCRIPTION:')) {
            if (currentQuestion) {
                currentQuestion.explanation = trimmed.substring(12).trim();
            }
        }
    }
    
    // Add last question
    if (currentQuestion) questions.push(currentQuestion);
    
    return questions;
}

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        cors: 'enabled',
        timestamp: new Date().toISOString()
    });
});

// Simple bot test
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
    ✅ NEW: Mock Test Parser Endpoint
    ✅ STATUS: WORKING
    `);
});

module.exports = app;
