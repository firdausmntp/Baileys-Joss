<p align="center">
  <img src="https://raw.githubusercontent.com/firdausmntp/Baileys-Joss/main/Media/logo.png" alt="Baileys-Joss" width="200"/>
</p>

<h1 align="center">🚀 Baileys-Joss</h1>

<p align="center">
  <b>WhatsApp Web API Library dengan Fitur Ekstra Premium</b><br>
  Fork dari <a href="https://github.com/WhiskeySockets/Baileys">Baileys</a> dengan penambahan fitur Interactive Button, Albums, AI Message, LID Plotting, dan lainnya.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/baileys-joss"><img src="https://img.shields.io/npm/v/baileys-joss?color=brightgreen&label=npm&style=for-the-badge&logo=npm" alt="npm version"/></a>
  <a href="https://www.npmjs.com/package/baileys-joss"><img src="https://img.shields.io/npm/dm/baileys-joss?color=blue&style=for-the-badge&logo=npm" alt="npm downloads"/></a>
  <a href="https://www.npmjs.com/package/baileys-joss"><img src="https://img.shields.io/npm/dt/baileys-joss?color=blue&style=for-the-badge" alt="npm total downloads"/></a>
</p>

<p align="center">
  <a href="https://github.com/firdausmntp/Baileys-Joss/blob/main/LICENSE"><img src="https://img.shields.io/github/license/firdausmntp/Baileys-Joss?style=for-the-badge&logo=opensourceinitiative&logoColor=white" alt="license"/></a>
  <a href="https://github.com/firdausmntp/Baileys-Joss/stargazers"><img src="https://img.shields.io/github/stars/firdausmntp/Baileys-Joss?style=for-the-badge&logo=github&color=gold" alt="stars"/></a>
  <a href="https://github.com/firdausmntp/Baileys-Joss/network/members"><img src="https://img.shields.io/github/forks/firdausmntp/Baileys-Joss?style=for-the-badge&logo=github&color=purple" alt="forks"/></a>
  <a href="https://github.com/firdausmntp/Baileys-Joss/issues"><img src="https://img.shields.io/github/issues/firdausmntp/Baileys-Joss?style=for-the-badge&logo=github&color=red" alt="issues"/></a>
</p>

<p align="center">
  <a href="#-installation">📦 Installation</a> •
  <a href="#-features">✨ Features</a> •
  <a href="#-quick-start">🚀 Quick Start</a> •
  <a href="#-use-case-examples">💡 Examples</a> •
  <a href="#-api-reference">📋 API</a> •
  <a href="#-contributing">🤝 Contributing</a>
</p>

<p align="center">
  <b>📖 Documentation:</b>
  <a href="./README.md">🇮🇩 Indonesia</a> |
  <a href="./docs/README.en.md">🇺🇸 English</a>
</p>

---

## ✨ Kenapa Baileys-Joss?

<table>
<tr>
<th align="center">🎯 Feature</th>
<th align="center">Baileys Original</th>
<th align="center">Baileys-Joss</th>
</tr>
<tr>
<td>🖱️ Interactive Buttons</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>📋 List Messages</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>📋 Copy Code Button</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🔗 URL Buttons</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🔄 Combined Button Types</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🎨 Native Flow Messages</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>👤 LID/SenderPn Plotting</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🖼️ Album Messages</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🤖 AI Message Style</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>📊 Poll Creation</td>
<td align="center">✅</td>
<td align="center">✅ Enhanced</td>
</tr>
<tr>
<td>📢 Newsletter/Channel Control</td>
<td align="center">✅</td>
<td align="center">✅ Enhanced</td>
</tr>
<tr>
<td>🔐 Custom Pairing Code</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
<tr>
<td>📷 HD Profile Pictures</td>
<td align="center">✅</td>
<td align="center">✅</td>
</tr>
<tr>
<td>🔧 Fixed Button Delivery</td>
<td align="center">❌</td>
<td align="center">✅</td>
</tr>
</table>

---

## 📦 Installation

```bash
# Menggunakan npm
npm install baileys-joss

# Menggunakan yarn
yarn add baileys-joss

# Menggunakan pnpm
pnpm add baileys-joss
```

<details>
<summary><b>📦 Via package.json (Fork Override)</b></summary>

```json
// Untuk mengganti @whiskeysockets/baileys
{
  "dependencies": {
    "@whiskeysockets/baileys": "npm:baileys-joss"
  }
}

// Untuk mengganti @adiwajshing/baileys
{
  "dependencies": {
    "@adiwajshing/baileys": "npm:baileys-joss"
  }
}
```

</details>

---

## 🎯 Features

<details open>
<summary><h3>🖱️ Interactive Messages & Buttons</h3></summary>

Fitur button interactive yang lebih lengkap dan mudah digunakan:

```typescript
import { 
    generateInteractiveButtonMessage,
    generateInteractiveListMessage,
    generateTemplateMessage,
    generateCombinedButtons,
    generateCopyCodeButton,
    generateUrlButtonMessage,
    generateQuickReplyButtons
} from 'baileys-joss'

// Quick Reply Buttons
const quickButtons = generateQuickReplyButtons(
    'Pilih opsi di bawah ini:',
    [
        { id: 'btn-1', displayText: '✅ Setuju' },
        { id: 'btn-2', displayText: '❌ Tolak' },
        { id: 'btn-3', displayText: '📞 Hubungi CS' }
    ],
    { footer: 'Powered by Baileys-Joss' }
)

await sock.sendMessage(jid, quickButtons)

// URL Button
const urlButton = generateUrlButtonMessage(
    'Kunjungi website kami untuk info lebih lanjut',
    [{ displayText: '🌐 Buka Website', url: 'https://example.com' }],
    { title: 'Info Produk', footer: 'Click untuk membuka' }
)

await sock.sendMessage(jid, urlButton)

// Copy Code Button (untuk OTP, kode promo, dll)
const copyButton = generateCopyCodeButton(
    'Kode OTP Anda adalah:',
    '123456',
    '📋 Copy Kode'
)

await sock.sendMessage(jid, copyButton)

// Combined Buttons (mix URL, Reply, Copy, Call)
const combinedButtons = generateCombinedButtons(
    'Pilih aksi:',
    [
        { type: 'reply', displayText: '🛒 Pesan Sekarang', id: 'order' },
        { type: 'url', displayText: '🌐 Website', url: 'https://example.com' },
        { type: 'call', displayText: '📞 Telepon', phoneNumber: '+6281234567890' },
        { type: 'copy', displayText: '📋 Copy Promo', copyCode: 'PROMO2024' }
    ],
    { title: 'Menu Utama', footer: 'Baileys-Joss' }
)

await sock.sendMessage(jid, combinedButtons)

// List Message
const listMessage = generateInteractiveListMessage({
    title: '📋 Menu Produk',
    buttonText: 'Lihat Menu',
    description: 'Silahkan pilih produk yang diinginkan',
    footer: 'Ketik nomor untuk memesan',
    sections: [
        {
            title: 'Makanan',
            rows: [
                { rowId: 'nasi-goreng', title: 'Nasi Goreng', description: 'Rp 25.000' },
                { rowId: 'mie-goreng', title: 'Mie Goreng', description: 'Rp 22.000' }
            ]
        },
        {
            title: 'Minuman',
            rows: [
                { rowId: 'es-teh', title: 'Es Teh', description: 'Rp 5.000' },
                { rowId: 'kopi', title: 'Kopi', description: 'Rp 10.000' }
            ]
        }
    ]
})

await sock.sendMessage(jid, listMessage)
```

</details>

<details>
<summary><h3>🖼️ Album Messages (Carousel)</h3></summary>

Kirim beberapa gambar/video sekaligus dalam format album:

```typescript
// Send Album (grouped images/videos)
const albumMedia = [
    { image: { url: 'https://example.com/pic1.jpg' }, caption: 'Photo 1' },
    { image: { url: 'https://example.com/pic2.jpg' }, caption: 'Photo 2' },
    { video: { url: 'https://example.com/video.mp4' }, caption: 'Video' }
]

await sock.sendMessage(jid, { 
    album: albumMedia, 
    caption: 'My Album 📸' 
})

// Album dari file lokal
const localAlbum = [
    { image: fs.readFileSync('./image1.jpg') },
    { image: fs.readFileSync('./image2.jpg') },
    { video: fs.readFileSync('./video.mp4'), gifPlayback: true }
]

await sock.sendMessage(jid, { album: localAlbum })
```

</details>

<details>
<summary><h3>🤖 AI Message Style</h3></summary>

Tambahkan ikon AI stylish pada pesan:

```typescript
// Kirim pesan dengan AI icon
await sock.sendMessage(jid, { 
    text: 'Halo! Saya adalah asisten AI Anda 🤖',
    ai: true  // Menampilkan ikon AI pada pesan
})

// AI dengan media
await sock.sendMessage(jid, {
    image: { url: 'https://example.com/ai-generated.jpg' },
    caption: 'Generated by AI',
    ai: true
})
```

</details>

<details>
<summary><h3>📊 Poll Creation</h3></summary>

Buat polling dengan mudah:

```typescript
// Create a Poll
const pollMessage = {
    name: '🎨 Warna Favorit?',
    values: ['🔴 Merah', '🔵 Biru', '🟢 Hijau', '🟡 Kuning'],
    selectableCount: 1  // Jumlah pilihan yang bisa dipilih
}

await sock.sendMessage(jid, { poll: pollMessage })

// Multi-select Poll
const multiPoll = {
    name: '🍕 Topping Pizza Favorit?',
    values: ['Pepperoni', 'Mushroom', 'Cheese', 'Olive', 'Bacon'],
    selectableCount: 3  // Bisa pilih hingga 3 opsi
}

await sock.sendMessage(jid, { poll: multiPoll })
```

</details>

<details>
<summary><h3>📢 Newsletter/Channel Control</h3></summary>

Kelola WhatsApp Channel dengan lengkap:

```typescript
// Create Newsletter/Channel
await sock.newsletterCreate('My Channel', 'Channel description')

// Update channel info
await sock.newsletterUpdateName(channelJid, 'New Channel Name')
await sock.newsletterUpdateDescription(channelJid, 'Updated description')
await sock.newsletterUpdatePicture(channelJid, { url: 'https://example.com/pic.jpg' })

// Follow/Unfollow
await sock.newsletterFollow(channelJid)
await sock.newsletterUnfollow(channelJid)

// Mute/Unmute
await sock.newsletterMute(channelJid)
await sock.newsletterUnmute(channelJid)

// Send reaction to channel message
await sock.newsletterReactMessage(channelJid, 'server_id', '🔥')

// Get channel metadata
const metadata = await sock.newsletterMetadata('jid', channelJid)
console.log('Subscribers:', metadata.subscribers)

// Admin operations
await sock.newsletterChangeOwner(channelJid, newOwnerLid)
await sock.newsletterDemote(channelJid, adminLid)
const adminCount = await sock.newsletterAdminCount(channelJid)
```

</details>

<details>
<summary><h3>🔐 Custom Pairing Code</h3></summary>

Generate custom alphanumeric pairing code:

```typescript
// Standard pairing code
const code = await sock.requestPairingCode('6281234567890')
console.log('Your Pairing Code:', code)

// Custom alphanumeric pairing code
const customCode = await sock.requestPairingCode('6281234567890', 'MYCODE12')
console.log('Your Custom Code:', customCode)
```

</details>

<details>
<summary><h3>📍 LID & SenderPn Plotting</h3></summary>

Utilities untuk mengelola JID, LID (Linked ID), dan senderPn:

```typescript
import { 
    parseJid,
    getSenderPn,
    getCurrentSenderInfo,
    isSelf,
    plotJid,
    normalizePhoneToJid,
    extractPhoneNumber,
    formatJidDisplay,
    isSameUser,
    getJidVariants,
    getRemoteJidFromMessage,
    createJidPlotter
} from 'baileys-joss'

// Get info tentang current session (senderPn)
const senderInfo = getCurrentSenderInfo(sock.authState)
console.log('Phone:', senderInfo.phoneNumber)
console.log('Phone JID:', senderInfo.phoneJid)
console.log('LID:', senderInfo.lid)
console.log('Device ID:', senderInfo.deviceId)
console.log('Name:', senderInfo.pushName)

// Parse JID untuk info lengkap
const jidInfo = parseJid('6281234567890@s.whatsapp.net')
console.log('User:', jidInfo.user)
console.log('Is LID:', jidInfo.isLid)
console.log('Is PN:', jidInfo.isPn)
console.log('Device:', jidInfo.device)

// Check apakah JID adalah diri sendiri
const isMe = isSelf(someJid, senderInfo)

// Normalize berbagai format nomor
const jid = normalizePhoneToJid('+62 812-3456-7890') // -> 6281234567890@s.whatsapp.net

// Extract phone number dari JID
const phone = extractPhoneNumber('6281234567890@s.whatsapp.net') // -> 6281234567890

// Format untuk display
const display = formatJidDisplay('6281234567890:1@s.whatsapp.net', {
    showDevice: true,
    showType: true
}) // -> 6281234567890:1 (PN)

// Compare dua JID
const same = isSameUser('6281234567890@s.whatsapp.net', '6281234567890:1@s.whatsapp.net') // true

// Get sender dari message
sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
        const { chatJid, senderJid } = getRemoteJidFromMessage(msg)
        console.log('Chat:', chatJid)
        console.log('Sender:', senderJid)
    }
})

// Advanced: Create plotter dengan LID mapping support
const plotter = createJidPlotter(
    sock.lidMapping.getLIDForPN.bind(sock.lidMapping),
    sock.lidMapping.getPNForLID.bind(sock.lidMapping)
)

const plotted = await plotter.plotBidirectional('6281234567890@s.whatsapp.net')
console.log('Phone:', plotted.pn)
console.log('LID:', plotted.lid)
```

</details>

<details>
<summary><h3>📍 Location Sharing</h3></summary>

Kirim lokasi dengan mudah:

```typescript
// Send location
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        name: 'Jakarta, Indonesia',
        address: 'Jl. Sudirman, Jakarta Pusat'
    }
})
```

</details>

<details>
<summary><h3>👥 Group Management</h3></summary>

Kelola grup dengan lengkap:

```typescript
// Create group
const group = await sock.groupCreate('My Group', ['6281234567890@s.whatsapp.net'])

// Update group info
await sock.groupUpdateSubject(groupJid, 'New Group Name')
await sock.groupUpdateDescription(groupJid, 'New description')

// Manage participants
await sock.groupParticipantsUpdate(groupJid, ['6281234567890@s.whatsapp.net'], 'add')
await sock.groupParticipantsUpdate(groupJid, ['6281234567890@s.whatsapp.net'], 'remove')
await sock.groupParticipantsUpdate(groupJid, ['6281234567890@s.whatsapp.net'], 'promote')
await sock.groupParticipantsUpdate(groupJid, ['6281234567890@s.whatsapp.net'], 'demote')

// Get group metadata
const metadata = await sock.groupMetadata(groupJid)
console.log('Group Name:', metadata.subject)
console.log('Members:', metadata.participants.length)

// Group settings
await sock.groupSettingUpdate(groupJid, 'announcement') // Only admins can send
await sock.groupSettingUpdate(groupJid, 'not_announcement') // Everyone can send
await sock.groupSettingUpdate(groupJid, 'locked') // Only admins can edit info
await sock.groupSettingUpdate(groupJid, 'unlocked') // Everyone can edit info

// Leave group
await sock.groupLeave(groupJid)
```

</details>

---

## 🚀 Quick Start

```typescript
import makeWASocket, { 
    useMultiFileAuthState,
    DisconnectReason,
    // Interactive Message features
    generateQuickReplyButtons,
    generateInteractiveListMessage,
    generateCombinedButtons,
    // JID Plotting features
    getCurrentSenderInfo,
    parseJid,
    isSelf
} from 'baileys-joss'

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session')
    
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })
    
    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) {
                startBot()
            }
        } else if (connection === 'open') {
            console.log('✅ Connected!')
            
            // Get sender info
            const sender = getCurrentSenderInfo(sock.authState)
            console.log('📱 Logged in as:', sender?.phoneNumber)
        }
    })
    
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message || msg.key.fromMe) return
        
        const text = msg.message.conversation || 
                     msg.message.extendedTextMessage?.text || ''
        
        if (text === '/menu') {
            // Kirim interactive buttons
            const buttons = generateQuickReplyButtons(
                '🤖 Bot Menu\n\nPilih opsi:',
                [
                    { id: 'help', displayText: '❓ Bantuan' },
                    { id: 'info', displayText: 'ℹ️ Info' },
                    { id: 'order', displayText: '🛒 Order' }
                ],
                { footer: 'Baileys-Joss Bot' }
            )
            
            await sock.sendMessage(msg.key.remoteJid!, buttons)
        }
        
        if (text === '/poll') {
            // Kirim poll
            await sock.sendMessage(msg.key.remoteJid!, {
                poll: {
                    name: '🗳️ Vote sekarang!',
                    values: ['Option A', 'Option B', 'Option C'],
                    selectableCount: 1
                }
            })
        }
        
        if (text === '/ai') {
            // Kirim pesan dengan AI style
            await sock.sendMessage(msg.key.remoteJid!, {
                text: 'Halo! Saya asisten AI Anda 🤖',
                ai: true
            })
        }
    })
}

startBot()
```

---

## 💡 Use Case Examples

<details>
<summary><b>📬 Newsletter Control</b></summary>

```typescript
// Create a newsletter  
await sock.newsletterCreate('My Updates Channel', 'Stay updated!')

// Update description  
await sock.newsletterUpdateDescription(channelJid, 'Fresh updates weekly 🔥')

// Send reaction to channel message  
await sock.newsletterReactMessage(channelJid, 'server_id', '❤️')

// Fetch channel messages
const messages = await sock.newsletterFetchMessages('jid', channelJid, 10)
```

</details>

<details>
<summary><b>📌 Interactive Messaging</b></summary>

```typescript
// Native Flow Buttons
const buttons = generateCombinedButtons(
    'Welcome to our service! 🎉',
    [
        { type: 'reply', displayText: '📋 View Menu', id: 'menu' },
        { type: 'url', displayText: '🌐 Visit Website', url: 'https://example.com' },
        { type: 'call', displayText: '📞 Call Us', phoneNumber: '+1234567890' },
        { type: 'copy', displayText: '📋 Copy Promo', copyCode: 'SAVE20' }
    ],
    { title: 'Welcome!', footer: 'Powered by Baileys-Joss' }
)

await sock.sendMessage(jid, buttons)
```

</details>

<details>
<summary><b>🖼️ Send Album</b></summary>

```typescript
const media = [
    { image: { url: 'https://example.com/pic1.jpg' }, caption: 'Photo 1 📸' },
    { image: { url: 'https://example.com/pic2.jpg' }, caption: 'Photo 2 📸' },
    { video: { url: 'https://example.com/clip.mp4' }, caption: 'Video 🎬' }
]

await sock.sendMessage(jid, { 
    album: media, 
    caption: 'My Vacation Memories 🌴' 
})
```

</details>

<details>
<summary><b>🔐 Pairing with Custom Code</b></summary>

```typescript
// Request standard pairing code
const code = await sock.requestPairingCode('6281234567890')
console.log('Your Pairing Code:', code)

// Request custom pairing code
const customCode = await sock.requestPairingCode('6281234567890', 'BAILEYS1')
console.log('Your Custom Code:', customCode)
```

</details>

<details>
<summary><b>📊 Poll Creation</b></summary>

```typescript
const pollMessage = {
    name: '🎬 Film Favorit Weekend Ini?',
    values: [
        '🦸 Superhero Movie',
        '😂 Comedy',
        '😱 Horror',
        '💑 Romance'
    ],
    selectableCount: 1
}

await sock.sendMessage(jid, { poll: pollMessage })
```

</details>

<details>
<summary><b>📍 Location Sharing</b></summary>

```typescript
await sock.sendMessage(jid, {
    location: {
        degreesLatitude: -6.2088,
        degreesLongitude: 106.8456,
        name: 'Monas Jakarta',
        address: 'Jalan Medan Merdeka, Jakarta Pusat'
    }
})
```

</details>

<details>
<summary><b>👥 Group Management</b></summary>

```typescript
// Create group
const group = await sock.groupCreate('My Awesome Group', [
    '6281234567890@s.whatsapp.net',
    '6281234567891@s.whatsapp.net'
])

console.log('Group created:', group.id)

// Update group settings
await sock.groupUpdateSubject(group.id, 'Updated Group Name')
await sock.groupSettingUpdate(group.id, 'announcement')

// Add members
await sock.groupParticipantsUpdate(group.id, [
    '6281234567892@s.whatsapp.net'
], 'add')
```

</details>

---

## 📋 API Reference

<details>
<summary><b>🖱️ Interactive Messages</b></summary>

| Function | Description |
|----------|-------------|
| `generateInteractiveButtonMessage()` | Buat button message dengan media header |
| `generateInteractiveListMessage()` | Buat list message dengan sections |
| `generateTemplateMessage()` | Buat template message (Quick Reply, URL, Call) |
| `generateNativeFlowMessage()` | Buat native flow message (format terbaru) |
| `generateCopyCodeButton()` | Button untuk copy code |
| `generateUrlButtonMessage()` | Button dengan URL |
| `generateQuickReplyButtons()` | Quick reply buttons |
| `generateCombinedButtons()` | Gabungan berbagai jenis button |

</details>

<details>
<summary><b>📍 JID Plotting</b></summary>

| Function | Description |
|----------|-------------|
| `parseJid()` | Parse JID dan extract info lengkap |
| `getSenderPn()` | Get senderPn dari AuthenticationCreds |
| `getCurrentSenderInfo()` | Get current sender info dari authState |
| `isSelf()` | Check apakah JID adalah diri sendiri |
| `plotJid()` | Plot JID (basic, tanpa LID mapping) |
| `normalizePhoneToJid()` | Normalize nomor ke JID |
| `extractPhoneNumber()` | Extract phone number dari JID |
| `formatJidDisplay()` | Format JID untuk display |
| `isSameUser()` | Compare dua JID |
| `getJidVariants()` | Get semua variant JID dari nomor |
| `constructJidWithDevice()` | Construct JID dengan device ID |
| `getRemoteJidFromMessage()` | Get remoteJid dari message |
| `createJidPlotter()` | Create plotter dengan LID mapping support |

</details>

<details>
<summary><b>📢 Newsletter/Channel</b></summary>

| Function | Description |
|----------|-------------|
| `newsletterCreate()` | Buat channel baru |
| `newsletterUpdateName()` | Update nama channel |
| `newsletterUpdateDescription()` | Update deskripsi channel |
| `newsletterUpdatePicture()` | Update foto channel |
| `newsletterFollow()` | Follow channel |
| `newsletterUnfollow()` | Unfollow channel |
| `newsletterMute()` | Mute notifikasi channel |
| `newsletterUnmute()` | Unmute notifikasi channel |
| `newsletterReactMessage()` | React ke pesan channel |
| `newsletterMetadata()` | Get metadata channel |
| `newsletterAdminCount()` | Get jumlah admin |
| `newsletterChangeOwner()` | Ganti owner channel |
| `newsletterDemote()` | Demote admin channel |
| `newsletterDelete()` | Hapus channel |

</details>

<details>
<summary><b>👥 Group Management</b></summary>

| Function | Description |
|----------|-------------|
| `groupCreate()` | Buat grup baru |
| `groupUpdateSubject()` | Update nama grup |
| `groupUpdateDescription()` | Update deskripsi grup |
| `groupParticipantsUpdate()` | Add/remove/promote/demote member |
| `groupSettingUpdate()` | Update pengaturan grup |
| `groupMetadata()` | Get metadata grup |
| `groupLeave()` | Keluar dari grup |
| `groupInviteCode()` | Get kode invite grup |
| `groupAcceptInvite()` | Join grup via invite code |

</details>

<details>
<summary><b>💬 Message Types</b></summary>

| Type | Description |
|------|-------------|
| `text` | Pesan teks biasa |
| `image` | Kirim gambar |
| `video` | Kirim video |
| `audio` | Kirim audio |
| `document` | Kirim dokumen |
| `sticker` | Kirim sticker |
| `location` | Kirim lokasi |
| `contacts` | Kirim kontak |
| `poll` | Buat polling |
| `album` | Kirim album (multiple media) |
| `react` | React ke pesan |
| `edit` | Edit pesan |
| `delete` | Hapus pesan |

</details>

---

## 🔄 Changelog

<details>
<summary><b>v1.0.1</b> - Latest</summary>

- ✨ Added Album Messages support (carousel format)
- ✨ Added AI Message Style (`ai: true`) - shows AI indicator on messages
- ✨ Added Custom Pairing Code support
- ✨ Enhanced Newsletter/Channel control
- ✨ Enhanced Poll creation
- 🔧 **Fixed Interactive Buttons** - Added `biz` node for proper button rendering
- 🔧 Fixed List Messages delivery
- 🎨 Improved documentation with collapsible sections
- 🐛 Bug fixes and stability improvements

</details>

<details>
<summary><b>v1.0.0</b></summary>

- 🎉 Initial release
- ✨ Interactive Buttons support
- ✨ List Messages support
- ✨ Copy Code Button
- ✨ URL Buttons
- ✨ Combined Button Types
- ✨ Native Flow Messages
- ✨ LID/SenderPn Plotting utilities

</details>

---

## 🤝 Contributing

Kontribusi sangat diterima! Silahkan:

1. 🍴 Fork repository ini
2. 🌿 Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. 💾 Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push ke branch (`git push origin feature/AmazingFeature`)
5. 🔃 Buka Pull Request

---

## 💖 Support

Jika project ini membantu, berikan ⭐ di [GitHub](https://github.com/firdausmntp/Baileys-Joss)!

<p align="center">
  <a href="https://github.com/firdausmntp/Baileys-Joss/stargazers">
    <img src="https://img.shields.io/github/stars/firdausmntp/Baileys-Joss?style=social" alt="GitHub Stars"/>
  </a>
</p>

---

## ⚠️ Disclaimer

> **Peringatan:** Proyek ini tidak berafiliasi dengan WhatsApp atau Meta. Gunakan dengan tanggung jawab dan sesuai dengan Terms of Service WhatsApp.
> 
> ❌ **Jangan spam!**  
> ❌ **Jangan abuse API!**  
> ✅ **Gunakan untuk keperluan yang baik!**

---

## 📄 License

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.

---

## 🙏 Credits

<table>
<tr>
<td align="center">
<a href="https://github.com/WhiskeySockets/Baileys">
<b>Baileys Original</b>
</a>
<br>Base library
</td>
<td align="center">
<a href="https://github.com/WhiskeySockets">
<b>WhiskeySockets</b>
</a>
<br>Maintainer Baileys
</td>
</tr>
</table>

---

<p align="center">
  <b>Made with ❤️ by <a href="https://github.com/firdausmntp">firdausmntp</a></b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp"/>
</p>
