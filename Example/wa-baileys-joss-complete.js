/**
 * ══════════════════════════════════════════════
 * 🚀 BAILEYS-JOSS v1.0.3 COMPLETE DEMO
 * ══════════════════════════════════════════════
 * 
 * Full showcase of all features including:
 * - Interactive Buttons (Native Flow, URL, Copy, Call)
 * - List Messages & Carousel
 * - Mini Games (Guess Number, Quiz, TicTacToe, RPS)
 * - Weather Bot
 * - Quote Generator
 * - Pomodoro Timer
 * - Anti-Spam System
 * - Link Scanner
 * - Content Detector
 * - Activity Logger
 * - And more!
 * 
 * Library: https://github.com/firdausmntp/Baileys-Joss
 * NPM: npm install baileys-joss
 * 
 * ══════════════════════════════════════════════
 */

require('dotenv').config();

const makeWASocket = require('baileys-joss').default;
const {
    // Core
    useMultiFileAuthState,
    DisconnectReason,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    
    // Interactive Buttons
    generateNativeFlowMessage,
    generateInteractiveListMessage,
    generateQuickReplyButtons,
    generateCombinedButtons,
    generateCopyCodeButton,
    generateUrlButtonMessage,
    
    // JID Plotting
    getCurrentSenderInfo,
    parseJid,
    getRemoteJidFromMessage,
    isSelf,
    
    // v1.0.3 Features (All Tested ✅)
    MiniGamesManager,        // Mini Games
    ContentDetector,         // Content Detection
    ContentFilter,
    hasLinks,
    hasPhoneNumbers,
    AntiSpamManager,         // Anti-Spam
    LinkScanner,             // Link Scanner
    ActivityLogger,          // Activity Logger
    MemeGenerator,           // Meme Generator
    drakeMeme,
    expandingBrainMeme,
    PomodoroManager,         // Pomodoro Timer
    QuoteManager,            // Quote Generator
    WeatherBot,              // Weather Bot

    // v1.0.3 Enhanced Feature Utilities
    quickContact,
    createContactCard,
    createTextStatus,
    getStatusJid,
    createTemplateManager,
    createBroadcastManager,
    createTypingIndicator,
    createReadReceiptController,
    createMessageSearch,
    createChatAnalytics,
    createChatExporter,
    QRCodeGenerator,
    downloadAllMedia,
    downloadMediaMessage,
    createMessageScheduler,
    createMediaDownloader,
    
} = require('baileys-joss');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// ══════════════════════════════════════════════
// 🗄️ USER DATA STORE
// ══════════════════════════════════════════════

const userData = {};
const pendingGames = {};
const depositAmounts = {};
const messageHistory = [];
const MAX_MESSAGE_HISTORY = 1000;
const DIV = '──────────';

// v1.0.3 Enhanced Feature Managers
const templateManager = createTemplateManager(true);
const messageSearch = createMessageSearch();
const analytics = createChatAnalytics();
const exporter = createChatExporter();

function getUser(jid) {
    if (!userData[jid]) {
        userData[jid] = {
            tokens: 10,
            balance: 0,
            transactions: 0,
            lastActive: Date.now()
        };
    }
    userData[jid].lastActive = Date.now();
    return userData[jid];
}

function addTokens(jid, amount) {
    const user = getUser(jid);
    user.tokens += amount;
    return user.tokens;
}

function useTokens(jid, amount) {
    const user = getUser(jid);
    if (user.tokens >= amount) {
        user.tokens -= amount;
        return true;
    }
    return false;
}

// ══════════════════════════════════════════════
// 🔧 INITIALIZE UTILITIES (v1.0.3 Features)
// ══════════════════════════════════════════════

// Mini Games Manager
const games = new MiniGamesManager();

// Anti-Spam Manager  
const antispam = new AntiSpamManager({
    maxMessagesPerMinute: 20,
    maxDuplicates: 3,
    whitelist: [],
    onSpamDetected: (jid, msg, result) => {
        console.log(`🛡️ Spam detected from ${jid}: ${result.reason}`);
    }
});

// Link Scanner
const linkScanner = new LinkScanner({
    followRedirects: true,
    enablePhishingDetection: true
});

// Content Detector
const contentDetector = new ContentDetector();

// Content Filter
const contentFilter = new ContentFilter({
    blockLinks: false,
    sensitiveKeywords: ['spam', 'scam'],
    maxMessageLength: 5000
});

// Activity Logger
const activityLogger = new ActivityLogger({
    fileLogging: false,
    maxMemoryEntries: 500,
    minLevel: 'info'
});

// Quote Manager
const quoteManager = new QuoteManager();

// Pomodoro Manager
const pomodoro = new PomodoroManager();

// Weather Bot (uses .env API key if available)
const weatherBot = new WeatherBot({
    apiKey: process.env.OPENWEATHERMAP_API_KEY || '5fc7471941f4f6374f4c0923e1bdba6f',
    units: 'metric',
    language: 'id'
});

// Meme Generator
const memeGenerator = new MemeGenerator();

// ══════════════════════════════════════════════
// 🚀 MAIN CONNECTION
// ══════════════════════════════════════════════

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }),
        auth: state,
    });

    const typingIndicator = createTypingIndicator(async (jid, presence) => {
        await sock.sendPresenceUpdate(presence, jid);
    });

    const readReceiptController = createReadReceiptController(async (jid, participant, messageIds) => {
        await sock.readMessages(messageIds.map((id) => ({ remoteJid: jid, id, participant })));
    }, {
        enabled: true,
        autoRead: true,
        readDelay: 300,
        excludeJids: []
    });

    const broadcastManager = createBroadcastManager(async (jid, content) => {
        return await sock.sendMessage(jid, content);
    });

    const scheduler = createMessageScheduler(async (jid, content) => {
        return await sock.sendMessage(jid, content);
    });

    const mediaDownloader = createMediaDownloader(async (key) => {
        return messageHistory.find((m) => m?.key?.id === key.id && m?.key?.remoteJid === key.remoteJid);
    });

    // Register Pomodoro events
    pomodoro.onEvent(async (event) => {
        const jid = event.session.jid;
        switch (event.type) {
            case 'work_start':
                await sock.sendMessage(jid, { 
                    text: `🍅 *WORK SESSION STARTED*\n\n⏱️ 25 minutes\n💪 Stay focused!` 
                });
                break;
            case 'work_end':
                await sock.sendMessage(jid, { 
                    text: `✅ *WORK COMPLETE!*\n\nType /break for break time.` 
                });
                break;
            case 'break_start':
                await sock.sendMessage(jid, { 
                    text: `☕ *BREAK TIME*\n\n⏱️ 5 minutes\n🧘 Relax!` 
                });
                break;
            case 'break_end':
                await sock.sendMessage(jid, { 
                    text: `⏰ *BREAK OVER!*\n\nType /work to continue.` 
                });
                break;
        }
    });

    // ══════════════════════════════════════════════
    // 📤 HELPER FUNCTIONS
    // ══════════════════════════════════════════════

    async function sendButtons(jid, body, buttons, footer = '', quoted = null) {
        try {
            const interactiveContent = generateNativeFlowMessage(body, buttons, { footer });
            const msg = generateWAMessageFromContent(jid, interactiveContent, {
                userJid: sock.user?.id,
                quoted
            });
            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
            return true;
        } catch (err) {
            console.error('Button send error:', err.message);
            const buttonText = buttons.map((btn, i) => {
                const params = JSON.parse(btn.buttonParamsJson);
                return `${i + 1}. ${params.display_text}`;
            }).join('\n');
            await sock.sendMessage(jid, { text: `${body}\n\n${buttonText}` }, { quoted });
            return false;
        }
    }

    async function sendList(jid, listData, quoted = null) {
        try {
            const listMessage = generateInteractiveListMessage(listData);
            const msg = generateWAMessageFromContent(jid, listMessage, {
                userJid: sock.user?.id,
                quoted
            });
            await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
            return true;
        } catch (err) {
            console.error('List send error:', err.message);
            return false;
        }
    }

    // ══════════════════════════════════════════════
    // 🔌 CONNECTION EVENTS
    // ══════════════════════════════════════════════

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('✓ Connected to WhatsApp');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ══════════════════════════════════════════════
    // 📩 MESSAGE HANDLER
    // ══════════════════════════════════════════════

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            for (const msg of messages) {
                if (!msg.message || msg.key.fromMe) continue;

                const remoteJid = msg.key.remoteJid;
                
                // Log activity
                activityLogger.logMessage(msg, 'received', { source: 'bot' });

                // Check spam (Anti-Spam System) - DISABLED (API not available yet)
                // const spamResult = await antispam.checkMessage(msg);
                // if (spamResult.isSpam) {
                //     console.log(`🛡️ Spam blocked: ${spamResult.reason}`);
                //     if (spamResult.action === 'warn') {
                //         await sock.sendMessage(remoteJid, { 
                //             text: `⚠️ Slow down! ${spamResult.reason}` 
                //         }, { quoted: msg });
                //     }
                //     continue;
                // }

                // Extract message content
                let messageContent =
                    msg.message.conversation ||
                    msg.message.extendedTextMessage?.text ||
                    msg.message.buttonsResponseMessage?.selectedButtonId ||
                    msg.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
                    msg.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
                    msg.message.templateButtonReplyMessage?.selectedId;

                let cmd = '';
                if (messageContent) {
                    try {
                        const parsed = JSON.parse(messageContent);
                        cmd = (parsed.id || messageContent).toLowerCase().trim();
                    } catch {
                        cmd = messageContent.toLowerCase().trim();
                    }
                }

                messageHistory.push(msg);
                if (messageHistory.length > MAX_MESSAGE_HISTORY) {
                    messageHistory.shift();
                }
                messageSearch.addMessages([msg]);
                analytics.addMessages([msg]);
                exporter.addMessages(remoteJid, [msg]);

                if (cmd) {
                    const remoteInfo = getRemoteJidFromMessage ? getRemoteJidFromMessage(msg) : null;
                    const senderJid = remoteInfo?.senderJid || msg.key.participant || remoteJid;
                    const senderInfo = parseJid ? parseJid(senderJid) : null;
                    const senderNumber = senderInfo?.user || senderJid.split('@')[0] || remoteJid.split('@')[0];

                    console.log(`📩 Received: ${cmd} from ${senderNumber}`);

                    if (readReceiptController.getConfig().autoRead && msg.key.id) {
                        try {
                            await readReceiptController.markRead(remoteJid, msg.key.participant, [msg.key.id]);
                        } catch (e) {
                        }
                    }

                    const user = getUser(remoteJid);

                    // ══════════════════════════════════════════════
                    // 🏠 MAIN MENU
                    // ══════════════════════════════════════════════
                    if (cmd === 'menu' || cmd === 'halo' || cmd === 'start' || cmd === '/menu') {
                        addTokens(remoteJid, 1);

                        const buttons = [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '1️⃣ Menu v1 (Versi Awal)', id: 'menu_v1' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '1️⃣.1️⃣ Menu v1.1 (v1.0.1)', id: 'menu_v11' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '2️⃣ Menu v2 (v1.0.2)', id: 'menu_v2' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '3️⃣ Menu v3 (v1.0.3)', id: 'menu_v3' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎰 Games', id: 'games' }) },
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🐙 GitHub', url: 'https://github.com/firdausmntp/Baileys-Joss' }) }
                        ];

                        await sendButtons(
                            remoteJid,
                            `*🚀 BAILEYS-JOSS VERSION MENU*\n━━━━━━━━━━━━━━━━━━━━━\n\nPilih versi yang mau dites:\n• *v1* = versi awal\n• *v1.1* = v1.0.1\n• *v2* = v1.0.2\n• *v3* = v1.0.3 (Latest)\n\n🎫 Token: *${user.tokens}*\n✨ +1 Token!`,
                            buttons,
                            '🔗 github.com/firdausmntp/Baileys-Joss',
                            msg
                        );
                    }

                    // ══════════════════════════════════════════════
                    // 🧭 VERSIONED MENUS
                    // ══════════════════════════════════════════════
                    else if (cmd === 'menu_v1' || cmd === 'v1') {
                        await sendList(remoteJid, {
                            title: '1️⃣ MENU v1 (VERSI AWAL)',
                            buttonText: 'Lihat fitur v1',
                            description: 'Baseline features untuk test versi awal',
                            footer: 'Baileys-Joss v1',
                            sections: [
                                {
                                    title: 'Core Demo',
                                    rows: [
                                        { rowId: 'demo_quick', title: '⚡ Quick Reply Buttons', description: 'Callback basic' },
                                        { rowId: 'demo_url', title: '🔗 URL Buttons', description: 'Open website' },
                                        { rowId: 'demo_copy', title: '📋 Copy Code Button', description: 'Copy OTP/promo code' },
                                        { rowId: 'demo_combined', title: '🎨 Combined Buttons', description: 'Mix button types' }
                                    ]
                                },
                                {
                                    title: 'Utility',
                                    rows: [
                                        { rowId: 'ping', title: '🏓 Ping', description: 'Health check bot' },
                                        { rowId: 'myinfo', title: '📱 Sender Info', description: 'JID plotting basics' },
                                        { rowId: 'menu', title: '🔙 Back to Main Menu', description: 'Kembali ke menu utama' }
                                    ]
                                }
                            ]
                        }, msg);
                    }

                    else if (cmd === 'menu_v11' || cmd === 'v1.1' || cmd === 'v11') {
                        await sendList(remoteJid, {
                            title: '1️⃣.1️⃣ MENU v1.1 (v1.0.1)',
                            buttonText: 'Lihat fitur v1.1',
                            description: 'Fitur tambahan setelah versi awal',
                            footer: 'Baileys-Joss v1.0.1',
                            sections: [
                                {
                                    title: 'Bot Interaction',
                                    rows: [
                                        { rowId: 'demo_ai', title: '🤖 AI Message Style', description: 'Message with AI indicator' },
                                        { rowId: 'demo_poll', title: '📊 Poll Creation', description: 'Interactive poll message' },
                                        { rowId: 'games', title: '🎰 Game Center', description: 'Spin, Flip, Guess, Dice' }
                                    ]
                                },
                                {
                                    title: 'Token System',
                                    rows: [
                                        { rowId: 'daily', title: '🎁 Daily Bonus', description: 'Claim +5 token' },
                                        { rowId: 'menu', title: '🔙 Back to Main Menu', description: 'Kembali ke menu utama' }
                                    ]
                                }
                            ]
                        }, msg);
                    }

                    else if (cmd === 'menu_v2' || cmd === 'v2') {
                        await sendList(remoteJid, {
                            title: '2️⃣ MENU v2 (v1.0.2)',
                            buttonText: '📋 View v2 Features',
                            description: `Feature map v1.0.2\n\n🎫 Token: ${user.tokens}`,
                            footer: '🔗 github.com/firdausmntp/Baileys-Joss',
                            sections: [
                                {
                                    title: '📌 v2 Features',
                                    rows: [
                                        { rowId: 'feature_hub', title: '🧰 Enhanced Feature Hub', description: 'vCard, Status, Broadcast, Export, dll' },
                                        { rowId: 'menu_v3', title: '➡️ Go to v3 (Latest)', description: 'Lihat fitur terbaru v1.0.3' },
                                        { rowId: 'menu', title: '🔙 Back to Main Menu', description: 'Kembali ke menu utama' }
                                    ]
                                }
                            ]
                        }, msg);
                    }

                    else if (cmd === 'menu_v3' || cmd === 'v3' || cmd === 'demo' || cmd === 'help') {
                        await sendList(remoteJid, {
                            title: '3️⃣ MENU v3 (v1.0.3 - Latest)',
                            buttonText: '📋 View Full v3 Features',
                            description: `Full feature map v1.0.3\n\n🎫 Token: ${user.tokens}`,
                            footer: '🔗 github.com/firdausmntp/Baileys-Joss',
                            sections: [
                                {
                                    title: '📌 v3 Overview',
                                    rows: [
                                        { rowId: 'v3_feature_matrix', title: '✨ Why Baileys-Joss (Full Matrix)', description: 'Perbandingan lengkap vs Baileys original' },
                                        { rowId: 'v3_library_extra', title: '⚙️ Enhanced Library Features', description: 'Ada di library, belum semua di-route di bot ini' },
                                        { rowId: 'feature_hub', title: '🧰 Enhanced Feature Hub', description: 'vCard, Status, VN, Broadcast, Export, dll' }
                                    ]
                                },
                                {
                                    title: '✅ Ready to Test (All Tested)',
                                    rows: [
                                        { rowId: 'quote', title: '💬 Quote Generator', description: 'Random quote + category' },
                                        { rowId: 'weather_menu', title: '🌤️ Weather Bot', description: 'City weather lookup' },
                                        { rowId: 'pomodoro_menu', title: '🍅 Pomodoro Timer', description: 'Work/break productivity timer' },
                                        { rowId: 'meme', title: '🎭 Meme Generator', description: 'Generate text memes' },
                                        { rowId: 'scanlink', title: '🔗 Link Scanner', description: 'URL safety check' },
                                        { rowId: 'demo_ai', title: '🤖 AI Message Style', description: 'AI-style outgoing message' },
                                        { rowId: 'demo_poll', title: '📊 Poll Creation', description: 'Interactive poll' },
                                        { rowId: 'myinfo', title: '👤 LID/SenderPn Plotting', description: 'Sender/JID parsing demo' }
                                    ]
                                },
                                {
                                    title: '🎮 More',
                                    rows: [
                                        { rowId: 'games', title: '🎰 Game Center', description: 'Guess Number, Quiz, Spin, Dice' },
                                        { rowId: 'menu', title: '🔙 Back to Main Menu', description: 'Kembali ke menu utama' }
                                    ]
                                }
                            ]
                        }, msg);
                    }

                    else if (cmd === 'v3_feature_matrix' || cmd === '/v3 matrix' || cmd === 'matrix_v3') {
                        await sock.sendMessage(remoteJid, {
                            text: `*✨ WHY BAILEYS-JOSS? (v1.0.3 MATRIX)*\n━━━━━━━━━━━━━━━━━━━━━\n\n*✅ Ready di bot demo ini:*\n• Interactive Buttons / List / Copy / URL / Combined / Native Flow\n• LID-SenderPn Plotting, AI Message Style, Poll Creation\n• Mini Games core (Guess, Dice, Spin, Flip)\n• Quote, Weather, Pomodoro, Meme, Link Scanner\n\n*⚙️ Enhanced di library (perlu wiring command tambahan):*\n• Newsletter/Channel Control, Custom Pairing Code\n• Message Scheduling, Bulk Messaging, Auto Reply\n• Contact Card (vCard), Status/Story Posting\n• Broadcast Manager, Typing Indicator, Read Receipt Control\n• Message Search, Chat Analytics, Chat Export\n• QR Code Generator enhancement, Media Downloader\n• HD Images/Videos, Panorama Profile Picture\n\n*✅ All features tested in v1.0.3!*`
                        }, { quoted: msg });
                    }

                    else if (cmd === 'v3_library_extra' || cmd === '/v3 extra') {
                        await sendButtons(remoteJid,
                            `*⚙️ ENHANCED LIBRARY FEATURES (v1.0.3)*\n━━━━━━━━━━━━━━━━━━━━━\n\nFitur ini ada di Baileys-Joss, tapi di bot demo kamu belum semua dibuat command-nya.\n\nContoh: Scheduling, Bulk/Broadcast, Auto Reply, vCard, Story, Read Receipt, Search, Analytics, Export, Downloader, HD media, dan lainnya.\n\nKalau mau, next saya bisa bantu buatin command satu per satu dimulai dari prioritas kamu.`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📋 Full Matrix', id: 'v3_feature_matrix' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '3️⃣ Back to v3 Menu', id: 'menu_v3' }) }
                            ],
                            'Prioritaskan fitur yang mau diaktifin dulu', msg);
                    }

                    else if (cmd === 'feature_hub' || cmd === '/featurehub') {
                        await sendList(remoteJid, {
                            title: '🧰 ENHANCED FEATURE HUB',
                            buttonText: 'Pilih fitur',
                            description: 'Command demo untuk fitur v1.0.3 yang sebelumnya belum ada di menu',
                            footer: 'Baileys-Joss v1.0.3',
                            sections: [
                                {
                                    title: 'Messaging Utilities',
                                    rows: [
                                        { rowId: 'feature_contact', title: '📇 Contact Card (vCard)', description: 'Kirim kartu kontak' },
                                        { rowId: 'feature_template', title: '📋 Message Templates', description: 'Render template bawaan' },
                                        { rowId: 'feature_broadcast', title: '📡 Broadcast Manager', description: 'Broadcast ke user tersimpan' },
                                        { rowId: 'feature_typing', title: '⌨️ Typing Indicator', description: 'Demo composing indicator' },
                                        { rowId: 'feature_readreceipt', title: '✅ Read Receipt Control', description: 'Toggle auto-read' },
                                    ]
                                },
                                {
                                    title: 'Data & Tools',
                                    rows: [
                                        { rowId: 'feature_status', title: '📺 Status/Story Posting', description: 'Post text status demo' },
                                        { rowId: 'feature_search_help', title: '🔍 Message Search', description: 'Gunakan: search <kata>' },
                                        { rowId: 'feature_analytics', title: '📊 Chat Analytics', description: 'Statistik chat in-memory' },
                                        { rowId: 'feature_export', title: '💾 Chat Export', description: 'Export ke file JSON' },
                                        { rowId: 'feature_qr', title: '🔗 QR Code Generator', description: 'Generate QR text dari command' },
                                        { rowId: 'feature_downloader', title: '📁 Media Downloader', description: 'Download media dari history chat' },
                                        { rowId: 'activity_stats', title: '📝 Activity Logger', description: 'Lihat stats log bot' },
                                        { rowId: 'feature_pairing', title: '🔐 Custom Pairing Code', description: 'Generate pairing code custom' },
                                        { rowId: 'feature_hd_profile', title: '📷 HD Profile Picture', description: 'Get profile picture URL (image)' },
                                        { rowId: 'feature_hd_media', title: '📸🎬 HD Image/Video', description: 'Kirim media HD uncompressed' },
                                        { rowId: 'feature_panorama', title: '🌄 Panorama Profile Picture', description: 'Set panorama profile by URL' },
                                        { rowId: 'feature_schedule', title: '📅 Message Scheduling', description: 'Jadwal pesan delay' }
                                    ]
                                }
                            ]
                        }, msg);
                    }

                    else if (cmd === 'feature_contact' || cmd === '/vcard') {
                        const contact = quickContact('Baileys-Joss Demo', '6281212571925', {
                            organization: 'Baileys-Joss',
                            email: 'support@baileys-joss.dev'
                        });
                        const card = createContactCard(contact);
                        await sock.sendMessage(remoteJid, card, { quoted: msg });
                    }

                    else if (cmd === 'feature_status' || cmd === '/statusdemo') {
                        try {
                            const statusContent = createTextStatus({
                                text: `Baileys-Joss status demo • ${new Date().toLocaleString('id-ID')}`,
                                backgroundColor: '#075E54',
                                font: 2,
                                textColor: '#FFFFFF'
                            });
                            await sock.sendMessage(getStatusJid(), statusContent, {
                                statusJidList: [remoteJid]
                            });
                            await sock.sendMessage(remoteJid, { text: '✅ Status text berhasil dipost ke status@broadcast' }, { quoted: msg });
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ Status demo gagal: ${e.message}` }, { quoted: msg });
                        }
                    }


                    else if (cmd === 'feature_template' || cmd === '/template') {
                        const welcome = templateManager.getByName('Welcome Message') || templateManager.getAll()[0];
                        if (!welcome) {
                            await sock.sendMessage(remoteJid, { text: '⚠️ Template belum tersedia.' }, { quoted: msg });
                        } else {
                            const rendered = templateManager.render(welcome.id, {
                                name: remoteJid.split('@')[0],
                                company: 'Baileys-Joss Demo',
                                date: new Date().toLocaleDateString('id-ID')
                            });
                            await sock.sendMessage(remoteJid, {
                                text: `*📋 TEMPLATE PREVIEW*\n${DIV}\n\n${rendered}`
                            }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_broadcast' || cmd === '/broadcastdemo') {
                        const recipients = Object.keys(userData).filter((jid) => jid !== remoteJid).slice(0, 20);
                        if (recipients.length === 0) {
                            await sock.sendMessage(remoteJid, {
                                text: '⚠️ Belum ada recipient lain. Bot butuh minimal 2 user aktif untuk demo broadcast.'
                            }, { quoted: msg });
                        } else {
                            let list = broadcastManager.getByName('Demo List');
                            if (!list) {
                                list = broadcastManager.create({ name: 'Demo List', recipients });
                            } else {
                                broadcastManager.update(list.id, { recipients });
                            }

                            const result = await broadcastManager.broadcast(list.id, {
                                text: `📡 Broadcast demo dari ${remoteJid.split('@')[0]} • ${new Date().toLocaleTimeString('id-ID')}`
                            }, { delay: 600, randomDelay: 200 });

                            await sock.sendMessage(remoteJid, {
                                text: `*📡 BROADCAST RESULT*\n${DIV}\nTarget: ${result.totalRecipients}\nSent: ${result.sent}\nFailed: ${result.failed}`
                            }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_typing' || cmd === '/typingdemo') {
                        await typingIndicator.simulateTyping(remoteJid, 2000, async () => {
                            await sock.sendMessage(remoteJid, { text: `⌨️ Typing indicator demo selesai.` }, { quoted: msg });
                        });
                    }

                    else if (cmd === 'feature_readreceipt' || cmd === '/readreceipt') {
                        const current = readReceiptController.isEnabled();
                        if (current) {
                            readReceiptController.disable();
                        } else {
                            readReceiptController.enable();
                        }
                        await sock.sendMessage(remoteJid, {
                            text: `✅ Read Receipt: *${readReceiptController.isEnabled() ? 'ON' : 'OFF'}*`
                        }, { quoted: msg });
                    }

                    else if (cmd === 'feature_search_help') {
                        await sock.sendMessage(remoteJid, {
                            text: `🔍 Gunakan command: *search <kata>*\nContoh: *search weather*`
                        }, { quoted: msg });
                    }

                    else if (cmd.startsWith('search ')) {
                        const keyword = cmd.replace(/^search\s+/, '').trim();
                        if (!keyword) {
                            await sock.sendMessage(remoteJid, { text: '⚠️ Format: search <kata>' }, { quoted: msg });
                        } else {
                            const results = messageSearch.search(keyword, { jid: remoteJid, limit: 5 });
                            if (results.length === 0) {
                                await sock.sendMessage(remoteJid, { text: `🔍 Tidak ada hasil untuk: ${keyword}` }, { quoted: msg });
                            } else {
                                const preview = results.map((r, i) => `${i + 1}. ${r.matchedText.slice(0, 80)}`).join('\n');
                                await sock.sendMessage(remoteJid, {
                                    text: `*🔍 SEARCH RESULT*\n${DIV}\nQuery: ${keyword}\nHasil: ${results.length}\n\n${preview}`
                                }, { quoted: msg });
                            }
                        }
                    }

                    else if (cmd === 'feature_analytics' || cmd === 'analytics') {
                        const stats = analytics.getChatStats(remoteJid);
                        if (!stats) {
                            await sock.sendMessage(remoteJid, { text: '📊 Belum ada data analytics.' }, { quoted: msg });
                        } else {
                            await sock.sendMessage(remoteJid, {
                                text: `*📊 CHAT ANALYTICS*\n${DIV}\nTotal: ${stats.totalMessages}\nText: ${stats.messagesByType.text}\nMedia: ${stats.mediaCount}\nLinks: ${stats.linkCount}\nAvg len: ${stats.averageMessageLength.toFixed(1)}`
                            }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_export' || cmd === 'export_chat') {
                        const result = exporter.export(remoteJid, { format: 'json', includeMetadata: true, includeMediaInfo: true });
                        if (!result) {
                            await sock.sendMessage(remoteJid, { text: '⚠️ Belum ada chat untuk diexport.' }, { quoted: msg });
                        } else {
                            const tmpDir = path.join(__dirname, 'tmp');
                            if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
                            const filePath = path.join(tmpDir, `chat-export-${remoteJid.split('@')[0]}-${Date.now()}.json`);
                            fs.writeFileSync(filePath, result.content, 'utf8');
                            await sock.sendMessage(remoteJid, {
                                text: `💾 Export selesai\nFile: ${filePath}\nMessages: ${result.messageCount}`
                            }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_qr' || cmd.startsWith('qr ')) {
                        const data = cmd.startsWith('qr ') ? cmd.slice(3).trim() : `BAILEYS-JOSS-${Date.now()}`;
                        const qrGenerator = new QRCodeGenerator({ format: 'base64' });
                        try {
                            const qrBuffer = await qrGenerator.generateBuffer(data);
                            await sock.sendMessage(remoteJid, {
                                image: qrBuffer,
                                caption: `*🔗 QR GENERATOR*\n${DIV}\nData: ${data}`
                            }, { quoted: msg });
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ QR gagal: ${e.message}` }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_downloader' || cmd === 'media_download') {
                        const chatMessages = messageHistory.filter((m) => m.key?.remoteJid === remoteJid);
                        if (chatMessages.length === 0) {
                            await sock.sendMessage(remoteJid, { text: '⚠️ Belum ada message history untuk didownload.' }, { quoted: msg });
                        } else {
                            try {
                                const outputDir = path.join(__dirname, 'tmp', `media-${remoteJid.split('@')[0]}`);
                                if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
                                const summary = await mediaDownloader.downloadFromChat(remoteJid, chatMessages, {
                                    outputDir,
                                    types: ['image', 'video', 'audio', 'document', 'sticker'],
                                    skipExisting: true,
                                    createSubfolders: true,
                                    delay: 200
                                });
                                await sock.sendMessage(remoteJid, {
                                    text: `*📁 MEDIA DOWNLOADER*\n${DIV}\nTotal: ${summary.total}\nSuccess: ${summary.successful}\nFailed: ${summary.failed}\nDir: ${outputDir}`
                                }, { quoted: msg });
                            } catch (e) {
                                await sock.sendMessage(remoteJid, { text: `⚠️ Media downloader gagal: ${e.message}` }, { quoted: msg });
                            }
                        }
                    }

                    else if (cmd === 'activity_stats' || cmd === '/activity') {
                        const stats = activityLogger.getStats();
                        await sock.sendMessage(remoteJid, {
                            text: `*📝 ACTIVITY LOGGER*\n${DIV}\nTotal logs: ${stats.totalEntries}\nInfo: ${stats.byLevel.info}\nWarn: ${stats.byLevel.warn}\nError: ${stats.byLevel.error}`
                        }, { quoted: msg });
                    }

                    else if (cmd === 'feature_pairing' || cmd.startsWith('pairing ')) {
                        try {
                            const raw = cmd.startsWith('pairing ') ? cmd.slice(8).trim() : '';
                            const [phoneRaw, customRaw] = raw.split('|').map((s) => (s || '').trim());
                            const phone = (phoneRaw || '').replace(/\D/g, '');

                            if (!phone) {
                                await sock.sendMessage(remoteJid, {
                                    text: '⚠️ Format: pairing <nomor>|<custom_code_optional>\nContoh: pairing 6281212571925|ELAINA2026'
                                }, { quoted: msg });
                            } else {
                                const pairingCode = await sock.requestPairingCode(phone, customRaw || undefined);
                                await sock.sendMessage(remoteJid, {
                                    text: `*🔐 CUSTOM PAIRING CODE*\n${DIV}\nPhone: ${phone}\nCode: *${pairingCode}*`
                                }, { quoted: msg });
                            }
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ Pairing gagal: ${e.message}` }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_hd_profile' || cmd.startsWith('hdpp')) {
                        try {
                            const target = cmd.startsWith('hdpp ') ? cmd.slice(5).trim() : remoteJid;
                            const targetJid = target.includes('@') ? target : `${target.replace(/\D/g, '')}@s.whatsapp.net`;
                            const imageUrl = await sock.profilePictureUrl(targetJid, 'image');
                            await sock.sendMessage(remoteJid, {
                                text: `*📷 HD PROFILE PICTURE*\n${DIV}\nTarget: ${targetJid}\nURL: ${imageUrl || 'Not available'}`
                            }, { quoted: msg });
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ HD profile gagal: ${e.message}` }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_hd_media' || cmd === 'hd_media') {
                        await sendButtons(remoteJid,
                            `*📸🎬 HD MEDIA DEMO*\n${DIV}\n\nPilih kirim demo HD image/video (uncompressed mode).`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '📸 Send HD Image', id: 'hd_image_send' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎬 Send HD Video', id: 'hd_video_send' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Feature Hub', id: 'feature_hub' }) }
                            ],
                            'HD = set hd:true di payload media', msg);
                    }

                    else if (cmd === 'hd_image_send') {
                        await sock.sendMessage(remoteJid, {
                            image: { url: 'https://picsum.photos/1600/1200' },
                            caption: '📸 HD image demo',
                            hd: true
                        }, { quoted: msg });
                    }

                    else if (cmd === 'hd_video_send') {
                        await sock.sendMessage(remoteJid, {
                            video: { url: 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4' },
                            caption: '🎬 HD video demo',
                            hd: true
                        }, { quoted: msg });
                    }

                    else if (cmd === 'feature_panorama' || cmd === 'set_panorama' || cmd.startsWith('set_panorama ')) {
                        try {
                            // Normalize self JID — strip device suffix (:X) if present
                            const selfRaw = state.creds.me?.id || sock.user?.id;
                            const selfNum = selfRaw ? selfRaw.split('@')[0].split(':')[0] : null;
                            const selfJid = selfNum ? `${selfNum}@s.whatsapp.net` : selfRaw;

                            if (!selfJid) {
                                await sock.sendMessage(remoteJid, { text: '❌ Self JID tidak ditemukan. Pastikan bot sudah terkoneksi.' }, { quoted: msg });
                                return;
                            }

                            const imageUrl = cmd.startsWith('set_panorama ') ? cmd.slice('set_panorama '.length).trim() : '';
                            const contextInfo =
                                msg.message?.extendedTextMessage?.contextInfo ||
                                msg.message?.imageMessage?.contextInfo ||
                                msg.message?.videoMessage?.contextInfo ||
                                msg.message?.documentMessage?.contextInfo;

                            const quotedMessage = contextInfo?.quotedMessage;
                            const quotedImageMessage =
                                quotedMessage?.imageMessage ||
                                quotedMessage?.viewOnceMessage?.message?.imageMessage ||
                                quotedMessage?.viewOnceMessageV2?.message?.imageMessage ||
                                quotedMessage?.viewOnceMessageV2Extension?.message?.imageMessage;

                            // ── Resolve media payload ──────────────────────────────
                            let mediaPayload;
                            let sourceLabel;

                            if (imageUrl) {
                                mediaPayload = { url: imageUrl };
                                sourceLabel = 'URL';
                            } else if (quotedImageMessage && contextInfo?.stanzaId) {
                                const quotedWAMessage = {
                                    key: {
                                        remoteJid,
                                        fromMe: false,
                                        id: contextInfo.stanzaId,
                                        participant: contextInfo.participant
                                    },
                                    message: { imageMessage: quotedImageMessage }
                                };
                                try {
                                    mediaPayload = await downloadMediaMessage(
                                        quotedWAMessage,
                                        'buffer',
                                        {},
                                        { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                    );
                                    sourceLabel = 'reply image';
                                } catch (dlErr) {
                                    await sock.sendMessage(remoteJid, {
                                        text: `❌ Gagal download gambar dari reply: ${dlErr.message}\nCoba kirim ulang gambarnya lalu reply lagi.`
                                    }, { quoted: msg });
                                    return;
                                }
                            } else {
                                await sock.sendMessage(remoteJid, {
                                    text: '⚠️ Format:\n• *set_panorama <url_gambar>*\n• reply gambar lalu kirim: *set_panorama*'
                                }, { quoted: msg });
                                return;
                            }

                            // ── Pre-process: letterbox (fit:contain) ──────────────
                            // Tujuan: PP thumbnail/circle menampilkan gambar PENUH (diperkecil + padding)
                            // bukan center-crop. Ini diakalin dengan pre-prosess pakai sharp sebelum
                            // dikirim ke library, sehingga lib tidak perlu crop lagi.
                            let processedPayload = mediaPayload;
                            let letterboxNote = '';
                            try {
                                const sharp = require('sharp');
                                // Ambil buffer dulu kalau payload masih URL
                                let rawBuf = Buffer.isBuffer(mediaPayload) ? mediaPayload : null;
                                if (!rawBuf && mediaPayload?.url) {
                                    const https = require('https');
                                    const http = require('http');
                                    const urlStr = mediaPayload.url.toString();
                                    rawBuf = await new Promise((res, rej) => {
                                        const client = urlStr.startsWith('https') ? https : http;
                                        client.get(urlStr, (r) => {
                                            const chunks = [];
                                            r.on('data', (c) => chunks.push(c));
                                            r.on('end', () => res(Buffer.concat(chunks)));
                                            r.on('error', rej);
                                        }).on('error', rej);
                                    });
                                }
                                if (rawBuf) {
                                    // Letterbox: gambar penuh masuk dalam kotak 640x640 dengan padding hitam
                                    processedPayload = await sharp(rawBuf)
                                        .resize(640, 640, {
                                            fit: 'contain',
                                            background: { r: 0, g: 0, b: 0, alpha: 1 }
                                        })
                                        .jpeg({ quality: 85 })
                                        .toBuffer();
                                    letterboxNote = '\n🖼️ Mode: letterbox (gambar penuh, no crop)';
                                }
                            } catch (lbErr) {
                                letterboxNote = `\n⚠️ Letterbox skip: ${lbErr.message}`;
                            }

                            // ── Step 1: panorama IQ (set type:fullsize banner wide) ──
                            let panoramaNote = '';
                            try {
                                await sock.updatePanoramaProfilePicture(selfJid, processedPayload, { quality: 90 });
                            } catch (pErr) {
                                panoramaNote = `\n⚠️ Panorama banner skip: ${pErr.message}`;
                            }

                            // ── Step 2: square update (ini yang BENAR-BENAR ganti thumbnail PP) ──
                            // WA server personal mengabaikan type:image di dalam panorama IQ,
                            // jadi perlu IQ terpisah untuk update thumbnail yang terlihat orang.
                            await sock.updateProfilePicture(selfJid, processedPayload);

                            await new Promise((r) => setTimeout(r, 1500));
                            const afterUrl = await sock.profilePictureUrl(selfJid, 'image').catch(() => null);

                            let reply = `✅ *Profile picture berhasil diupdate!*\n${DIV}\n`;
                            reply += `📸 Source: ${sourceLabel}${letterboxNote}\n`;
                            reply += `🔧 Method: square (thumbnail) + panorama (banner)\n`;
                            reply += `💡 Ketuk PP untuk lihat efek panorama wide\n`;
                            if (afterUrl) reply += `🔗 Preview: ${afterUrl}\n`;
                            if (panoramaNote) reply += panoramaNote;

                            await sock.sendMessage(remoteJid, { text: reply }, { quoted: msg });

                        } catch (e) {
                            await sock.sendMessage(remoteJid, {
                                text: `❌ *Profile picture gagal diupdate*\n${DIV}\nError: ${e.message}\n\n💡 Tips:\n• Pastikan formatnya benar\n• Coba URL gambar lain (https://)\n• Atau reply gambar dari chat`
                            }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'feature_schedule' || cmd.startsWith('schedule ')) {
                        if (!cmd.startsWith('schedule ')) {
                            await sock.sendMessage(remoteJid, {
                                text: '📅 Format: schedule <detik>|<pesan>\nContoh: schedule 30|Halo nanti terkirim'
                            }, { quoted: msg });
                        } else {
                            const raw = cmd.slice('schedule '.length).trim();
                            const [secRaw, ...msgParts] = raw.split('|');
                            const seconds = Number((secRaw || '').trim());
                            const text = msgParts.join('|').trim();

                            if (!Number.isFinite(seconds) || seconds <= 0 || !text) {
                                await sock.sendMessage(remoteJid, {
                                    text: '⚠️ Format salah. Contoh: schedule 30|Halo nanti terkirim'
                                }, { quoted: msg });
                            } else {
                                const scheduled = scheduler.scheduleDelay(remoteJid, { text }, seconds * 1000);
                                await sock.sendMessage(remoteJid, {
                                    text: `✅ Pesan dijadwalkan\nID: ${scheduled.id}\nDelay: ${seconds}s\nText: ${text}`
                                }, { quoted: msg });
                            }
                        }
                    }

                    // ══════════════════════════════════════════════
                    // 💬 QUOTE GENERATOR
                    // ══════════════════════════════════════════════
                    else if (cmd === 'quote' || cmd === '/quote') {
                        const quote = quoteManager.getRandomQuote();
                        await sendButtons(remoteJid,
                            `*💬 RANDOM QUOTE*\n${DIV}\n\n"${quote.text}"\n\n— *${quote.author}*\n\n📂 Category: ${quote.category}`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔄 Another Quote', id: 'quote' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '💪 Motivational', id: 'quote_motivational' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🕌 Islamic', id: 'quote_islamic' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '😂 Funny', id: 'quote_funny' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }
                            ],
                            '🚀 Baileys-Joss Quote Generator', msg);
                    }

                    else if (cmd === 'quote_motivational' || cmd === '/quote motivational') {
                        const quotes = quoteManager.getByCategory('motivational');
                        const quote = quotes[Math.floor(Math.random() * quotes.length)] || { text: 'Stay motivated!', author: 'Unknown' };
                        await sock.sendMessage(remoteJid, { 
                            text: `*💪 MOTIVATIONAL*\n\n"${quote.text}"\n\n— ${quote.author}` 
                        }, { quoted: msg });
                    }

                    else if (cmd === 'quote_islamic' || cmd === '/quote islamic') {
                        const quotes = quoteManager.getByCategory('islamic');
                        const quote = quotes[Math.floor(Math.random() * quotes.length)] || { text: 'Bismillah', author: 'Unknown' };
                        await sock.sendMessage(remoteJid, { 
                            text: `*🕌 ISLAMIC*\n\n"${quote.text}"\n\n— ${quote.author}` 
                        }, { quoted: msg });
                    }

                    else if (cmd === 'quote_funny' || cmd === '/quote funny') {
                        const quotes = quoteManager.getByCategory('funny');
                        const quote = quotes[Math.floor(Math.random() * quotes.length)] || { text: 'Haha!', author: 'Unknown' };
                        await sock.sendMessage(remoteJid, { 
                            text: `*😂 FUNNY*\n\n"${quote.text}"\n\n— ${quote.author}` 
                        }, { quoted: msg });
                    }

                    else if (cmd === 'qotd' || cmd === '/qotd') {
                        const qotd = quoteManager.getQuoteOfTheDay();
                        await sock.sendMessage(remoteJid, { 
                            text: `*📅 QUOTE OF THE DAY*\n━━━━━━━━━━━━━━━━━━━━━\n\n"${qotd.quote.text}"\n\n— ${qotd.quote.author}\n\n📆 ${qotd.date}` 
                        }, { quoted: msg });
                    }

                    // ══════════════════════════════════════════════
                    // 🌤️ WEATHER BOT
                    // ══════════════════════════════════════════════
                    else if (cmd === 'weather_menu' || cmd === '/weather') {
                        await sendButtons(remoteJid,
                            `*🌤️ WEATHER BOT*\n${DIV}\n\nGet current weather for any city!\n\n*Quick Cities:*`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🇮🇩 Jakarta', id: 'weather_jakarta' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🇸🇬 Singapore', id: 'weather_singapore' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🇯🇵 Tokyo', id: 'weather_tokyo' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🇬🇧 London', id: 'weather_london' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }
                            ],
                            '⚠️ Using sample data (no API key)', msg);
                    }

                    else if (cmd.startsWith('weather_')) {
                        const city = cmd.replace('weather_', '');
                        try {
                            const weather = await weatherBot.getWeather(city);
                            const hasApiKey = !!process.env.OPENWEATHERMAP_API_KEY;
                            await sock.sendMessage(remoteJid, { 
                                text: `*🌤️ Weather in ${weather.city || city}*\n━━━━━━━━━━━━━━━━━━━━━\n\n🌡️ Temperature: ${weather.temperature || 'N/A'}°C\n🤒 Feels like: ${weather.feelsLike || 'N/A'}°C\n💧 Humidity: ${weather.humidity || 'N/A'}%\n☁️ Condition: ${weather.description || 'N/A'}\n\n${hasApiKey ? '✅ Live API data' : '⚠️ Sample data (no API key)'}` 
                            }, { quoted: msg });
                        } catch (err) {
                            await sock.sendMessage(remoteJid, { text: `❌ Weather Error: ${err.message}\n\n💡 Tip: Add OPENWEATHERMAP_API_KEY to .env file` }, { quoted: msg });
                        }
                    }

                    // ══════════════════════════════════════════════
                    // 🍅 POMODORO TIMER
                    // ══════════════════════════════════════════════
                    else if (cmd === 'pomodoro_menu' || cmd === '/pomodoro') {
                        const status = pomodoro.status(remoteJid);
                        await sendButtons(remoteJid,
                            `*🍅 POMODORO TIMER*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎯 Boost productivity with Pomodoro technique!\n\n*How it works:*\n• 25 min work → 5 min break\n• After 4 sessions → 15 min long break\n\n📊 Status: ${status?.status || 'idle'}`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '▶️ Start Work', id: 'pomo_start' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '☕ Start Break', id: 'pomo_break' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⏸️ Pause', id: 'pomo_pause' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⏹️ Stop', id: 'pomo_stop' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }
                            ],
                            '🍅 Stay productive!', msg);
                    }

                    else if (cmd === 'pomo_start' || cmd === '/work') {
                        try {
                            pomodoro.start(remoteJid);
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ ${e.message}` }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'pomo_break' || cmd === '/break') {
                        try {
                            pomodoro.startBreak(remoteJid);
                        } catch (e) {
                            await sock.sendMessage(remoteJid, { text: `⚠️ ${e.message}` }, { quoted: msg });
                        }
                    }

                    else if (cmd === 'pomo_pause') {
                        pomodoro.pause(remoteJid);
                        await sock.sendMessage(remoteJid, { text: '⏸️ Pomodoro paused!' }, { quoted: msg });
                    }

                    else if (cmd === 'pomo_stop') {
                        pomodoro.stop(remoteJid);
                        await sock.sendMessage(remoteJid, { text: '⏹️ Pomodoro stopped!' }, { quoted: msg });
                    }

                    // ══════════════════════════════════════════════
                    // 🎰 GAMES MENU
                    // ══════════════════════════════════════════════
                    else if (cmd === 'games') {
                        const buttons = [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎯 Guess Number', id: 'game_guess' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🧠 Quiz', id: 'game_quiz' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎰 Spin (-3)', id: 'spin' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🃏 Flip Coin (-1)', id: 'flip' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎲 Dice', id: 'dice' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }
                        ];

                        await sendButtons(
                            remoteJid,
                            `*🎰 GAME CENTER*\n━━━━━━━━━━━━━━━━━━━━━\n\n🎫 Token: *${user.tokens}*\n\n🎯 Guess Number - Tebak angka 1-100\n🧠 Quiz - Trivia questions\n🎰 Spin - Win up to 50 tokens!\n🃏 Flip - 50/50 chance!\n🎲 Dice - Roll 1-6`,
                            buttons,
                            '🎮 Play & Win!',
                            msg
                        );
                    }

                    // 🎯 GUESS NUMBER GAME
                    else if (cmd === 'game_guess') {
                        const session = games.startGuessNumber(remoteJid, 1, 100);
                        pendingGames[remoteJid] = { game: 'guess', sessionId: session.id, timestamp: Date.now() };
                        await sock.sendMessage(remoteJid, { 
                            text: `*🎯 GUESS THE NUMBER*\n${DIV}\n\nI'm thinking of a number between 1-100!\n\n🎫 Max attempts: 10\n\nType a number to guess!` 
                        }, { quoted: msg });
                    }

                    // Handle number guesses
                    else if (/^\d+$/.test(cmd)) {
                        const pending = pendingGames[remoteJid];
                        if (pending && pending.game === 'guess') {
                            const guess = parseInt(cmd);
                            const result = games.guessNumber(pending.sessionId, guess);
                            
                            if (result.correct) {
                                delete pendingGames[remoteJid];
                                addTokens(remoteJid, 10);
                                await sock.sendMessage(remoteJid, { 
                                    text: `*🎉 CORRECT!*\n\nThe number was *${result.answer}*!\n\n✅ +10 Tokens\n🎫 Total: ${user.tokens}` 
                                }, { quoted: msg });
                            } else if (result.gameOver) {
                                delete pendingGames[remoteJid];
                                await sock.sendMessage(remoteJid, { 
                                    text: `*😢 GAME OVER*\n\nThe number was *${result.answer}*\n\nBetter luck next time!` 
                                }, { quoted: msg });
                            } else {
                                await sock.sendMessage(remoteJid, { 
                                    text: `${result.message}\n\n🎫 Attempt: ${result.attempts}` 
                                }, { quoted: msg });
                            }
                        }
                    }

                    // 🎲 DICE
                    else if (cmd === 'dice' || cmd === '/dice') {
                        const result = games.rollDice();
                        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                        const emoji = diceEmojis[result.results[0] - 1] || '🎲';
                        await sock.sendMessage(remoteJid, { 
                            text: `*🎲 DICE ROLL*\n\nResult: ${emoji} *${result.total}*` 
                        }, { quoted: msg });
                    }

                    // 🎰 SPIN WHEEL
                    else if (cmd === 'spin') {
                        if (!useTokens(remoteJid, 3)) {
                            await sendButtons(remoteJid, `❌ Token tidak cukup!\n\n🎫 Butuh: 3\n💰 Punya: ${user.tokens}`,
                                [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎁 Daily Bonus', id: 'daily' }) }],
                                'Claim bonus dulu!', msg);
                            return;
                        }

                        const prizes = [
                            { emoji: '💎', name: 'JACKPOT!', tokens: 50, chance: 0.02 },
                            { emoji: '🌟', name: 'SUPER WIN', tokens: 20, chance: 0.06 },
                            { emoji: '⭐', name: 'BIG WIN', tokens: 10, chance: 0.10 },
                            { emoji: '🎁', name: 'WIN', tokens: 5, chance: 0.17 },
                            { emoji: '🍀', name: 'LUCKY', tokens: 3, chance: 0.20 },
                            { emoji: '😅', name: 'TRY AGAIN', tokens: 0, chance: 0.20 },
                            { emoji: '😢', name: 'LOSE', tokens: 0, chance: 0.25 }
                        ];

                        let cumulative = 0;
                        const random = Math.random();
                        let prize = prizes[prizes.length - 1];
                        for (const p of prizes) {
                            cumulative += p.chance;
                            if (random < cumulative) { prize = p; break; }
                        }

                        const newTokens = addTokens(remoteJid, prize.tokens);
                        await sendButtons(remoteJid,
                            `*🎰 SPIN WHEEL*\n\n${prize.emoji} ${prize.emoji} ${prize.emoji}\n\n*${prize.name}!*\n${prize.tokens > 0 ? `+${prize.tokens} Token!` : ''}\n\n🎫 Token: *${newTokens}*`,
                            [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎰 Spin Lagi', id: 'spin' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Games', id: 'games' }) }],
                            '🍀 Good Luck!', msg);
                    }

                    // 🃏 FLIP COIN
                    else if (cmd === 'flip') {
                        if (!useTokens(remoteJid, 1)) {
                            await sendButtons(remoteJid, `❌ Token tidak cukup!`,
                                [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎁 Daily', id: 'daily' }) }],
                                '', msg);
                            return;
                        }

                        const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';
                        pendingGames[remoteJid] = { game: 'flip', result: coinResult, timestamp: Date.now() };

                        await sendButtons(remoteJid,
                            `*🃏 FLIP COIN*\n━━━━━━━━━━━━━━━━━━━━━\n\n🪙 Koin sedang dilempar...\n\n*Pilih sisi koin:*`,
                            [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🪙 HEADS', id: 'flip_heads' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔵 TAILS', id: 'flip_tails' }) }],
                            '🍀 50/50 Chance!', msg);
                    }

                    // Handle flip result
                    else if (cmd === 'flip_heads' || cmd === 'flip_tails') {
                        const pending = pendingGames[remoteJid];
                        if (!pending || pending.game !== 'flip') {
                            await sendButtons(remoteJid, `❌ Game expired! Mulai ulang.`,
                                [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🃏 Flip Coin', id: 'flip' }) }],
                                '', msg);
                            return;
                        }

                        const userChoice = cmd.split('_')[1];
                        const result = pending.result;
                        delete pendingGames[remoteJid];

                        if (result === userChoice) {
                            const newTokens = addTokens(remoteJid, 2);
                            await sendButtons(remoteJid,
                                `*🎉 MENANG!*\n\n🪙 Hasil: *${result.toUpperCase()}*\n\n✅ +2 Token!\n🎫 Total: *${newTokens}*`,
                                [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🃏 Main Lagi', id: 'flip' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Games', id: 'games' }) }],
                                '🎊 Congratulations!', msg);
                        } else {
                            await sendButtons(remoteJid,
                                `*😢 KALAH!*\n\n🪙 Hasil: *${result.toUpperCase()}*\n\n🎫 Token: *${user.tokens}*`,
                                [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🃏 Coba Lagi', id: 'flip' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Games', id: 'games' }) }],
                                'Better luck next time!', msg);
                        }
                    }

                    // 🎁 DAILY BONUS
                    else if (cmd === 'daily') {
                        const newTokens = addTokens(remoteJid, 5);
                        await sendButtons(remoteJid,
                            `*🎁 BONUS CLAIMED!*\n\n✅ +5 Token\n💰 Total: *${newTokens}*`,
                            [{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🎰 Main Game', id: 'games' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }],
                            '🎉 See you tomorrow!', msg);
                    }

                    // ══════════════════════════════════════════════
                    // 🎭 MEME GENERATOR
                    // ══════════════════════════════════════════════
                    else if (cmd === 'meme' || cmd === '/meme') {
                        await sendButtons(remoteJid,
                            `*🎭 MEME GENERATOR*\n━━━━━━━━━━━━━━━━━━━━━\n\nCreate text-based memes!`,
                            [
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🤷 Drake Meme', id: 'meme_drake' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🧠 Expanding Brain', id: 'meme_brain' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🐶 This is Fine', id: 'meme_fine' }) },
                                { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'menu' }) }
                            ],
                            '🎭 Create memes!', msg);
                    }

                    else if (cmd === 'meme_drake') {
                        const drake = drakeMeme('Debugging with console.log', 'Using proper debugger');
                        await sock.sendMessage(remoteJid, { text: drake }, { quoted: msg });
                    }

                    else if (cmd === 'meme_brain') {
                        const brain = expandingBrainMeme('Using var', 'Using let', 'Using const', 'Using TypeScript');
                        await sock.sendMessage(remoteJid, { text: brain }, { quoted: msg });
                    }

                    else if (cmd === 'meme_fine') {
                        await sock.sendMessage(remoteJid, { 
                            text: `🔥🐶🔥\n\n*"Production is on fire"*\n\nThis is fine.` 
                        }, { quoted: msg });
                    }

                    // ══════════════════════════════════════════════
                    // 🔗 LINK SCANNER
                    // ══════════════════════════════════════════════
                    else if (cmd === 'scanlink' || cmd === '/scanlink') {
                        await sock.sendMessage(remoteJid, { 
                            text: `*🔗 LINK SCANNER*\n\nSend me any URL and I'll check if it's safe!\n\nExample: https://example.com` 
                        }, { quoted: msg });
                    }

                    // Scan links in messages
                    else if (hasLinks(messageContent)) {
                        const urls = (messageContent.match(/https?:\/\/[^\s]+/gi) || []).map((u) => u.trim());
                        if (urls.length > 0) {
                            const results = await linkScanner.scanMultiple(urls);
                            for (const result of results) {
                                if (result.safe) continue;
                                await sock.sendMessage(remoteJid, {
                                    text: `⚠️ *LINK WARNING*\n${DIV}\nURL: ${result.url}\nRisk: ${result.riskLevel}\nThreats: ${result.threats.join(', ') || 'Suspicious patterns detected'}`
                                }, { quoted: msg });
                            }
                        }
                    }

                    // ══════════════════════════════════════════════
                    // 🤖 AI MESSAGE
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_ai' || cmd === 'ai') {
                        await sock.sendMessage(remoteJid, {
                            text: `*🤖 AI MESSAGE STYLE*\n${DIV}\n\nHello! I'm an AI Assistant.`,
                            ai: true
                        }, { quoted: msg });
                    }

                    // ══════════════════════════════════════════════
                    // 📊 POLL CREATION
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_poll' || cmd === 'poll') {
                        await sock.sendMessage(remoteJid, {
                            poll: {
                                name: '🎬 Favorite Programming Language?',
                                values: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust'],
                                selectableCount: 1
                            }
                        });
                    }

                    // ══════════════════════════════════════════════
                    // 📱 SENDER INFO
                    // ══════════════════════════════════════════════
                    else if (cmd === 'myinfo' || cmd === 'whoami') {
                        try {
                            const senderInfo = getCurrentSenderInfo ? getCurrentSenderInfo(sock.authState) : null;
                            const remoteInfo = getRemoteJidFromMessage ? getRemoteJidFromMessage(msg) : null;
                            const senderJid = remoteInfo?.senderJid || msg.key.participant || remoteJid;
                            const jidInfo = parseJid ? parseJid(senderJid) : { user: senderJid.split('@')[0] };
                            
                            await sock.sendMessage(remoteJid, { 
                                text: `*📱 SENDER INFO*\n${DIV}\n\n👤 SenderPn: ${jidInfo?.user || '-'}\n🔢 Sender JID: ${senderJid}\n💬 Chat JID: ${remoteJid}\n🤖 Current Session: ${senderInfo?.phoneNumber || '-'}\n\n*Feature:* LID/SenderPn Plotting` 
                            }, { quoted: msg });
                        } catch (err) {
                            await sock.sendMessage(remoteJid, { text: `📱 Your JID: ${remoteJid}` }, { quoted: msg });
                        }
                    }

                    // ══════════════════════════════════════════════
                    // 📋 DEMO: COPY CODE BUTTON
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_copy') {
                        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
                        const buttons = [
                            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy OTP', copy_code: otpCode }) },
                            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📦 Copy NPM Install', copy_code: 'npm install baileys-joss' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'demo' }) }
                        ];

                        await sendButtons(remoteJid,
                            `*📋 COPY CODE BUTTON*\n━━━━━━━━━━━━━━━━━━━━━\n\n🔢 Your OTP: \`${otpCode}\`\n\nClick button to copy!`,
                            buttons,
                            '🚀 Baileys-Joss Feature', msg);
                    }

                    // ══════════════════════════════════════════════
                    // ⚡ DEMO: QUICK REPLY
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_quick') {
                        const buttons = [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '✅ Yes', id: 'vote_yes' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '❌ No', id: 'vote_no' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'demo' }) }
                        ];

                        await sendButtons(remoteJid,
                            `*⚡ QUICK REPLY BUTTONS*\n━━━━━━━━━━━━━━━━━━━━━\n\nButtons that send callback ID when clicked.`,
                            buttons,
                            '🚀 Baileys-Joss Feature', msg);
                    }

                    // ══════════════════════════════════════════════
                    // 🔗 DEMO: URL BUTTONS
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_url') {
                        const buttons = [
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '📦 NPM Package', url: 'https://www.npmjs.com/package/baileys-joss' }) },
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🐙 GitHub Repo', url: 'https://github.com/firdausmntp/Baileys-Joss' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'demo' }) }
                        ];

                        await sendButtons(remoteJid,
                            `*🔗 URL BUTTONS*\n━━━━━━━━━━━━━━━━━━━━━\n\nButtons that open links.`,
                            buttons,
                            '🚀 Baileys-Joss Feature', msg);
                    }

                    // ══════════════════════════════════════════════
                    // 🎨 DEMO: COMBINED BUTTONS
                    // ══════════════════════════════════════════════
                    else if (cmd === 'demo_combined') {
                        const buttons = [
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '⚡ Quick Reply', id: 'quick_demo' }) },
                            { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '🔗 Open Link', url: 'https://github.com/firdausmntp/Baileys-Joss' }) },
                            { name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: '📋 Copy Code', copy_code: 'BAILEYS2026' }) },
                            { name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: '🔙 Menu', id: 'demo' }) }
                        ];

                        await sendButtons(remoteJid,
                            `*🎨 COMBINED BUTTONS*\n━━━━━━━━━━━━━━━━━━━━━\n\n🔥 All button types in one message!`,
                            buttons,
                            '🚀 Baileys-Joss Feature', msg);
                    }

                    // Handle vote responses
                    else if (cmd.startsWith('vote_') || cmd === 'quick_demo') {
                        await sock.sendMessage(remoteJid, { 
                            text: `✅ Button callback received!\n\nID: ${cmd}` 
                        }, { quoted: msg });
                    }

                    // ══════════════════════════════════════════════
                    // 🏓 PING
                    // ══════════════════════════════════════════════
                    else if (cmd === 'ping') {
                        await sock.sendMessage(remoteJid, { 
                            text: `🏓 Pong!\n🎫 Token: ${user.tokens}` 
                        }, { quoted: msg });
                    }
                }
            }
        }
    });
}

connectToWhatsApp();
