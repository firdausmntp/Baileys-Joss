/**
 * Baileys-Joss: Auto Reply System
 * 
 * Sistem balasan otomatis berdasarkan keyword/pattern
 */

import type { AnyMessageContent, WAMessage } from '../Types'

export interface AutoReplyRule {
	id: string
	/** Keywords to match (case-insensitive) */
	keywords?: string[]
	/** Regex pattern to match */
	pattern?: RegExp
	/** Exact match (case-insensitive) */
	exactMatch?: string
	/** Response content */
	response: AnyMessageContent | ((message: WAMessage, match: RegExpMatchArray | null) => AnyMessageContent | Promise<AnyMessageContent>)
	/** Only reply in specific chats */
	allowedJids?: string[]
	/** Ignore these JIDs */
	blockedJids?: string[]
	/** Only reply to groups */
	groupsOnly?: boolean
	/** Only reply to private chats */
	privateOnly?: boolean
	/** Cooldown in milliseconds per JID */
	cooldown?: number
	/** Reply with quote */
	quoted?: boolean
	/** Active status */
	active?: boolean
	/** Priority (higher = checked first) */
	priority?: number
}

export interface AutoReplyOptions {
	/** Global cooldown in milliseconds (default: 1000ms) */
	globalCooldown?: number
	/** Enable typing indicator before reply */
	simulateTyping?: boolean
	/** Typing duration in milliseconds (default: 1000ms) */
	typingDuration?: number
	/** Process multiple matches (default: false) */
	multiMatch?: boolean
	/** Callback when auto-reply is triggered */
	onReply?: (rule: AutoReplyRule, message: WAMessage, response: AnyMessageContent) => void
	/** Callback on error */
	onError?: (error: Error, rule: AutoReplyRule, message: WAMessage) => void
}

type AutoReplySendFunction = (
	jid: string, 
	content: AnyMessageContent,
	options?: { quoted?: WAMessage }
) => Promise<WAMessage | undefined>

export type PresenceFunction = (jid: string, presence: 'composing' | 'paused') => Promise<void>

/**
 * Auto Reply Handler - Sistem balasan otomatis
 */
export class AutoReplyHandler {
	private rules: Map<string, AutoReplyRule> = new Map()
	private cooldowns: Map<string, number> = new Map()
	private globalCooldown: Map<string, number> = new Map()
	private sendMessage: AutoReplySendFunction
	private sendPresence?: PresenceFunction
	private options: Required<AutoReplyOptions>

	constructor(
		sendMessage: AutoReplySendFunction,
		sendPresence?: PresenceFunction,
		options: AutoReplyOptions = {}
	) {
		this.sendMessage = sendMessage
		this.sendPresence = sendPresence
		this.options = {
			globalCooldown: options.globalCooldown ?? 1000,
			simulateTyping: options.simulateTyping ?? false,
			typingDuration: options.typingDuration ?? 1000,
			multiMatch: options.multiMatch ?? false,
			onReply: options.onReply ?? (() => {}),
			onError: options.onError ?? (() => {})
		}
	}

	/**
	 * Generate unique ID for rule
	 */
	private generateId(): string {
		return `ar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	/**
	 * Add a new auto-reply rule
	 */
	addRule(rule: Omit<AutoReplyRule, 'id'> & { id?: string }): AutoReplyRule {
		const fullRule: AutoReplyRule = {
			...rule,
			id: rule.id ?? this.generateId(),
			active: rule.active ?? true,
			priority: rule.priority ?? 0
		}

		if (!fullRule.keywords && !fullRule.pattern && !fullRule.exactMatch) {
			throw new Error('Rule must have at least one of: keywords, pattern, or exactMatch')
		}

		this.rules.set(fullRule.id, fullRule)
		return fullRule
	}

	/**
	 * Remove a rule by ID
	 */
	removeRule(id: string): boolean {
		return this.rules.delete(id)
	}

	/**
	 * Get all rules
	 */
	getRules(): AutoReplyRule[] {
		return Array.from(this.rules.values())
	}

	/**
	 * Get a rule by ID
	 */
	getRule(id: string): AutoReplyRule | undefined {
		return this.rules.get(id)
	}

	/**
	 * Enable/disable a rule
	 */
	setRuleActive(id: string, active: boolean): boolean {
		const rule = this.rules.get(id)
		if (rule) {
			rule.active = active
			return true
		}
		return false
	}

	/**
	 * Clear all rules
	 */
	clearRules(): void {
		this.rules.clear()
	}

	/**
	 * Check cooldown for a specific rule and JID
	 */
	private checkCooldown(ruleId: string, jid: string): boolean {
		const key = `${ruleId}:${jid}`
		const lastTime = this.cooldowns.get(key) ?? 0
		return Date.now() - lastTime > 0
	}

	/**
	 * Check global cooldown for JID
	 */
	private checkGlobalCooldown(jid: string): boolean {
		const lastTime = this.globalCooldown.get(jid) ?? 0
		return Date.now() - lastTime > this.options.globalCooldown
	}

	/**
	 * Set cooldown
	 */
	private setCooldown(ruleId: string, jid: string, cooldown: number): void {
		const key = `${ruleId}:${jid}`
		this.cooldowns.set(key, Date.now() + cooldown)
		this.globalCooldown.set(jid, Date.now())
	}

	/**
	 * Check if message matches a rule
	 */
	private matchRule(text: string, rule: AutoReplyRule): RegExpMatchArray | null {
		if (!rule.active) return null

		// Check exact match
		if (rule.exactMatch) {
			if (text.toLowerCase() === rule.exactMatch.toLowerCase()) {
				return [text] as unknown as RegExpMatchArray
			}
		}

		// Check keywords
		if (rule.keywords && rule.keywords.length > 0) {
			const lowerText = text.toLowerCase()
			for (const keyword of rule.keywords) {
				if (lowerText.includes(keyword.toLowerCase())) {
					return [keyword] as unknown as RegExpMatchArray
				}
			}
		}

		// Check pattern
		if (rule.pattern) {
			return text.match(rule.pattern)
		}

		return null
	}

	/**
	 * Check if JID is allowed for this rule
	 */
	private isJidAllowed(jid: string, rule: AutoReplyRule): boolean {
		const isGroup = jid.endsWith('@g.us')
		const isNewsletter = jid.endsWith('@newsletter')

		// Skip newsletters
		if (isNewsletter) return false

		// Check group/private filters
		if (rule.groupsOnly && !isGroup) return false
		if (rule.privateOnly && isGroup) return false

		// Check allowed/blocked lists
		if (rule.allowedJids && rule.allowedJids.length > 0) {
			if (!rule.allowedJids.includes(jid)) return false
		}
		if (rule.blockedJids && rule.blockedJids.includes(jid)) {
			return false
		}

		return true
	}

	/**
	 * Process incoming message and send auto-reply if matched
	 */
	async processMessage(message: WAMessage): Promise<boolean> {
		// Get message text
		const messageContent = message.message
		if (!messageContent) return false

		const text = 
			messageContent.conversation ||
			messageContent.extendedTextMessage?.text ||
			messageContent.imageMessage?.caption ||
			messageContent.videoMessage?.caption ||
			messageContent.documentMessage?.caption ||
			''

		if (!text) return false

		const jid = message.key.remoteJid
		if (!jid) return false

		// Check global cooldown
		if (!this.checkGlobalCooldown(jid)) return false

		// Sort rules by priority (descending)
		const sortedRules = Array.from(this.rules.values())
			.filter(r => r.active)
			.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))

		let matched = false

		for (const rule of sortedRules) {
			// Check JID filters
			if (!this.isJidAllowed(jid, rule)) continue

			// Check cooldown
			if (rule.cooldown && !this.checkCooldown(rule.id, jid)) continue

			// Match rule
			const match = this.matchRule(text, rule)
			if (!match) continue

			try {
				// Get response content
				let response: AnyMessageContent
				if (typeof rule.response === 'function') {
					response = await rule.response(message, match)
				} else {
					response = rule.response
				}

				// Simulate typing
				if (this.options.simulateTyping && this.sendPresence) {
					await this.sendPresence(jid, 'composing')
					await new Promise(r => setTimeout(r, this.options.typingDuration))
					await this.sendPresence(jid, 'paused')
				}

				// Send reply
				await this.sendMessage(jid, response, rule.quoted ? { quoted: message } : undefined)

				// Set cooldown
				if (rule.cooldown) {
					this.setCooldown(rule.id, jid, rule.cooldown)
				}

				this.options.onReply(rule, message, response)
				matched = true

				// Stop if not multi-match
				if (!this.options.multiMatch) break

			} catch (error) {
				this.options.onError(error as Error, rule, message)
			}
		}

		return matched
	}
}

/**
 * Create an auto-reply handler instance
 */
export const createAutoReply = (
	sendMessage: AutoReplySendFunction,
	sendPresence?: PresenceFunction,
	options?: AutoReplyOptions
): AutoReplyHandler => {
	return new AutoReplyHandler(sendMessage, sendPresence, options)
}
