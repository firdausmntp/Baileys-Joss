/**
 * Baileys-Joss: Chat Export
 * 
 * Export chat ke JSON, HTML, atau TXT
 */

import type { WAMessage } from '../Types'

export type ExportFormat = 'json' | 'html' | 'txt' | 'csv'

export interface ExportOptions {
	/** Export format */
	format: ExportFormat
	/** Include media info (not actual media) */
	includeMediaInfo?: boolean
	/** Include message metadata */
	includeMetadata?: boolean
	/** Date format string */
	dateFormat?: string
	/** Title for HTML export */
	title?: string
	/** Custom CSS for HTML export */
	customCss?: string
	/** Filter messages by date range */
	dateRange?: { start: Date; end: Date }
	/** Filter by sender */
	fromSender?: string
	/** Only messages from me */
	fromMe?: boolean
}

export interface ExportResult {
	content: string
	format: ExportFormat
	messageCount: number
	exportedAt: Date
	filename: string
}

/**
 * Format date for display
 */
const formatDate = (timestamp: number | { low: number; high: number; unsigned?: boolean } | null | undefined, format?: string): string => {
	if (!timestamp) return 'Unknown'
	const time = typeof timestamp === 'number' ? timestamp * 1000 : Number(timestamp) * 1000
	const date = new Date(time)

	if (format) {
		// Simple format implementation
		return format
			.replace('YYYY', date.getFullYear().toString())
			.replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
			.replace('DD', date.getDate().toString().padStart(2, '0'))
			.replace('HH', date.getHours().toString().padStart(2, '0'))
			.replace('mm', date.getMinutes().toString().padStart(2, '0'))
			.replace('ss', date.getSeconds().toString().padStart(2, '0'))
	}

	return date.toLocaleString()
}

/**
 * Extract text from message
 */
const extractText = (message: WAMessage): string => {
	const content = message.message
	if (!content) return '[Empty Message]'

	if (content.conversation) return content.conversation
	if (content.extendedTextMessage?.text) return content.extendedTextMessage.text
	if (content.imageMessage?.caption) return `[Image] ${content.imageMessage.caption}`
	if (content.videoMessage?.caption) return `[Video] ${content.videoMessage.caption}`
	if (content.documentMessage?.caption) return `[Document: ${content.documentMessage.fileName}] ${content.documentMessage.caption || ''}`
	if (content.audioMessage) return content.audioMessage.ptt ? '[Voice Note]' : '[Audio]'
	if (content.stickerMessage) return '[Sticker]'
	if (content.locationMessage) return `[Location: ${content.locationMessage.name || 'Unknown'}]`
	if (content.contactMessage) return `[Contact: ${content.contactMessage.displayName}]`
	if (content.pollCreationMessage) return `[Poll: ${content.pollCreationMessage.name}]`

	return '[Unsupported Message]'
}

/**
 * Get sender name
 */
const getSender = (message: WAMessage): string => {
	if (message.key.fromMe) return 'You'
	return message.key.participant || message.key.remoteJid || 'Unknown'
}

/**
 * Filter messages based on options
 */
const filterMessages = (messages: WAMessage[], options: ExportOptions): WAMessage[] => {
	return messages.filter(msg => {
		// Date range filter
		if (options.dateRange) {
			const ts = msg.messageTimestamp
			if (ts) {
				const time = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
				if (time < options.dateRange.start.getTime() || time > options.dateRange.end.getTime()) {
					return false
				}
			}
		}

		// Sender filter
		if (options.fromSender) {
			const sender = msg.key.participant || msg.key.remoteJid
			if (sender !== options.fromSender) return false
		}

		// From me filter
		if (options.fromMe !== undefined && msg.key.fromMe !== options.fromMe) {
			return false
		}

		return true
	})
}

/**
 * Export to JSON
 */
const exportToJson = (messages: WAMessage[], options: ExportOptions): string => {
	const data = messages.map(msg => {
		const base: any = {
			id: msg.key.id,
			from: getSender(msg),
			text: extractText(msg),
			timestamp: formatDate(msg.messageTimestamp, options.dateFormat)
		}

		if (options.includeMetadata) {
			base.fromMe = msg.key.fromMe
			base.remoteJid = msg.key.remoteJid
			base.participant = msg.key.participant
			base.status = msg.status
		}

		if (options.includeMediaInfo && msg.message) {
			const content = msg.message
			if (content.imageMessage) {
				base.media = { type: 'image', mimetype: content.imageMessage.mimetype }
			} else if (content.videoMessage) {
				base.media = { type: 'video', mimetype: content.videoMessage.mimetype }
			} else if (content.audioMessage) {
				base.media = { type: 'audio', mimetype: content.audioMessage.mimetype, ptt: content.audioMessage.ptt }
			} else if (content.documentMessage) {
				base.media = { type: 'document', filename: content.documentMessage.fileName, mimetype: content.documentMessage.mimetype }
			}
		}

		return base
	})

	return JSON.stringify(data, null, 2)
}

/**
 * Export to HTML
 */
const exportToHtml = (messages: WAMessage[], options: ExportOptions): string => {
	const title = options.title || 'Chat Export'
	const css = options.customCss || `
		body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f0f0f0; }
		.header { text-align: center; margin-bottom: 20px; }
		.message { margin: 10px 0; padding: 10px 15px; border-radius: 10px; max-width: 80%; }
		.message.from-me { background: #dcf8c6; margin-left: auto; }
		.message.from-other { background: white; }
		.sender { font-weight: bold; font-size: 0.9em; color: #128c7e; }
		.time { font-size: 0.75em; color: #888; margin-top: 5px; }
		.text { margin-top: 5px; word-wrap: break-word; }
		.media-info { font-style: italic; color: #666; }
	`

	const messageHtml = messages.map(msg => {
		const isFromMe = msg.key.fromMe
		const sender = getSender(msg)
		const text = extractText(msg)
		const time = formatDate(msg.messageTimestamp, options.dateFormat)

		return `
		<div class="message ${isFromMe ? 'from-me' : 'from-other'}">
			<div class="sender">${escapeHtml(sender)}</div>
			<div class="text">${escapeHtml(text)}</div>
			<div class="time">${escapeHtml(time)}</div>
		</div>`
	}).join('\n')

	return `<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
	<style>${css}</style>
</head>
<body>
	<div class="header">
		<h1>${escapeHtml(title)}</h1>
		<p>${messages.length} messages</p>
	</div>
	${messageHtml}
</body>
</html>`
}

/**
 * Export to TXT
 */
const exportToTxt = (messages: WAMessage[], options: ExportOptions): string => {
	return messages.map(msg => {
		const sender = getSender(msg)
		const text = extractText(msg)
		const time = formatDate(msg.messageTimestamp, options.dateFormat)
		return `[${time}] ${sender}: ${text}`
	}).join('\n')
}

/**
 * Export to CSV
 */
const exportToCsv = (messages: WAMessage[], options: ExportOptions): string => {
	const headers = ['Timestamp', 'Sender', 'Message', 'FromMe']
	if (options.includeMetadata) {
		headers.push('RemoteJid', 'Participant', 'MessageId')
	}

	const rows = messages.map(msg => {
		const row = [
			formatDate(msg.messageTimestamp, options.dateFormat),
			getSender(msg),
			extractText(msg).replace(/"/g, '""'),
			msg.key.fromMe ? 'Yes' : 'No'
		]

		if (options.includeMetadata) {
			row.push(
				msg.key.remoteJid || '',
				msg.key.participant || '',
				msg.key.id || ''
			)
		}

		return row.map(cell => `"${cell}"`).join(',')
	})

	return [headers.join(','), ...rows].join('\n')
}

/**
 * Escape HTML special characters
 */
const escapeHtml = (text: string): string => {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
		.replace(/\n/g, '<br>')
}

/**
 * Export chat messages
 */
export const exportChat = (
	messages: WAMessage[],
	jid: string,
	options: ExportOptions
): ExportResult => {
	const filtered = filterMessages(messages, options)
	let content: string

	switch (options.format) {
		case 'json':
			content = exportToJson(filtered, options)
			break
		case 'html':
			content = exportToHtml(filtered, options)
			break
		case 'csv':
			content = exportToCsv(filtered, options)
			break
		case 'txt':
		default:
			content = exportToTxt(filtered, options)
			break
	}

	const timestamp = Date.now()
	const extension = options.format === 'html' ? 'html' : options.format
	const sanitizedJid = jid.replace(/[^a-zA-Z0-9]/g, '_')

	return {
		content,
		format: options.format,
		messageCount: filtered.length,
		exportedAt: new Date(),
		filename: `chat_${sanitizedJid}_${timestamp}.${extension}`
	}
}

/**
 * Chat Export Manager
 */
export class ChatExporter {
	private messages: Map<string, WAMessage[]> = new Map()

	/**
	 * Add messages for export
	 */
	addMessages(jid: string, messages: WAMessage[]): void {
		const existing = this.messages.get(jid) || []
		this.messages.set(jid, [...existing, ...messages])
	}

	/**
	 * Export a specific chat
	 */
	export(jid: string, options: ExportOptions): ExportResult | null {
		const messages = this.messages.get(jid)
		if (!messages) return null
		return exportChat(messages, jid, options)
	}

	/**
	 * Export all chats
	 */
	exportAll(options: ExportOptions): ExportResult[] {
		const results: ExportResult[] = []
		for (const [jid, messages] of this.messages) {
			results.push(exportChat(messages, jid, options))
		}
		return results
	}

	/**
	 * Get available chats for export
	 */
	getAvailableChats(): Array<{ jid: string; messageCount: number }> {
		return Array.from(this.messages.entries()).map(([jid, msgs]) => ({
			jid,
			messageCount: msgs.length
		}))
	}

	/**
	 * Clear messages
	 */
	clear(jid?: string): void {
		if (jid) {
			this.messages.delete(jid)
		} else {
			this.messages.clear()
		}
	}
}

/**
 * Create chat exporter
 */
export const createChatExporter = (): ChatExporter => {
	return new ChatExporter()
}
