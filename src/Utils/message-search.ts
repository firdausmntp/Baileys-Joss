/**
 * Baileys-Joss: Message Search Utilities
 * 
 * Fitur untuk mencari pesan dalam chat
 */

import type { WAMessage, WAMessageContent } from '../Types'

export interface SearchOptions {
	/** Case sensitive search */
	caseSensitive?: boolean
	/** Search in specific chat only */
	jid?: string
	/** Search from specific date */
	fromDate?: Date
	/** Search until specific date */
	toDate?: Date
	/** Maximum results */
	limit?: number
	/** Message types to search */
	messageTypes?: ('text' | 'image' | 'video' | 'document' | 'audio' | 'sticker' | 'location' | 'contact')[]
	/** Search in captions */
	includeCaption?: boolean
	/** Search sender */
	fromSender?: string
	/** Only from me */
	fromMe?: boolean
}

export interface SearchResult {
	message: WAMessage
	matchedText: string
	matchPosition: number
	relevanceScore: number
}

/**
 * Extract searchable text from message
 */
export const extractMessageText = (message: WAMessage): string => {
	const content = message.message
	if (!content) return ''

	// Text message
	if (content.conversation) return content.conversation
	if (content.extendedTextMessage?.text) return content.extendedTextMessage.text

	// Media captions
	if (content.imageMessage?.caption) return content.imageMessage.caption
	if (content.videoMessage?.caption) return content.videoMessage.caption
	if (content.documentMessage?.caption) return content.documentMessage.caption

	// Document filename
	if (content.documentMessage?.fileName) return content.documentMessage.fileName

	// Location
	if (content.locationMessage?.name) return content.locationMessage.name
	if (content.locationMessage?.address) return content.locationMessage.address

	// Contact
	if (content.contactMessage?.displayName) return content.contactMessage.displayName

	// Poll
	if (content.pollCreationMessage?.name) return content.pollCreationMessage.name

	return ''
}

/**
 * Get message type for search
 */
const getMessageType = (
	message: WAMessage
): 'text' | 'image' | 'video' | 'document' | 'audio' | 'sticker' | 'location' | 'contact' | 'other' => {
	const content = message.message
	if (!content) return 'other'

	if (content.conversation || content.extendedTextMessage) return 'text'
	if (content.imageMessage) return 'image'
	if (content.videoMessage) return 'video'
	if (content.documentMessage) return 'document'
	if (content.audioMessage) return 'audio'
	if (content.stickerMessage) return 'sticker'
	if (content.locationMessage || content.liveLocationMessage) return 'location'
	if (content.contactMessage || content.contactsArrayMessage) return 'contact'

	return 'other'
}

/**
 * Calculate relevance score for search result
 */
const calculateRelevance = (query: string, text: string, position: number): number => {
	let score = 100

	// Exact match bonus
	if (text.toLowerCase() === query.toLowerCase()) {
		score += 50
	}

	// Position penalty (earlier matches are better)
	score -= Math.min(position / 10, 20)

	// Word boundary bonus
	const lowerText = text.toLowerCase()
	const lowerQuery = query.toLowerCase()
	if (
		position === 0 ||
		lowerText[position - 1] === ' ' ||
		lowerText[position + lowerQuery.length] === ' ' ||
		position + lowerQuery.length === text.length
	) {
		score += 20
	}

	return Math.max(score, 0)
}

/**
 * Search messages
 */
export const searchMessages = (
	messages: WAMessage[],
	query: string,
	options: SearchOptions = {}
): SearchResult[] => {
	const results: SearchResult[] = []
	const searchQuery = options.caseSensitive ? query : query.toLowerCase()

	for (const message of messages) {
		// Filter by JID
		if (options.jid && message.key.remoteJid !== options.jid) continue

		// Filter by date range
		const ts = message.messageTimestamp
		const messageTime = ts
			? new Date(typeof ts === 'number' ? ts * 1000 : Number(ts) * 1000)
			: null

		if (options.fromDate && messageTime && messageTime < options.fromDate) continue
		if (options.toDate && messageTime && messageTime > options.toDate) continue

		// Filter by sender
		if (options.fromSender && message.key.participant !== options.fromSender) continue
		if (options.fromMe !== undefined && message.key.fromMe !== options.fromMe) continue

		// Filter by message type
		if (options.messageTypes && options.messageTypes.length > 0) {
			const type = getMessageType(message)
			if (!options.messageTypes.includes(type as any)) continue
		}

		// Extract text
		const text = extractMessageText(message)
		if (!text) continue

		const searchText = options.caseSensitive ? text : text.toLowerCase()
		const position = searchText.indexOf(searchQuery)

		if (position !== -1) {
			results.push({
				message,
				matchedText: text.substring(
					Math.max(0, position - 20),
					Math.min(text.length, position + query.length + 20)
				),
				matchPosition: position,
				relevanceScore: calculateRelevance(query, text, position)
			})
		}

		// Check limit
		if (options.limit && results.length >= options.limit) break
	}

	// Sort by relevance
	results.sort((a, b) => b.relevanceScore - a.relevanceScore)

	return results
}

/**
 * Search with regex
 */
export const searchMessagesRegex = (
	messages: WAMessage[],
	pattern: RegExp,
	options: Omit<SearchOptions, 'caseSensitive'> = {}
): SearchResult[] => {
	const results: SearchResult[] = []

	for (const message of messages) {
		// Apply filters (same as searchMessages)
		if (options.jid && message.key.remoteJid !== options.jid) continue
		if (options.fromSender && message.key.participant !== options.fromSender) continue
		if (options.fromMe !== undefined && message.key.fromMe !== options.fromMe) continue

		if (options.messageTypes && options.messageTypes.length > 0) {
			const type = getMessageType(message)
			if (!options.messageTypes.includes(type as any)) continue
		}

		const text = extractMessageText(message)
		if (!text) continue

		const match = text.match(pattern)
		if (match) {
			results.push({
				message,
				matchedText: match[0],
				matchPosition: match.index || 0,
				relevanceScore: 100
			})
		}

		if (options.limit && results.length >= options.limit) break
	}

	return results
}

/**
 * Message Search Manager
 */
export class MessageSearchManager {
	private messages: WAMessage[] = []
	private messageIndex: Map<string, WAMessage> = new Map()

	/**
	 * Add messages to the search index
	 */
	addMessages(messages: WAMessage[]): void {
		for (const msg of messages) {
			const id = msg.key.id
			if (id && !this.messageIndex.has(id)) {
				this.messages.push(msg)
				this.messageIndex.set(id, msg)
			}
		}
	}

	/**
	 * Remove messages from index
	 */
	removeMessages(messageIds: string[]): void {
		const idSet = new Set(messageIds)
		this.messages = this.messages.filter(m => !idSet.has(m.key.id || ''))
		for (const id of messageIds) {
			this.messageIndex.delete(id)
		}
	}

	/**
	 * Clear all messages
	 */
	clear(): void {
		this.messages = []
		this.messageIndex.clear()
	}

	/**
	 * Get message count
	 */
	get count(): number {
		return this.messages.length
	}

	/**
	 * Search messages
	 */
	search(query: string, options?: SearchOptions): SearchResult[] {
		return searchMessages(this.messages, query, options)
	}

	/**
	 * Search with regex
	 */
	searchRegex(pattern: RegExp, options?: Omit<SearchOptions, 'caseSensitive'>): SearchResult[] {
		return searchMessagesRegex(this.messages, pattern, options)
	}

	/**
	 * Get messages by JID
	 */
	getByJid(jid: string): WAMessage[] {
		return this.messages.filter(m => m.key.remoteJid === jid)
	}

	/**
	 * Get messages by sender
	 */
	getBySender(sender: string): WAMessage[] {
		return this.messages.filter(m => m.key.participant === sender || m.key.remoteJid === sender)
	}

	/**
	 * Get messages by type
	 */
	getByType(type: 'text' | 'image' | 'video' | 'document' | 'audio' | 'sticker' | 'location' | 'contact'): WAMessage[] {
		return this.messages.filter(m => getMessageType(m) === type)
	}

	/**
	 * Get message by ID
	 */
	getById(id: string): WAMessage | undefined {
		return this.messageIndex.get(id)
	}
}

/**
 * Create a message search manager
 */
export const createMessageSearch = (): MessageSearchManager => {
	return new MessageSearchManager()
}
