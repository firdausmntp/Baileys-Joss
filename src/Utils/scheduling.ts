/**
 * Baileys-Joss: Message Scheduling System
 * 
 * Fitur untuk menjadwalkan pesan dengan waktu tertentu
 */

import type { AnyMessageContent, WAMessage } from '../Types'

export interface ScheduledMessage {
	id: string
	jid: string
	content: AnyMessageContent
	scheduledTime: Date
	createdAt: Date
	status: 'pending' | 'sent' | 'failed' | 'cancelled'
	error?: string
	messageId?: string
}

export interface SchedulerOptions {
	/** Maximum number of scheduled messages to keep in queue */
	maxQueue?: number
	/** Check interval in milliseconds (default: 1000ms) */
	checkInterval?: number
	/** Callback when message is sent */
	onSent?: (scheduled: ScheduledMessage, message: WAMessage) => void
	/** Callback when message fails */
	onFailed?: (scheduled: ScheduledMessage, error: Error) => void
}

export type SendMessageFunction = (jid: string, content: AnyMessageContent) => Promise<WAMessage | undefined>

/**
 * Message Scheduler - Jadwalkan pesan untuk dikirim otomatis
 */
export class MessageScheduler {
	private queue: Map<string, ScheduledMessage> = new Map()
	private timer: NodeJS.Timeout | null = null
	private sendMessage: SendMessageFunction
	private options: Required<SchedulerOptions>

	constructor(sendMessage: SendMessageFunction, options: SchedulerOptions = {}) {
		this.sendMessage = sendMessage
		this.options = {
			maxQueue: options.maxQueue ?? 1000,
			checkInterval: options.checkInterval ?? 1000,
			onSent: options.onSent ?? (() => {}),
			onFailed: options.onFailed ?? (() => {})
		}
	}

	/**
	 * Generate unique ID for scheduled message
	 */
	private generateId(): string {
		return `sched_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	/**
	 * Schedule a message to be sent at a specific time
	 */
	schedule(jid: string, content: AnyMessageContent, scheduledTime: Date): ScheduledMessage {
		if (this.queue.size >= this.options.maxQueue) {
			throw new Error(`Maximum queue size (${this.options.maxQueue}) reached`)
		}

		if (scheduledTime.getTime() <= Date.now()) {
			throw new Error('Scheduled time must be in the future')
		}

		const scheduled: ScheduledMessage = {
			id: this.generateId(),
			jid,
			content,
			scheduledTime,
			createdAt: new Date(),
			status: 'pending'
		}

		this.queue.set(scheduled.id, scheduled)
		this.ensureTimerRunning()

		return scheduled
	}

	/**
	 * Schedule message with delay (in milliseconds)
	 */
	scheduleDelay(jid: string, content: AnyMessageContent, delayMs: number): ScheduledMessage {
		const scheduledTime = new Date(Date.now() + delayMs)
		return this.schedule(jid, content, scheduledTime)
	}

	/**
	 * Cancel a scheduled message
	 */
	cancel(id: string): boolean {
		const scheduled = this.queue.get(id)
		if (scheduled && scheduled.status === 'pending') {
			scheduled.status = 'cancelled'
			this.queue.delete(id)
			return true
		}
		return false
	}

	/**
	 * Cancel all scheduled messages for a specific JID
	 */
	cancelForJid(jid: string): number {
		let cancelled = 0
		for (const [id, scheduled] of this.queue) {
			if (scheduled.jid === jid && scheduled.status === 'pending') {
				scheduled.status = 'cancelled'
				this.queue.delete(id)
				cancelled++
			}
		}
		return cancelled
	}

	/**
	 * Get all pending scheduled messages
	 */
	getPending(): ScheduledMessage[] {
		return Array.from(this.queue.values()).filter(s => s.status === 'pending')
	}

	/**
	 * Get scheduled message by ID
	 */
	get(id: string): ScheduledMessage | undefined {
		return this.queue.get(id)
	}

	/**
	 * Clear all pending messages
	 */
	clearAll(): number {
		const count = this.queue.size
		this.queue.clear()
		this.stopTimer()
		return count
	}

	/**
	 * Process queue and send due messages
	 */
	private async processQueue() {
		const now = Date.now()

		for (const [id, scheduled] of this.queue) {
			if (scheduled.status !== 'pending') continue
			if (scheduled.scheduledTime.getTime() > now) continue

			try {
				const message = await this.sendMessage(scheduled.jid, scheduled.content)
				scheduled.status = 'sent'
				scheduled.messageId = message?.key?.id ?? undefined
				this.options.onSent(scheduled, message!)
			} catch (error) {
				scheduled.status = 'failed'
				scheduled.error = (error as Error).message
				this.options.onFailed(scheduled, error as Error)
			}

			this.queue.delete(id)
		}

		// Stop timer if queue is empty
		if (this.queue.size === 0) {
			this.stopTimer()
		}
	}

	private ensureTimerRunning() {
		if (!this.timer) {
			this.timer = setInterval(() => this.processQueue(), this.options.checkInterval)
		}
	}

	private stopTimer() {
		if (this.timer) {
			clearInterval(this.timer)
			this.timer = null
		}
	}

	/**
	 * Stop the scheduler
	 */
	stop() {
		this.stopTimer()
	}

	/**
	 * Start the scheduler (auto-starts when messages are scheduled)
	 */
	start() {
		if (this.queue.size > 0) {
			this.ensureTimerRunning()
		}
	}
}

/**
 * Create a message scheduler instance
 */
export const createMessageScheduler = (
	sendMessage: SendMessageFunction,
	options?: SchedulerOptions
): MessageScheduler => {
	return new MessageScheduler(sendMessage, options)
}
