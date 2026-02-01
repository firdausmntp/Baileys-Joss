/**
 * Baileys-Joss: Anti-Spam System
 * 
 * Sistem untuk mendeteksi dan mencegah spam:
 * - Rate limiting
 * - Duplicate message detection
 * - Flood protection
 * - Pattern-based spam detection
 */

import type { WAMessage } from '../Types'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface SpamRule {
	id: string
	name: string
	type: 'rate_limit' | 'duplicate' | 'pattern' | 'flood' | 'custom'
	enabled: boolean
	config: Record<string, unknown>
	action: 'warn' | 'mute' | 'kick' | 'ban' | 'delete' | 'ignore'
	duration?: number // Duration in seconds for mute/ban
}

export interface SpamDetectionResult {
	isSpam: boolean
	rules: string[]
	score: number
	action: SpamRule['action']
	reason: string
}

export interface UserActivity {
	jid: string
	messageCount: number
	lastMessageTime: number
	recentMessages: string[]
	warnings: number
	muted: boolean
	mutedUntil?: number
	banned: boolean
}

export interface AntiSpamOptions {
	/** Maximum messages per minute per user */
	maxMessagesPerMinute?: number
	/** Maximum duplicate messages allowed */
	maxDuplicates?: number
	/** Time window for duplicate detection (ms) */
	duplicateWindow?: number
	/** Maximum characters per message */
	maxMessageLength?: number
	/** Minimum delay between messages (ms) */
	minMessageDelay?: number
	/** Patterns to detect as spam */
	spamPatterns?: RegExp[]
	/** Whitelist JIDs (never spam) */
	whitelist?: string[]
	/** Callback when spam detected */
	onSpamDetected?: (jid: string, message: WAMessage, result: SpamDetectionResult) => void
}

// =====================================================
// ANTI-SPAM MANAGER
// =====================================================

export class AntiSpamManager {
	private rules: Map<string, SpamRule> = new Map()
	private userActivity: Map<string, UserActivity> = new Map()
	private options: Required<AntiSpamOptions>
	private messageHashes: Map<string, number[]> = new Map() // jid -> timestamps

	constructor(options: AntiSpamOptions = {}) {
		this.options = {
			maxMessagesPerMinute: options.maxMessagesPerMinute ?? 20,
			maxDuplicates: options.maxDuplicates ?? 3,
			duplicateWindow: options.duplicateWindow ?? 60000, // 1 minute
			maxMessageLength: options.maxMessageLength ?? 5000,
			minMessageDelay: options.minMessageDelay ?? 500,
			spamPatterns: options.spamPatterns ?? [],
			whitelist: options.whitelist ?? [],
			onSpamDetected: options.onSpamDetected ?? (() => {})
		}

		// Initialize default rules
		this.initDefaultRules()
	}

	/**
	 * Initialize default spam rules
	 */
	private initDefaultRules(): void {
		this.addRule({
			id: 'rate_limit',
			name: 'Rate Limit',
			type: 'rate_limit',
			enabled: true,
			config: { maxPerMinute: this.options.maxMessagesPerMinute },
			action: 'warn'
		})

		this.addRule({
			id: 'duplicate',
			name: 'Duplicate Detection',
			type: 'duplicate',
			enabled: true,
			config: { maxDuplicates: this.options.maxDuplicates },
			action: 'warn'
		})

		this.addRule({
			id: 'flood',
			name: 'Flood Protection',
			type: 'flood',
			enabled: true,
			config: { minDelay: this.options.minMessageDelay },
			action: 'ignore'
		})
	}

	/**
	 * Add a spam rule
	 */
	addRule(rule: SpamRule): void {
		this.rules.set(rule.id, rule)
	}

	/**
	 * Remove a spam rule
	 */
	removeRule(ruleId: string): boolean {
		return this.rules.delete(ruleId)
	}

	/**
	 * Enable/disable a rule
	 */
	toggleRule(ruleId: string, enabled: boolean): void {
		const rule = this.rules.get(ruleId)
		if (rule) {
			rule.enabled = enabled
		}
	}

	/**
	 * Check if a message is spam
	 */
	check(message: WAMessage): SpamDetectionResult {
		const jid = message.key.participant || message.key.remoteJid || ''
		
		// Check whitelist
		if (this.options.whitelist.includes(jid)) {
			return { isSpam: false, rules: [], score: 0, action: 'ignore', reason: '' }
		}

		const triggeredRules: string[] = []
		let totalScore = 0
		let action: SpamRule['action'] = 'ignore'
		const reasons: string[] = []

		const text = this.extractText(message)
		const now = Date.now()

		// Get or create user activity
		let activity = this.userActivity.get(jid)
		if (!activity) {
			activity = {
				jid,
				messageCount: 0,
				lastMessageTime: 0,
				recentMessages: [],
				warnings: 0,
				muted: false,
				banned: false
			}
			this.userActivity.set(jid, activity)
		}

		// Check if user is muted or banned
		if (activity.banned) {
			return {
				isSpam: true,
				rules: ['banned'],
				score: 100,
				action: 'delete',
				reason: 'User is banned'
			}
		}

		if (activity.muted && activity.mutedUntil && activity.mutedUntil > now) {
			return {
				isSpam: true,
				rules: ['muted'],
				score: 100,
				action: 'delete',
				reason: 'User is muted'
			}
		}

		// Check each rule
		for (const [, rule] of this.rules) {
			if (!rule.enabled) continue

			const ruleResult = this.checkRule(rule, message, text, activity, now)
			if (ruleResult.triggered) {
				triggeredRules.push(rule.id)
				totalScore += ruleResult.score
				reasons.push(ruleResult.reason)
				
				// Use the most severe action
				if (this.getActionSeverity(rule.action) > this.getActionSeverity(action)) {
					action = rule.action
				}
			}
		}

		// Check spam patterns
		for (const pattern of this.options.spamPatterns) {
			if (pattern.test(text)) {
				triggeredRules.push('pattern')
				totalScore += 30
				reasons.push('Matches spam pattern')
			}
		}

		// Update user activity
		activity.messageCount++
		activity.lastMessageTime = now
		activity.recentMessages.push(this.hashMessage(text))
		if (activity.recentMessages.length > 20) {
			activity.recentMessages.shift()
		}

		const isSpam = totalScore >= 50

		if (isSpam) {
			activity.warnings++
			this.options.onSpamDetected(jid, message, {
				isSpam,
				rules: triggeredRules,
				score: totalScore,
				action,
				reason: reasons.join('; ')
			})
		}

		return {
			isSpam,
			rules: triggeredRules,
			score: totalScore,
			action,
			reason: reasons.join('; ')
		}
	}

	/**
	 * Check individual rule
	 */
	private checkRule(
		rule: SpamRule,
		message: WAMessage,
		text: string,
		activity: UserActivity,
		now: number
	): { triggered: boolean; score: number; reason: string } {
		switch (rule.type) {
			case 'rate_limit': {
				const maxPerMinute = (rule.config.maxPerMinute as number) || this.options.maxMessagesPerMinute
				const timestamps = this.messageHashes.get(activity.jid) || []
				const recentCount = timestamps.filter(t => now - t < 60000).length

				// Add current timestamp
				timestamps.push(now)
				this.messageHashes.set(activity.jid, timestamps.filter(t => now - t < 60000))

				if (recentCount >= maxPerMinute) {
					return { triggered: true, score: 40, reason: `Rate limit exceeded (${recentCount}/${maxPerMinute} per minute)` }
				}
				break
			}

			case 'duplicate': {
				const maxDuplicates = (rule.config.maxDuplicates as number) || this.options.maxDuplicates
				const hash = this.hashMessage(text)
				const duplicateCount = activity.recentMessages.filter(h => h === hash).length

				if (duplicateCount >= maxDuplicates) {
					return { triggered: true, score: 35, reason: `Duplicate message (${duplicateCount} times)` }
				}
				break
			}

			case 'flood': {
				const minDelay = (rule.config.minDelay as number) || this.options.minMessageDelay
				const timeSinceLastMessage = now - activity.lastMessageTime

				if (activity.lastMessageTime > 0 && timeSinceLastMessage < minDelay) {
					return { triggered: true, score: 25, reason: `Message flood (${timeSinceLastMessage}ms delay)` }
				}
				break
			}

			case 'pattern': {
				const patterns = (rule.config.patterns as RegExp[]) || []
				for (const pattern of patterns) {
					if (pattern.test(text)) {
						return { triggered: true, score: 50, reason: 'Matches spam pattern' }
					}
				}
				break
			}

			default:
				break
		}

		return { triggered: false, score: 0, reason: '' }
	}

	/**
	 * Get action severity (higher = more severe)
	 */
	private getActionSeverity(action: SpamRule['action']): number {
		const severities: Record<SpamRule['action'], number> = {
			ignore: 0,
			warn: 1,
			delete: 2,
			mute: 3,
			kick: 4,
			ban: 5
		}
		return severities[action] || 0
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
	 * Create a simple hash of message
	 */
	private hashMessage(text: string): string {
		const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
		return normalized.substring(0, 100)
	}

	/**
	 * Mute a user
	 */
	muteUser(jid: string, durationMs: number): void {
		const activity = this.userActivity.get(jid) || {
			jid,
			messageCount: 0,
			lastMessageTime: 0,
			recentMessages: [],
			warnings: 0,
			muted: false,
			banned: false
		}

		activity.muted = true
		activity.mutedUntil = Date.now() + durationMs
		this.userActivity.set(jid, activity)
	}

	/**
	 * Unmute a user
	 */
	unmuteUser(jid: string): void {
		const activity = this.userActivity.get(jid)
		if (activity) {
			activity.muted = false
			activity.mutedUntil = undefined
		}
	}

	/**
	 * Ban a user
	 */
	banUser(jid: string): void {
		const activity = this.userActivity.get(jid) || {
			jid,
			messageCount: 0,
			lastMessageTime: 0,
			recentMessages: [],
			warnings: 0,
			muted: false,
			banned: false
		}

		activity.banned = true
		this.userActivity.set(jid, activity)
	}

	/**
	 * Unban a user
	 */
	unbanUser(jid: string): void {
		const activity = this.userActivity.get(jid)
		if (activity) {
			activity.banned = false
		}
	}

	/**
	 * Add to whitelist
	 */
	addToWhitelist(jid: string): void {
		if (!this.options.whitelist.includes(jid)) {
			this.options.whitelist.push(jid)
		}
	}

	/**
	 * Remove from whitelist
	 */
	removeFromWhitelist(jid: string): void {
		const index = this.options.whitelist.indexOf(jid)
		if (index !== -1) {
			this.options.whitelist.splice(index, 1)
		}
	}

	/**
	 * Get user activity
	 */
	getUserActivity(jid: string): UserActivity | undefined {
		return this.userActivity.get(jid)
	}

	/**
	 * Reset user activity
	 */
	resetUserActivity(jid: string): void {
		this.userActivity.delete(jid)
		this.messageHashes.delete(jid)
	}

	/**
	 * Get spam statistics
	 */
	getStats(): {
		totalUsers: number
		mutedUsers: number
		bannedUsers: number
		totalWarnings: number
	} {
		let mutedUsers = 0
		let bannedUsers = 0
		let totalWarnings = 0

		for (const [, activity] of this.userActivity) {
			if (activity.muted) mutedUsers++
			if (activity.banned) bannedUsers++
			totalWarnings += activity.warnings
		}

		return {
			totalUsers: this.userActivity.size,
			mutedUsers,
			bannedUsers,
			totalWarnings
		}
	}

	/**
	 * Clear all data
	 */
	clear(): void {
		this.userActivity.clear()
		this.messageHashes.clear()
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createAntiSpam = (options?: AntiSpamOptions): AntiSpamManager => {
	return new AntiSpamManager(options)
}

// =====================================================
// COMMON SPAM PATTERNS
// =====================================================

export const COMMON_SPAM_PATTERNS: RegExp[] = [
	// Repeated characters
	/(.)\1{10,}/i,
	// All caps (more than 20 chars)
	/[A-Z\s]{20,}/,
	// Too many emojis
	/(?:[\u{1F600}-\u{1F64F}][\s]*){10,}/u,
	// Promotional keywords
	/(?:free|gratis|promo|discount|sale|bonus|win|winner|jackpot|lottery|claim)/gi,
	// Suspicious links patterns
	/(?:bit\.ly|tinyurl|goo\.gl|t\.co|rb\.gy)/gi,
	// Money/crypto scam patterns
	/(?:bitcoin|crypto|invest|trading|profit|earn money|make money|income)/gi
]
