/**
 * Baileys-Joss: Chat Control Utilities
 * 
 * Fitur untuk Read Receipt, Typing Indicator, Pinned Messages, Disappearing Messages
 */

export interface TypingOptions {
	/** Duration in milliseconds before auto-pause */
	duration?: number
	/** Auto pause after duration */
	autoPause?: boolean
}

export interface DisappearingOptions {
	/** Duration in seconds (0 = off, 86400 = 24h, 604800 = 7 days, 7776000 = 90 days) */
	duration: number
}

/**
 * Disappearing message durations
 */
export const DISAPPEARING_DURATIONS = {
	OFF: 0,
	HOURS_24: 86400,
	DAYS_7: 604800,
	DAYS_90: 7776000
} as const

/**
 * Typing indicator helper
 */
export class TypingIndicator {
	private intervals: Map<string, NodeJS.Timeout> = new Map()
	private sendPresence: (jid: string, presence: 'composing' | 'paused' | 'recording') => Promise<void>

	constructor(sendPresence: (jid: string, presence: 'composing' | 'paused' | 'recording') => Promise<void>) {
		this.sendPresence = sendPresence
	}

	/**
	 * Start typing indicator
	 */
	async startTyping(jid: string, options: TypingOptions = {}): Promise<void> {
		// Stop existing typing for this jid
		this.stopTyping(jid)

		await this.sendPresence(jid, 'composing')

		if (options.autoPause !== false && options.duration) {
			const timeout = setTimeout(() => {
				this.stopTyping(jid)
			}, options.duration)

			this.intervals.set(jid, timeout)
		}
	}

	/**
	 * Start recording indicator (for voice notes)
	 */
	async startRecording(jid: string, options: TypingOptions = {}): Promise<void> {
		this.stopTyping(jid)

		await this.sendPresence(jid, 'recording')

		if (options.autoPause !== false && options.duration) {
			const timeout = setTimeout(() => {
				this.stopTyping(jid)
			}, options.duration)

			this.intervals.set(jid, timeout)
		}
	}

	/**
	 * Stop typing/recording indicator
	 */
	async stopTyping(jid: string): Promise<void> {
		const existing = this.intervals.get(jid)
		if (existing) {
			clearTimeout(existing)
			this.intervals.delete(jid)
		}

		try {
			await this.sendPresence(jid, 'paused')
		} catch {}
	}

	/**
	 * Stop all typing indicators
	 */
	async stopAll(): Promise<void> {
		for (const [jid] of this.intervals) {
			await this.stopTyping(jid)
		}
	}

	/**
	 * Simulate typing for a duration then execute callback
	 */
	async simulateTyping<T>(
		jid: string,
		duration: number,
		callback: () => Promise<T>
	): Promise<T> {
		await this.startTyping(jid)
		await new Promise(r => setTimeout(r, duration))
		await this.stopTyping(jid)
		return callback()
	}
}

/**
 * Read Receipt controller
 */
export interface ReadReceiptConfig {
	/** Enable read receipts (blue ticks) */
	enabled: boolean
	/** Auto-read messages */
	autoRead?: boolean
	/** Delay before marking as read (ms) */
	readDelay?: number
	/** Excluded JIDs */
	excludeJids?: string[]
}

/**
 * Create read receipt controller
 */
export const createReadReceiptController = (
	sendReadReceipt: (jid: string, participant: string | undefined, messageIds: string[]) => Promise<void>,
	config: ReadReceiptConfig = { enabled: true }
) => {
	let currentConfig = { ...config }

	return {
		/**
		 * Update config
		 */
		setConfig(newConfig: Partial<ReadReceiptConfig>) {
			currentConfig = { ...currentConfig, ...newConfig }
		},

		/**
		 * Get current config
		 */
		getConfig() {
			return { ...currentConfig }
		},

		/**
		 * Enable read receipts
		 */
		enable() {
			currentConfig.enabled = true
		},

		/**
		 * Disable read receipts
		 */
		disable() {
			currentConfig.enabled = false
		},

		/**
		 * Check if enabled
		 */
		isEnabled() {
			return currentConfig.enabled
		},

		/**
		 * Mark messages as read (respects config)
		 */
		async markRead(jid: string, participant: string | undefined, messageIds: string[]) {
			if (!currentConfig.enabled) return
			if (currentConfig.excludeJids?.includes(jid)) return

			if (currentConfig.readDelay) {
				await new Promise(r => setTimeout(r, currentConfig.readDelay))
			}

			await sendReadReceipt(jid, participant, messageIds)
		},

		/**
		 * Force mark as read (ignores config)
		 */
		async forceMarkRead(jid: string, participant: string | undefined, messageIds: string[]) {
			await sendReadReceipt(jid, participant, messageIds)
		}
	}
}

/**
 * Pinned message interface
 */
export interface PinnedMessage {
	messageId: string
	jid: string
	pinnedAt: Date
	pinnedBy?: string
	expiresAt?: Date
}

/**
 * Pinned messages manager (client-side tracking)
 */
export class PinnedMessagesManager {
	private pinnedMessages: Map<string, PinnedMessage[]> = new Map()

	/**
	 * Add pinned message
	 */
	pin(jid: string, messageId: string, pinnedBy?: string, expiresAt?: Date): PinnedMessage {
		const pinned: PinnedMessage = {
			messageId,
			jid,
			pinnedAt: new Date(),
			pinnedBy,
			expiresAt
		}

		const existing = this.pinnedMessages.get(jid) || []
		// Remove if already pinned
		const filtered = existing.filter(p => p.messageId !== messageId)
		filtered.push(pinned)

		this.pinnedMessages.set(jid, filtered)
		return pinned
	}

	/**
	 * Remove pinned message
	 */
	unpin(jid: string, messageId: string): boolean {
		const existing = this.pinnedMessages.get(jid)
		if (!existing) return false

		const filtered = existing.filter(p => p.messageId !== messageId)
		if (filtered.length === existing.length) return false

		this.pinnedMessages.set(jid, filtered)
		return true
	}

	/**
	 * Get pinned messages for a chat
	 */
	getPinned(jid: string): PinnedMessage[] {
		return this.pinnedMessages.get(jid) || []
	}

	/**
	 * Check if message is pinned
	 */
	isPinned(jid: string, messageId: string): boolean {
		const existing = this.pinnedMessages.get(jid) || []
		return existing.some(p => p.messageId === messageId)
	}

	/**
	 * Clear all pins for a chat
	 */
	clearPins(jid: string): void {
		this.pinnedMessages.delete(jid)
	}

	/**
	 * Clear expired pins
	 */
	clearExpired(): number {
		let cleared = 0
		const now = Date.now()

		for (const [jid, pins] of this.pinnedMessages) {
			const valid = pins.filter(p => !p.expiresAt || p.expiresAt.getTime() > now)
			if (valid.length < pins.length) {
				cleared += pins.length - valid.length
				this.pinnedMessages.set(jid, valid)
			}
		}

		return cleared
	}
}

/**
 * Create typing indicator helper
 */
export const createTypingIndicator = (
	sendPresence: (jid: string, presence: 'composing' | 'paused' | 'recording') => Promise<void>
): TypingIndicator => {
	return new TypingIndicator(sendPresence)
}

/**
 * Create pinned messages manager
 */
export const createPinnedMessagesManager = (): PinnedMessagesManager => {
	return new PinnedMessagesManager()
}
