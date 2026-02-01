/**
 * Baileys-Joss: Chat Analytics
 * 
 * Statistik dan analitik chat
 */

import type { WAMessage } from '../Types'

export interface ChatStats {
	jid: string
	totalMessages: number
	messagesFromMe: number
	messagesFromOthers: number
	messagesByType: {
		text: number
		image: number
		video: number
		audio: number
		document: number
		sticker: number
		location: number
		contact: number
		poll: number
		other: number
	}
	participants?: Map<string, number>
	firstMessageTime?: Date
	lastMessageTime?: Date
	averageMessagesPerDay: number
	mostActiveHour: number
	mostActiveDay: string
	mediaCount: number
	linkCount: number
	emojiCount: number
	averageMessageLength: number
}

export interface GlobalStats {
	totalChats: number
	totalMessages: number
	totalContacts: number
	totalGroups: number
	messagesByType: ChatStats['messagesByType']
	mostActiveChat: { jid: string; count: number } | null
	averageMessagesPerChat: number
}

export interface TimeRange {
	start: Date
	end: Date
}

/**
 * Count emojis in text
 */
const countEmojis = (text: string): number => {
	const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
	const matches = text.match(emojiRegex)
	return matches ? matches.length : 0
}

/**
 * Count links in text
 */
const countLinks = (text: string): number => {
	const urlRegex = /https?:\/\/[^\s]+/gi
	const matches = text.match(urlRegex)
	return matches ? matches.length : 0
}

/**
 * Get day name from date
 */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const getDayName = (date: Date): string => {
	return DAYS[date.getDay()] || 'Unknown'
}

/**
 * Extract message type
 */
const getMessageTypeKey = (
	message: WAMessage
): keyof ChatStats['messagesByType'] => {
	const content = message.message
	if (!content) return 'other'

	if (content.conversation || content.extendedTextMessage) return 'text'
	if (content.imageMessage) return 'image'
	if (content.videoMessage) return 'video'
	if (content.audioMessage) return 'audio'
	if (content.documentMessage) return 'document'
	if (content.stickerMessage) return 'sticker'
	if (content.locationMessage || content.liveLocationMessage) return 'location'
	if (content.contactMessage || content.contactsArrayMessage) return 'contact'
	if (content.pollCreationMessage) return 'poll'

	return 'other'
}

/**
 * Extract text content from message
 */
const extractText = (message: WAMessage): string => {
	const content = message.message
	if (!content) return ''

	return (
		content.conversation ||
		content.extendedTextMessage?.text ||
		content.imageMessage?.caption ||
		content.videoMessage?.caption ||
		content.documentMessage?.caption ||
		''
	)
}

/**
 * Chat Analytics Manager
 */
export class ChatAnalytics {
	private messages: Map<string, WAMessage[]> = new Map()

	/**
	 * Add messages for analysis
	 */
	addMessages(messages: WAMessage[]): void {
		for (const msg of messages) {
			const jid = msg.key.remoteJid
			if (!jid) continue

			const existing = this.messages.get(jid) || []
			existing.push(msg)
			this.messages.set(jid, existing)
		}
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages.clear()
	}

	/**
	 * Get stats for a specific chat
	 */
	getChatStats(jid: string, timeRange?: TimeRange): ChatStats | null {
		const messages = this.messages.get(jid)
		if (!messages || messages.length === 0) return null

		// Filter by time range
		let filtered = messages
		if (timeRange) {
			filtered = messages.filter(m => {
				const ts = m.messageTimestamp
				if (!ts) return true
				const time = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
				return time >= timeRange.start.getTime() && time <= timeRange.end.getTime()
			})
		}

		const stats: ChatStats = {
			jid,
			totalMessages: filtered.length,
			messagesFromMe: 0,
			messagesFromOthers: 0,
			messagesByType: {
				text: 0,
				image: 0,
				video: 0,
				audio: 0,
				document: 0,
				sticker: 0,
				location: 0,
				contact: 0,
				poll: 0,
				other: 0
			},
			participants: new Map(),
			averageMessagesPerDay: 0,
			mostActiveHour: 0,
			mostActiveDay: 'Monday',
			mediaCount: 0,
			linkCount: 0,
			emojiCount: 0,
			averageMessageLength: 0
		}

		const hourCounts: number[] = new Array(24).fill(0)
		const dayCounts: Record<string, number> = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		}

		let totalTextLength = 0
		let textMessageCount = 0
		let firstTime: number | null = null
		let lastTime: number | null = null

		for (const msg of filtered) {
			// From me / from others
			if (msg.key.fromMe) {
				stats.messagesFromMe++
			} else {
				stats.messagesFromOthers++
			}

			// Message type
			const type = getMessageTypeKey(msg)
			stats.messagesByType[type]++

			// Media count
			if (['image', 'video', 'audio', 'document', 'sticker'].includes(type)) {
				stats.mediaCount++
			}

			// Participant tracking
			const participant = msg.key.participant || msg.key.remoteJid || 'unknown'
			stats.participants!.set(participant, (stats.participants!.get(participant) || 0) + 1)

			// Time analysis
			const ts = msg.messageTimestamp
			if (ts) {
				const time = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
				const date = new Date(time)

				if (firstTime === null || time < firstTime) firstTime = time
				if (lastTime === null || time > lastTime) lastTime = time

				const hour = date.getHours()
				const dayName = getDayName(date)
				if (hourCounts[hour] !== undefined) hourCounts[hour]++
				if (dayCounts[dayName] !== undefined) dayCounts[dayName]++
			}

			// Text analysis
			const text = extractText(msg)
			if (text) {
				totalTextLength += text.length
				textMessageCount++
				stats.linkCount += countLinks(text)
				stats.emojiCount += countEmojis(text)
			}
		}

		// Calculate averages and most active
		if (firstTime !== null && lastTime !== null) {
			stats.firstMessageTime = new Date(firstTime)
			stats.lastMessageTime = new Date(lastTime)

			const days = Math.max(1, (lastTime - firstTime) / (1000 * 60 * 60 * 24))
			stats.averageMessagesPerDay = Math.round(stats.totalMessages / days)
		}

		if (textMessageCount > 0) {
			stats.averageMessageLength = Math.round(totalTextLength / textMessageCount)
		}

		// Most active hour
		let maxHour = 0
		for (let i = 0; i < 24; i++) {
			if ((hourCounts[i] ?? 0) > (hourCounts[maxHour] ?? 0)) {
				maxHour = i
			}
		}
		stats.mostActiveHour = maxHour

		// Most active day
		let maxDay = 'Monday'
		let maxDayCount = 0
		for (const [day, count] of Object.entries(dayCounts)) {
			if (count > maxDayCount) {
				maxDay = day
				maxDayCount = count
			}
		}
		stats.mostActiveDay = maxDay

		return stats
	}

	/**
	 * Get global stats across all chats
	 */
	getGlobalStats(): GlobalStats {
		const stats: GlobalStats = {
			totalChats: this.messages.size,
			totalMessages: 0,
			totalContacts: 0,
			totalGroups: 0,
			messagesByType: {
				text: 0,
				image: 0,
				video: 0,
				audio: 0,
				document: 0,
				sticker: 0,
				location: 0,
				contact: 0,
				poll: 0,
				other: 0
			},
			mostActiveChat: null,
			averageMessagesPerChat: 0
		}

		let maxChatCount = 0

		for (const [jid, messages] of this.messages) {
			stats.totalMessages += messages.length

			// Count chat type
			if (jid.endsWith('@g.us')) {
				stats.totalGroups++
			} else if (jid.endsWith('@s.whatsapp.net')) {
				stats.totalContacts++
			}

			// Most active chat
			if (messages.length > maxChatCount) {
				maxChatCount = messages.length
				stats.mostActiveChat = { jid, count: messages.length }
			}

			// Message types
			for (const msg of messages) {
				const type = getMessageTypeKey(msg)
				stats.messagesByType[type]++
			}
		}

		if (stats.totalChats > 0) {
			stats.averageMessagesPerChat = Math.round(stats.totalMessages / stats.totalChats)
		}

		return stats
	}

	/**
	 * Get activity by hour (0-23)
	 */
	getActivityByHour(jid?: string): number[] {
		const hourCounts = new Array(24).fill(0)
		const targetMessages = jid ? this.messages.get(jid) || [] : Array.from(this.messages.values()).flat()

		for (const msg of targetMessages) {
			const ts = msg.messageTimestamp
			if (ts) {
				const time = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
				const hour = new Date(time).getHours()
				hourCounts[hour]++
			}
		}

		return hourCounts
	}

	/**
	 * Get activity by day of week
	 */
	getActivityByDay(jid?: string): Record<string, number> {
		const dayCounts: Record<string, number> = {
			Sunday: 0,
			Monday: 0,
			Tuesday: 0,
			Wednesday: 0,
			Thursday: 0,
			Friday: 0,
			Saturday: 0
		}

		const targetMessages = jid ? this.messages.get(jid) || [] : Array.from(this.messages.values()).flat()

		for (const msg of targetMessages) {
			const ts = msg.messageTimestamp
			if (ts) {
				const time = typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000
				const day = getDayName(new Date(time))
				if (dayCounts[day] !== undefined) dayCounts[day]++
			}
		}

		return dayCounts
	}

	/**
	 * Get top participants in a chat
	 */
	getTopParticipants(jid: string, limit = 10): Array<{ participant: string; count: number }> {
		const stats = this.getChatStats(jid)
		if (!stats || !stats.participants) return []

		return Array.from(stats.participants.entries())
			.map(([participant, count]) => ({ participant, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, limit)
	}
}

/**
 * Create chat analytics instance
 */
export const createChatAnalytics = (): ChatAnalytics => {
	return new ChatAnalytics()
}
