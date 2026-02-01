/**
 * Baileys-Joss: Content Detector
 * 
 * Deteksi otomatis berbagai jenis konten dalam pesan:
 * - Links/URLs
 * - Phone numbers
 * - Emails
 * - Media (images, videos, audio, documents)
 * - Mentions
 * - Hashtags
 * - Sensitive content keywords
 */

import type { WAMessage } from '../Types'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LinkInfo {
	url: string
	domain: string
	isHttps: boolean
	type: 'website' | 'image' | 'video' | 'social' | 'file' | 'other'
}

export interface PhoneInfo {
	raw: string
	formatted: string
	countryCode?: string
}

export interface MentionInfo {
	jid: string
	position: { start: number; end: number }
}

export interface DetectionResult {
	hasMedia: boolean
	mediaType: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contact' | null
	hasLinks: boolean
	links: LinkInfo[]
	hasPhoneNumbers: boolean
	phoneNumbers: PhoneInfo[]
	hasEmails: boolean
	emails: string[]
	hasMentions: boolean
	mentions: MentionInfo[]
	hasHashtags: boolean
	hashtags: string[]
	hasEmojis: boolean
	emojis: string[]
	hasSensitiveContent: boolean
	sensitiveKeywords: string[]
	messageType: string
	textLength: number
	wordCount: number
}

export interface ContentFilterOptions {
	/** Block links */
	blockLinks?: boolean
	/** Block specific domains */
	blockedDomains?: string[]
	/** Block phone numbers */
	blockPhoneNumbers?: boolean
	/** Block emails */
	blockEmails?: boolean
	/** Sensitive keywords to detect */
	sensitiveKeywords?: string[]
	/** Maximum message length */
	maxMessageLength?: number
	/** Custom regex patterns to detect */
	customPatterns?: RegExp[]
}

export interface FilterResult {
	allowed: boolean
	blockedReason?: string
	detectedViolations: string[]
}

// =====================================================
// REGEX PATTERNS
// =====================================================

const PATTERNS = {
	// URLs
	URL: /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi,
	
	// Domain extraction
	DOMAIN: /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+)/i,
	
	// Phone numbers (international format)
	PHONE: /(?:\+62|62|0)(?:\d{2,3}[-\s.]?)?\d{3,4}[-\s.]?\d{3,4}(?:[-\s.]?\d{1,4})?|(?:\+\d{1,3}[-\s.]?)?\(?\d{1,4}\)?[-\s.]?\d{1,4}[-\s.]?\d{1,9}/g,
	
	// Email addresses
	EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
	
	// Hashtags
	HASHTAG: /#[a-zA-Z0-9_\u0600-\u06FF]+/g,
	
	// Emojis
	EMOJI: /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu,

	// Social media domains
	SOCIAL_DOMAINS: /(?:facebook|fb|instagram|twitter|tiktok|youtube|linkedin|whatsapp|telegram|discord)\.(?:com|me|tv|gg)/i,
	
	// Image extensions
	IMAGE_URL: /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i,
	
	// Video extensions
	VIDEO_URL: /\.(mp4|avi|mov|wmv|flv|webm|mkv)(\?.*)?$/i,
	
	// File extensions
	FILE_URL: /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|7z|tar|gz)(\?.*)?$/i
}

// =====================================================
// CONTENT DETECTOR CLASS
// =====================================================

export class ContentDetector {
	private sensitiveKeywords: string[] = []
	private customPatterns: RegExp[] = []

	constructor(options: { sensitiveKeywords?: string[]; customPatterns?: RegExp[] } = {}) {
		this.sensitiveKeywords = options.sensitiveKeywords || []
		this.customPatterns = options.customPatterns || []
	}

	/**
	 * Analyze a WhatsApp message
	 */
	analyze(message: WAMessage): DetectionResult {
		const text = this.extractText(message)
		const mediaType = this.getMediaType(message)

		const links = this.detectLinks(text)
		const phoneNumbers = this.detectPhoneNumbers(text)
		const emails = this.detectEmails(text)
		const mentions = this.detectMentions(message)
		const hashtags = this.detectHashtags(text)
		const emojis = this.detectEmojis(text)
		const sensitiveKeywords = this.detectSensitiveContent(text)

		return {
			hasMedia: mediaType !== null,
			mediaType,
			hasLinks: links.length > 0,
			links,
			hasPhoneNumbers: phoneNumbers.length > 0,
			phoneNumbers,
			hasEmails: emails.length > 0,
			emails,
			hasMentions: mentions.length > 0,
			mentions,
			hasHashtags: hashtags.length > 0,
			hashtags,
			hasEmojis: emojis.length > 0,
			emojis,
			hasSensitiveContent: sensitiveKeywords.length > 0,
			sensitiveKeywords,
			messageType: this.getMessageType(message),
			textLength: text.length,
			wordCount: text.split(/\s+/).filter(w => w.length > 0).length
		}
	}

	/**
	 * Extract text from message
	 */
	private extractText(message: WAMessage): string {
		const content = message.message
		if (!content) return ''

		if (content.conversation) return content.conversation
		if (content.extendedTextMessage?.text) return content.extendedTextMessage.text
		if (content.imageMessage?.caption) return content.imageMessage.caption
		if (content.videoMessage?.caption) return content.videoMessage.caption
		if (content.documentMessage?.caption) return content.documentMessage.caption

		return ''
	}

	/**
	 * Get media type from message
	 */
	private getMediaType(message: WAMessage): DetectionResult['mediaType'] {
		const content = message.message
		if (!content) return null

		if (content.imageMessage) return 'image'
		if (content.videoMessage) return 'video'
		if (content.audioMessage) return 'audio'
		if (content.documentMessage) return 'document'
		if (content.stickerMessage) return 'sticker'
		if (content.locationMessage || content.liveLocationMessage) return 'location'
		if (content.contactMessage || content.contactsArrayMessage) return 'contact'

		return null
	}

	/**
	 * Get message type string
	 */
	private getMessageType(message: WAMessage): string {
		const content = message.message
		if (!content) return 'unknown'

		if (content.conversation || content.extendedTextMessage) return 'text'
		if (content.imageMessage) return 'image'
		if (content.videoMessage) return 'video'
		if (content.audioMessage) return 'audio'
		if (content.documentMessage) return 'document'
		if (content.stickerMessage) return 'sticker'
		if (content.locationMessage) return 'location'
		if (content.liveLocationMessage) return 'live_location'
		if (content.contactMessage) return 'contact'
		if (content.contactsArrayMessage) return 'contacts'
		if (content.pollCreationMessage) return 'poll'
		if (content.reactionMessage) return 'reaction'

		return 'other'
	}

	/**
	 * Detect links in text
	 */
	detectLinks(text: string): LinkInfo[] {
		const matches = text.match(PATTERNS.URL) || []
		return matches.map(url => {
			const domainMatch = url.match(PATTERNS.DOMAIN)
			const domain = domainMatch ? domainMatch[1] || '' : ''

			let type: LinkInfo['type'] = 'other'
			if (PATTERNS.SOCIAL_DOMAINS.test(url)) type = 'social'
			else if (PATTERNS.IMAGE_URL.test(url)) type = 'image'
			else if (PATTERNS.VIDEO_URL.test(url)) type = 'video'
			else if (PATTERNS.FILE_URL.test(url)) type = 'file'
			else type = 'website'

			return {
				url,
				domain,
				isHttps: url.startsWith('https'),
				type
			}
		})
	}

	/**
	 * Detect phone numbers
	 */
	detectPhoneNumbers(text: string): PhoneInfo[] {
		const matches = text.match(PATTERNS.PHONE) || []
		return matches.map(raw => {
			const digits = raw.replace(/\D/g, '')
			let countryCode: string | undefined
			let formatted = raw

			if (digits.startsWith('62')) {
				countryCode = '+62'
				formatted = '+62 ' + digits.slice(2)
			} else if (digits.startsWith('0')) {
				countryCode = '+62'
				formatted = '+62 ' + digits.slice(1)
			}

			return { raw, formatted, countryCode }
		})
	}

	/**
	 * Detect email addresses
	 */
	detectEmails(text: string): string[] {
		return text.match(PATTERNS.EMAIL) || []
	}

	/**
	 * Detect mentions from message
	 */
	detectMentions(message: WAMessage): MentionInfo[] {
		const mentions: MentionInfo[] = []
		const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
		
		for (const jid of mentionedJids) {
			mentions.push({
				jid,
				position: { start: 0, end: 0 } // Position detection would require more parsing
			})
		}

		return mentions
	}

	/**
	 * Detect hashtags
	 */
	detectHashtags(text: string): string[] {
		return (text.match(PATTERNS.HASHTAG) || []).map(h => h.substring(1))
	}

	/**
	 * Detect emojis
	 */
	detectEmojis(text: string): string[] {
		return text.match(PATTERNS.EMOJI) || []
	}

	/**
	 * Detect sensitive content
	 */
	detectSensitiveContent(text: string): string[] {
		const lowerText = text.toLowerCase()
		return this.sensitiveKeywords.filter(keyword => 
			lowerText.includes(keyword.toLowerCase())
		)
	}

	/**
	 * Check custom patterns
	 */
	checkCustomPatterns(text: string): boolean[] {
		return this.customPatterns.map(pattern => pattern.test(text))
	}

	/**
	 * Add sensitive keywords
	 */
	addSensitiveKeywords(keywords: string[]): void {
		this.sensitiveKeywords.push(...keywords)
	}

	/**
	 * Set sensitive keywords
	 */
	setSensitiveKeywords(keywords: string[]): void {
		this.sensitiveKeywords = keywords
	}

	/**
	 * Add custom pattern
	 */
	addCustomPattern(pattern: RegExp): void {
		this.customPatterns.push(pattern)
	}
}

// =====================================================
// CONTENT FILTER CLASS
// =====================================================

export class ContentFilter {
	private options: Required<ContentFilterOptions>

	constructor(options: ContentFilterOptions = {}) {
		this.options = {
			blockLinks: options.blockLinks ?? false,
			blockedDomains: options.blockedDomains ?? [],
			blockPhoneNumbers: options.blockPhoneNumbers ?? false,
			blockEmails: options.blockEmails ?? false,
			sensitiveKeywords: options.sensitiveKeywords ?? [],
			maxMessageLength: options.maxMessageLength ?? 0,
			customPatterns: options.customPatterns ?? []
		}
	}

	/**
	 * Filter a message
	 */
	filter(message: WAMessage): FilterResult {
		const detector = new ContentDetector({ sensitiveKeywords: this.options.sensitiveKeywords })
		const analysis = detector.analyze(message)
		const violations: string[] = []

		// Check links
		if (this.options.blockLinks && analysis.hasLinks) {
			violations.push('Links are not allowed')
		}

		// Check blocked domains
		if (this.options.blockedDomains.length > 0 && analysis.hasLinks) {
			const blockedFound = analysis.links.filter(link => 
				this.options.blockedDomains.some(domain => 
					link.domain.toLowerCase().includes(domain.toLowerCase())
				)
			)
			if (blockedFound.length > 0) {
				violations.push(`Blocked domains: ${blockedFound.map(l => l.domain).join(', ')}`)
			}
		}

		// Check phone numbers
		if (this.options.blockPhoneNumbers && analysis.hasPhoneNumbers) {
			violations.push('Phone numbers are not allowed')
		}

		// Check emails
		if (this.options.blockEmails && analysis.hasEmails) {
			violations.push('Email addresses are not allowed')
		}

		// Check sensitive content
		if (analysis.hasSensitiveContent) {
			violations.push(`Sensitive content detected: ${analysis.sensitiveKeywords.join(', ')}`)
		}

		// Check message length
		if (this.options.maxMessageLength > 0 && analysis.textLength > this.options.maxMessageLength) {
			violations.push(`Message too long (${analysis.textLength}/${this.options.maxMessageLength})`)
		}

		// Check custom patterns
		const text = this.extractText(message)
		for (let i = 0; i < this.options.customPatterns.length; i++) {
			if (this.options.customPatterns[i]?.test(text)) {
				violations.push(`Custom pattern #${i + 1} matched`)
			}
		}

		return {
			allowed: violations.length === 0,
			blockedReason: violations.length > 0 ? violations[0] : undefined,
			detectedViolations: violations
		}
	}

	/**
	 * Extract text from message
	 */
	private extractText(message: WAMessage): string {
		const content = message.message
		if (!content) return ''

		if (content.conversation) return content.conversation
		if (content.extendedTextMessage?.text) return content.extendedTextMessage.text
		if (content.imageMessage?.caption) return content.imageMessage.caption
		if (content.videoMessage?.caption) return content.videoMessage.caption

		return ''
	}

	/**
	 * Update filter options
	 */
	updateOptions(options: Partial<ContentFilterOptions>): void {
		this.options = { ...this.options, ...options }
	}
}

// =====================================================
// QUICK DETECTION FUNCTIONS
// =====================================================

/**
 * Quick check if message contains links
 */
export const hasLinks = (text: string): boolean => {
	return PATTERNS.URL.test(text)
}

/**
 * Quick check if message contains phone numbers
 */
export const hasPhoneNumbers = (text: string): boolean => {
	return PATTERNS.PHONE.test(text)
}

/**
 * Quick check if message contains emails
 */
export const hasEmails = (text: string): boolean => {
	return PATTERNS.EMAIL.test(text)
}

/**
 * Extract all links from text
 */
export const extractLinks = (text: string): string[] => {
	return text.match(PATTERNS.URL) || []
}

/**
 * Extract all phone numbers from text
 */
export const extractPhoneNumbers = (text: string): string[] => {
	return text.match(PATTERNS.PHONE) || []
}

/**
 * Extract all emails from text
 */
export const extractEmails = (text: string): string[] => {
	return text.match(PATTERNS.EMAIL) || []
}

/**
 * Check if message has media content
 */
export const hasMediaContent = (message: WAMessage): boolean => {
	const content = message.message
	if (!content) return false

	return !!(
		content.imageMessage ||
		content.videoMessage ||
		content.audioMessage ||
		content.documentMessage ||
		content.stickerMessage
	)
}

/**
 * Check if message is forwarded
 */
export const isForwarded = (message: WAMessage): boolean => {
	const content = message.message
	if (!content) return false

	const contextInfo = 
		content.extendedTextMessage?.contextInfo ||
		content.imageMessage?.contextInfo ||
		content.videoMessage?.contextInfo ||
		content.documentMessage?.contextInfo ||
		content.audioMessage?.contextInfo

	return !!contextInfo?.isForwarded
}

/**
 * Get forward count
 */
export const getForwardCount = (message: WAMessage): number => {
	const content = message.message
	if (!content) return 0

	const contextInfo = 
		content.extendedTextMessage?.contextInfo ||
		content.imageMessage?.contextInfo ||
		content.videoMessage?.contextInfo

	return contextInfo?.forwardingScore || 0
}

// =====================================================
// FACTORY FUNCTIONS
// =====================================================

export const createContentDetector = (options?: {
	sensitiveKeywords?: string[]
	customPatterns?: RegExp[]
}): ContentDetector => {
	return new ContentDetector(options)
}

export const createContentFilter = (options?: ContentFilterOptions): ContentFilter => {
	return new ContentFilter(options)
}
