/**
 * Baileys-Joss: Bulk Messaging System
 * 
 * Fitur untuk mengirim pesan massal dengan rate limiting
 */

import type { AnyMessageContent, WAMessage } from '../Types'

export interface BulkMessageResult {
	jid: string
	success: boolean
	messageId?: string
	error?: string
	sentAt?: Date
}

export interface BulkMessageProgress {
	total: number
	sent: number
	failed: number
	remaining: number
	currentJid?: string
	percentage: number
}

export interface BulkMessagingOptions {
	/** Delay between each message in milliseconds (default: 1000ms) */
	delayBetweenMessages?: number
	/** Random delay variation in milliseconds (default: 500ms) */
	randomDelay?: number
	/** Maximum retries per message (default: 2) */
	maxRetries?: number
	/** Continue on error (default: true) */
	continueOnError?: boolean
	/** Callback on progress update */
	onProgress?: (progress: BulkMessageProgress) => void
	/** Callback on each message sent */
	onMessageSent?: (result: BulkMessageResult) => void
	/** Callback on error */
	onError?: (jid: string, error: Error) => void
	/** Callback when all messages are sent */
	onComplete?: (results: BulkMessageResult[]) => void
}

type BulkSendMessageFunction = (jid: string, content: AnyMessageContent) => Promise<WAMessage | undefined>

/**
 * Generate random delay for natural message timing
 */
const getRandomDelay = (baseDelay: number, variation: number): number => {
	return baseDelay + Math.floor(Math.random() * variation)
}

/**
 * Sleep helper
 */
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Bulk Message Sender - Kirim pesan ke banyak kontak dengan rate limiting
 */
export class BulkMessageSender {
	private sendMessage: BulkSendMessageFunction
	private options: Required<BulkMessagingOptions>
	private isRunning = false
	private shouldStop = false

	constructor(sendMessage: BulkSendMessageFunction, options: BulkMessagingOptions = {}) {
		this.sendMessage = sendMessage
		this.options = {
			delayBetweenMessages: options.delayBetweenMessages ?? 1000,
			randomDelay: options.randomDelay ?? 500,
			maxRetries: options.maxRetries ?? 2,
			continueOnError: options.continueOnError ?? true,
			onProgress: options.onProgress ?? (() => {}),
			onMessageSent: options.onMessageSent ?? (() => {}),
			onError: options.onError ?? (() => {}),
			onComplete: options.onComplete ?? (() => {})
		}
	}

	/**
	 * Send same message to multiple recipients
	 */
	async sendToMany(jids: string[], content: AnyMessageContent): Promise<BulkMessageResult[]> {
		return this.send(jids.map(jid => ({ jid, content })))
	}

	/**
	 * Send different messages to different recipients
	 */
	async send(messages: Array<{ jid: string; content: AnyMessageContent }>): Promise<BulkMessageResult[]> {
		if (this.isRunning) {
			throw new Error('Bulk messaging is already in progress')
		}

		this.isRunning = true
		this.shouldStop = false
		const results: BulkMessageResult[] = []
		const total = messages.length
		let sent = 0
		let failed = 0

		try {
			for (let i = 0; i < messages.length; i++) {
				if (this.shouldStop) {
					break
				}

				const msg = messages[i]
				if (!msg) continue
				const { jid, content } = msg
				const result: BulkMessageResult = { jid, success: false }

				// Update progress
				this.options.onProgress({
					total,
					sent,
					failed,
					remaining: total - sent - failed,
					currentJid: jid,
					percentage: Math.round(((sent + failed) / total) * 100)
				})

				// Try to send with retries
				let lastError: Error | null = null
				for (let retry = 0; retry <= this.options.maxRetries; retry++) {
					try {
						const message = await this.sendMessage(jid, content)
						result.success = true
						result.messageId = message?.key?.id ?? undefined
						result.sentAt = new Date()
						sent++
						break
					} catch (error) {
						lastError = error as Error
						if (retry < this.options.maxRetries) {
							await sleep(500) // Short delay before retry
						}
					}
				}

				if (!result.success) {
					failed++
					result.error = lastError?.message
					this.options.onError(jid, lastError!)
					
					if (!this.options.continueOnError) {
						throw lastError
					}
				}

				results.push(result)
				this.options.onMessageSent(result)

				// Add delay between messages (not after the last one)
				if (i < messages.length - 1) {
					const delay = getRandomDelay(
						this.options.delayBetweenMessages,
						this.options.randomDelay
					)
					await sleep(delay)
				}
			}
		} finally {
			this.isRunning = false
		}

		// Final progress update
		this.options.onProgress({
			total,
			sent,
			failed,
			remaining: 0,
			percentage: 100
		})

		this.options.onComplete(results)

		return results
	}

	/**
	 * Stop the current bulk messaging operation
	 */
	stop(): void {
		this.shouldStop = true
	}

	/**
	 * Check if bulk messaging is in progress
	 */
	get running(): boolean {
		return this.isRunning
	}
}

/**
 * Create a bulk message sender instance
 */
export const createBulkSender = (
	sendMessage: BulkSendMessageFunction,
	options?: BulkMessagingOptions
): BulkMessageSender => {
	return new BulkMessageSender(sendMessage, options)
}

/**
 * Simple helper to send message to multiple JIDs
 */
export const sendBulkMessages = async (
	sendMessage: BulkSendMessageFunction,
	jids: string[],
	content: AnyMessageContent,
	options?: BulkMessagingOptions
): Promise<BulkMessageResult[]> => {
	const sender = new BulkMessageSender(sendMessage, options)
	return sender.sendToMany(jids, content)
}
