/**
 * Baileys-Joss: Broadcast List Manager
 * 
 * Fitur untuk mengelola dan mengirim ke broadcast list
 */

import type { AnyMessageContent, WAMessage } from '../Types'

export interface BroadcastList {
	id: string
	name: string
	description?: string
	recipients: string[]
	createdAt: Date
	updatedAt: Date
	metadata?: Record<string, any>
}

export interface BroadcastResult {
	listId: string
	listName: string
	totalRecipients: number
	sent: number
	failed: number
	results: Array<{
		jid: string
		success: boolean
		messageId?: string
		error?: string
	}>
	startedAt: Date
	completedAt: Date
}

export interface BroadcastOptions {
	/** Delay between messages in ms (default: 1000) */
	delay?: number
	/** Random delay variation in ms (default: 500) */
	randomDelay?: number
	/** Continue on error (default: true) */
	continueOnError?: boolean
	/** Progress callback */
	onProgress?: (sent: number, total: number, currentJid: string) => void
}

type BroadcastSendFunction = (jid: string, content: AnyMessageContent) => Promise<WAMessage | undefined>

/**
 * Generate random delay
 */
const getRandomDelay = (base: number, variation: number): number => {
	return base + Math.floor(Math.random() * variation)
}

/**
 * Sleep helper
 */
const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

/**
 * Broadcast List Manager
 */
export class BroadcastManager {
	private lists: Map<string, BroadcastList> = new Map()
	private sendMessage: BroadcastSendFunction

	constructor(sendMessage: BroadcastSendFunction) {
		this.sendMessage = sendMessage
	}

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `bl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	/**
	 * Create a new broadcast list
	 */
	create(options: {
		name: string
		recipients: string[]
		description?: string
		id?: string
		metadata?: Record<string, any>
	}): BroadcastList {
		const list: BroadcastList = {
			id: options.id ?? this.generateId(),
			name: options.name,
			description: options.description,
			recipients: [...new Set(options.recipients)], // Remove duplicates
			createdAt: new Date(),
			updatedAt: new Date(),
			metadata: options.metadata
		}

		this.lists.set(list.id, list)
		return list
	}

	/**
	 * Get a broadcast list by ID
	 */
	get(id: string): BroadcastList | undefined {
		return this.lists.get(id)
	}

	/**
	 * Get list by name
	 */
	getByName(name: string): BroadcastList | undefined {
		return Array.from(this.lists.values()).find(l => l.name === name)
	}

	/**
	 * Get all broadcast lists
	 */
	getAll(): BroadcastList[] {
		return Array.from(this.lists.values())
	}

	/**
	 * Update a broadcast list
	 */
	update(id: string, updates: Partial<Omit<BroadcastList, 'id' | 'createdAt'>>): BroadcastList | undefined {
		const list = this.lists.get(id)
		if (!list) return undefined

		const updated = {
			...list,
			...updates,
			updatedAt: new Date()
		}

		if (updates.recipients) {
			updated.recipients = [...new Set(updates.recipients)]
		}

		this.lists.set(id, updated)
		return updated
	}

	/**
	 * Add recipients to a list
	 */
	addRecipients(id: string, jids: string[]): BroadcastList | undefined {
		const list = this.lists.get(id)
		if (!list) return undefined

		const newRecipients = [...new Set([...list.recipients, ...jids])]
		return this.update(id, { recipients: newRecipients })
	}

	/**
	 * Remove recipients from a list
	 */
	removeRecipients(id: string, jids: string[]): BroadcastList | undefined {
		const list = this.lists.get(id)
		if (!list) return undefined

		const jidSet = new Set(jids)
		const newRecipients = list.recipients.filter(r => !jidSet.has(r))
		return this.update(id, { recipients: newRecipients })
	}

	/**
	 * Delete a broadcast list
	 */
	delete(id: string): boolean {
		return this.lists.delete(id)
	}

	/**
	 * Send message to a broadcast list
	 */
	async broadcast(
		listId: string,
		content: AnyMessageContent,
		options: BroadcastOptions = {}
	): Promise<BroadcastResult> {
		const list = this.lists.get(listId)
		if (!list) {
			throw new Error(`Broadcast list not found: ${listId}`)
		}

		const delay = options.delay ?? 1000
		const randomDelay = options.randomDelay ?? 500
		const continueOnError = options.continueOnError ?? true

		const result: BroadcastResult = {
			listId: list.id,
			listName: list.name,
			totalRecipients: list.recipients.length,
			sent: 0,
			failed: 0,
			results: [],
			startedAt: new Date(),
			completedAt: new Date()
		}

		for (let i = 0; i < list.recipients.length; i++) {
			const jid = list.recipients[i]
			if (!jid) continue

			try {
				options.onProgress?.(i + 1, list.recipients.length, jid)

				const message = await this.sendMessage(jid, content)
				result.sent++
				result.results.push({
					jid,
					success: true,
					messageId: message?.key?.id ?? undefined
				})
			} catch (error) {
				result.failed++
				result.results.push({
					jid,
					success: false,
					error: (error as Error).message
				})

				if (!continueOnError) {
					throw error
				}
			}

			// Delay between messages
			if (i < list.recipients.length - 1) {
				await sleep(getRandomDelay(delay, randomDelay))
			}
		}

		result.completedAt = new Date()
		return result
	}

	/**
	 * Send message to multiple lists
	 */
	async broadcastToLists(
		listIds: string[],
		content: AnyMessageContent,
		options: BroadcastOptions = {}
	): Promise<BroadcastResult[]> {
		const results: BroadcastResult[] = []

		for (const listId of listIds) {
			try {
				const result = await this.broadcast(listId, content, options)
				results.push(result)
			} catch (error) {
				// Continue to next list
			}
		}

		return results
	}

	/**
	 * Export lists to JSON
	 */
	export(): string {
		return JSON.stringify(Array.from(this.lists.values()), null, 2)
	}

	/**
	 * Import lists from JSON
	 */
	import(json: string, overwrite = false): number {
		const lists = JSON.parse(json) as BroadcastList[]
		let imported = 0

		for (const list of lists) {
			if (!overwrite && this.lists.has(list.id)) {
				continue
			}
			this.lists.set(list.id, {
				...list,
				createdAt: new Date(list.createdAt),
				updatedAt: new Date(list.updatedAt)
			})
			imported++
		}

		return imported
	}

	/**
	 * Get statistics
	 */
	getStats(): {
		totalLists: number
		totalRecipients: number
		averageRecipientsPerList: number
	} {
		const lists = this.getAll()
		const totalRecipients = lists.reduce((sum, l) => sum + l.recipients.length, 0)

		return {
			totalLists: lists.length,
			totalRecipients,
			averageRecipientsPerList: lists.length > 0 ? Math.round(totalRecipients / lists.length) : 0
		}
	}
}

/**
 * Create a broadcast manager
 */
export const createBroadcastManager = (sendMessage: BroadcastSendFunction): BroadcastManager => {
	return new BroadcastManager(sendMessage)
}
