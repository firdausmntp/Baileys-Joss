/**
 * Baileys-Joss: Activity Logger
 * 
 * Logging aktivitas untuk audit trail:
 * - Message logs
 * - User activity
 * - Group changes
 * - Bot actions
 */

import * as fs from 'fs'
import * as path from 'path'
import type { WAMessage } from '../Types'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 'message' | 'user' | 'group' | 'bot' | 'system' | 'security' | 'error'

export interface LogEntry {
	id: string
	timestamp: Date
	level: LogLevel
	category: LogCategory
	action: string
	actor: string
	target?: string
	details: Record<string, unknown>
	metadata?: Record<string, unknown>
}

export interface ActivityLoggerOptions {
	/** Enable file logging */
	fileLogging?: boolean
	/** Log file path */
	logFilePath?: string
	/** Maximum entries in memory */
	maxMemoryEntries?: number
	/** Log rotation size (bytes) */
	maxFileSize?: number
	/** Minimum log level to record */
	minLevel?: LogLevel
	/** Categories to log */
	categories?: LogCategory[]
	/** Custom log formatter */
	formatter?: (entry: LogEntry) => string
	/** Callback on new log entry */
	onLog?: (entry: LogEntry) => void
}

export interface LogQuery {
	level?: LogLevel | LogLevel[]
	category?: LogCategory | LogCategory[]
	actor?: string
	target?: string
	action?: string
	fromDate?: Date
	toDate?: Date
	limit?: number
	offset?: number
}

export interface LogStats {
	totalEntries: number
	byLevel: Record<LogLevel, number>
	byCategory: Record<LogCategory, number>
	recentActivity: LogEntry[]
	topActors: Array<{ actor: string; count: number }>
}

// =====================================================
// ACTIVITY LOGGER CLASS
// =====================================================

export class ActivityLogger {
	private logs: LogEntry[] = []
	private options: Required<Omit<ActivityLoggerOptions, 'formatter' | 'onLog'>> & {
		formatter?: (entry: LogEntry) => string
		onLog?: (entry: LogEntry) => void
	}
	private writeStream?: fs.WriteStream
	private currentFileSize = 0

	private readonly LOG_LEVELS: Record<LogLevel, number> = {
		debug: 0,
		info: 1,
		warn: 2,
		error: 3,
		critical: 4
	}

	constructor(options: ActivityLoggerOptions = {}) {
		this.options = {
			fileLogging: options.fileLogging ?? false,
			logFilePath: options.logFilePath ?? './logs/activity.log',
			maxMemoryEntries: options.maxMemoryEntries ?? 1000,
			maxFileSize: options.maxFileSize ?? 10 * 1024 * 1024, // 10MB
			minLevel: options.minLevel ?? 'info',
			categories: options.categories ?? ['message', 'user', 'group', 'bot', 'system', 'security', 'error'],
			formatter: options.formatter,
			onLog: options.onLog
		}

		if (this.options.fileLogging) {
			this.initFileLogging()
		}
	}

	/**
	 * Initialize file logging
	 */
	private initFileLogging(): void {
		const dir = path.dirname(this.options.logFilePath)
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true })
		}

		// Check existing file size
		if (fs.existsSync(this.options.logFilePath)) {
			const stats = fs.statSync(this.options.logFilePath)
			this.currentFileSize = stats.size

			// Rotate if needed
			if (this.currentFileSize >= this.options.maxFileSize) {
				this.rotateLogFile()
			}
		}

		this.writeStream = fs.createWriteStream(this.options.logFilePath, { flags: 'a' })
	}

	/**
	 * Rotate log file
	 */
	private rotateLogFile(): void {
		const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
		const rotatedPath = this.options.logFilePath.replace('.log', `.${timestamp}.log`)
		
		if (this.writeStream) {
			this.writeStream.end()
		}

		fs.renameSync(this.options.logFilePath, rotatedPath)
		this.currentFileSize = 0
		this.writeStream = fs.createWriteStream(this.options.logFilePath, { flags: 'a' })
	}

	/**
	 * Generate unique log ID
	 */
	private generateId(): string {
		return `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
	}

	/**
	 * Format log entry for file
	 */
	private formatEntry(entry: LogEntry): string {
		if (this.options.formatter) {
			return this.options.formatter(entry)
		}

		return JSON.stringify({
			...entry,
			timestamp: entry.timestamp.toISOString()
		}) + '\n'
	}

	/**
	 * Check if log should be recorded
	 */
	private shouldLog(level: LogLevel, category: LogCategory): boolean {
		if (this.LOG_LEVELS[level] < this.LOG_LEVELS[this.options.minLevel]) {
			return false
		}

		if (!this.options.categories.includes(category)) {
			return false
		}

		return true
	}

	/**
	 * Write log entry
	 */
	private writeLog(entry: LogEntry): void {
		// Add to memory
		this.logs.push(entry)

		// Trim memory if needed
		if (this.logs.length > this.options.maxMemoryEntries) {
			this.logs = this.logs.slice(-this.options.maxMemoryEntries)
		}

		// Write to file
		if (this.options.fileLogging && this.writeStream) {
			const formatted = this.formatEntry(entry)
			this.writeStream.write(formatted)
			this.currentFileSize += Buffer.byteLength(formatted)

			// Rotate if needed
			if (this.currentFileSize >= this.options.maxFileSize) {
				this.rotateLogFile()
			}
		}

		// Callback
		if (this.options.onLog) {
			this.options.onLog(entry)
		}
	}

	/**
	 * Log an entry
	 */
	log(
		level: LogLevel,
		category: LogCategory,
		action: string,
		actor: string,
		details: Record<string, unknown> = {},
		target?: string,
		metadata?: Record<string, unknown>
	): LogEntry | null {
		if (!this.shouldLog(level, category)) {
			return null
		}

		const entry: LogEntry = {
			id: this.generateId(),
			timestamp: new Date(),
			level,
			category,
			action,
			actor,
			target,
			details,
			metadata
		}

		this.writeLog(entry)
		return entry
	}

	// =====================================================
	// CONVENIENCE METHODS
	// =====================================================

	/**
	 * Log debug message
	 */
	debug(category: LogCategory, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('debug', category, action, actor, details)
	}

	/**
	 * Log info message
	 */
	info(category: LogCategory, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('info', category, action, actor, details)
	}

	/**
	 * Log warning
	 */
	warn(category: LogCategory, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('warn', category, action, actor, details)
	}

	/**
	 * Log error
	 */
	error(category: LogCategory, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('error', category, action, actor, details)
	}

	/**
	 * Log critical error
	 */
	critical(category: LogCategory, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('critical', category, action, actor, details)
	}

	// =====================================================
	// SPECIALIZED LOGGING METHODS
	// =====================================================

	/**
	 * Log incoming message
	 */
	logMessage(message: WAMessage, type: 'incoming' | 'outgoing'): LogEntry | null {
		const jid = message.key.remoteJid || 'unknown'
		const sender = message.key.fromMe ? 'self' : (message.key.participant || jid)
		const messageType = this.getMessageType(message)

		return this.log('info', 'message', type, sender, {
			messageId: message.key.id,
			chatJid: jid,
			messageType,
			fromMe: message.key.fromMe,
			hasMedia: ['image', 'video', 'audio', 'document', 'sticker'].includes(messageType)
		}, jid)
	}

	/**
	 * Log user action
	 */
	logUserAction(actor: string, action: string, target?: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('info', 'user', action, actor, details, target)
	}

	/**
	 * Log group event
	 */
	logGroupEvent(groupJid: string, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log('info', 'group', action, actor, details, groupJid)
	}

	/**
	 * Log bot action
	 */
	logBotAction(action: string, details?: Record<string, unknown>, target?: string): LogEntry | null {
		return this.log('info', 'bot', action, 'bot', details, target)
	}

	/**
	 * Log security event
	 */
	logSecurityEvent(level: LogLevel, action: string, actor: string, details?: Record<string, unknown>): LogEntry | null {
		return this.log(level, 'security', action, actor, details)
	}

	/**
	 * Get message type helper
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
		if (content.contactMessage) return 'contact'
		if (content.pollCreationMessage) return 'poll'
		if (content.reactionMessage) return 'reaction'

		return 'other'
	}

	// =====================================================
	// QUERY METHODS
	// =====================================================

	/**
	 * Query logs
	 */
	query(query: LogQuery): LogEntry[] {
		let results = [...this.logs]

		// Filter by level
		if (query.level) {
			const levels = Array.isArray(query.level) ? query.level : [query.level]
			results = results.filter(e => levels.includes(e.level))
		}

		// Filter by category
		if (query.category) {
			const categories = Array.isArray(query.category) ? query.category : [query.category]
			results = results.filter(e => categories.includes(e.category))
		}

		// Filter by actor
		if (query.actor) {
			results = results.filter(e => e.actor.includes(query.actor!))
		}

		// Filter by target
		if (query.target) {
			results = results.filter(e => e.target?.includes(query.target!))
		}

		// Filter by action
		if (query.action) {
			results = results.filter(e => e.action.includes(query.action!))
		}

		// Filter by date range
		if (query.fromDate) {
			results = results.filter(e => e.timestamp >= query.fromDate!)
		}
		if (query.toDate) {
			results = results.filter(e => e.timestamp <= query.toDate!)
		}

		// Pagination
		const offset = query.offset || 0
		const limit = query.limit || 100

		return results.slice(offset, offset + limit)
	}

	/**
	 * Get logs for a specific actor
	 */
	getActorLogs(actor: string, limit = 50): LogEntry[] {
		return this.query({ actor, limit })
	}

	/**
	 * Get logs for a specific target (e.g., chat JID)
	 */
	getTargetLogs(target: string, limit = 50): LogEntry[] {
		return this.query({ target, limit })
	}

	/**
	 * Get recent logs
	 */
	getRecentLogs(limit = 50): LogEntry[] {
		return this.logs.slice(-limit).reverse()
	}

	/**
	 * Get logs by level
	 */
	getLogsByLevel(level: LogLevel, limit = 50): LogEntry[] {
		return this.query({ level, limit })
	}

	/**
	 * Get error logs
	 */
	getErrorLogs(limit = 50): LogEntry[] {
		return this.query({ level: ['error', 'critical'], limit })
	}

	// =====================================================
	// STATISTICS
	// =====================================================

	/**
	 * Get log statistics
	 */
	getStats(): LogStats {
		const byLevel: Record<LogLevel, number> = {
			debug: 0,
			info: 0,
			warn: 0,
			error: 0,
			critical: 0
		}

		const byCategory: Record<LogCategory, number> = {
			message: 0,
			user: 0,
			group: 0,
			bot: 0,
			system: 0,
			security: 0,
			error: 0
		}

		const actorCounts = new Map<string, number>()

		for (const entry of this.logs) {
			byLevel[entry.level]++
			byCategory[entry.category]++
			actorCounts.set(entry.actor, (actorCounts.get(entry.actor) || 0) + 1)
		}

		const topActors = Array.from(actorCounts.entries())
			.map(([actor, count]) => ({ actor, count }))
			.sort((a, b) => b.count - a.count)
			.slice(0, 10)

		return {
			totalEntries: this.logs.length,
			byLevel,
			byCategory,
			recentActivity: this.getRecentLogs(10),
			topActors
		}
	}

	// =====================================================
	// MANAGEMENT
	// =====================================================

	/**
	 * Clear all logs from memory
	 */
	clearMemory(): void {
		this.logs = []
	}

	/**
	 * Export logs to JSON
	 */
	export(query?: LogQuery): string {
		const logs = query ? this.query(query) : this.logs
		return JSON.stringify(logs, null, 2)
	}

	/**
	 * Export logs to file
	 */
	async exportToFile(filePath: string, query?: LogQuery): Promise<void> {
		const content = this.export(query)
		await fs.promises.writeFile(filePath, content)
	}

	/**
	 * Close logger
	 */
	close(): void {
		if (this.writeStream) {
			this.writeStream.end()
		}
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createActivityLogger = (options?: ActivityLoggerOptions): ActivityLogger => {
	return new ActivityLogger(options)
}

// =====================================================
// CONSOLE FORMATTER
// =====================================================

export const consoleFormatter = (entry: LogEntry): string => {
	const levelColors: Record<LogLevel, string> = {
		debug: '\x1b[90m',
		info: '\x1b[36m',
		warn: '\x1b[33m',
		error: '\x1b[31m',
		critical: '\x1b[35m'
	}
	const reset = '\x1b[0m'
	const color = levelColors[entry.level]
	
	return `${color}[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] [${entry.category}]${reset} ${entry.action} by ${entry.actor}${entry.target ? ` -> ${entry.target}` : ''}\n`
}
