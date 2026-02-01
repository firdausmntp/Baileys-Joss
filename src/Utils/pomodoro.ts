/**
 * Baileys-Joss: Pomodoro Timer
 * 
 * Timer produktivitas dengan teknik Pomodoro
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface PomodoroConfig {
	workDuration: number      // in minutes (default: 25)
	shortBreakDuration: number // in minutes (default: 5)
	longBreakDuration: number  // in minutes (default: 15)
	sessionsBeforeLongBreak: number // default: 4
	autoStartBreaks: boolean
	autoStartWork: boolean
}

export interface PomodoroSession {
	id: string
	jid: string
	status: 'idle' | 'work' | 'short_break' | 'long_break' | 'paused'
	currentSession: number
	totalSessions: number
	startTime?: number
	pauseTime?: number
	remainingTime?: number
	config: PomodoroConfig
}

export interface PomodoroStats {
	jid: string
	totalWorkSessions: number
	totalWorkMinutes: number
	totalBreakMinutes: number
	currentStreak: number
	longestStreak: number
	lastSessionDate?: string
}

export type PomodoroEventType = 'work_start' | 'work_end' | 'break_start' | 'break_end' | 'session_complete' | 'paused' | 'resumed'

export interface PomodoroEvent {
	type: PomodoroEventType
	session: PomodoroSession
	timestamp: number
}

export type PomodoroEventHandler = (event: PomodoroEvent) => void

// =====================================================
// DEFAULT CONFIG
// =====================================================

export const DEFAULT_POMODORO_CONFIG: PomodoroConfig = {
	workDuration: 25,
	shortBreakDuration: 5,
	longBreakDuration: 15,
	sessionsBeforeLongBreak: 4,
	autoStartBreaks: false,
	autoStartWork: false
}

// =====================================================
// POMODORO MANAGER CLASS
// =====================================================

export class PomodoroManager {
	private sessions: Map<string, PomodoroSession> = new Map()
	private stats: Map<string, PomodoroStats> = new Map()
	private timers: Map<string, NodeJS.Timeout> = new Map()
	private eventHandlers: PomodoroEventHandler[] = []

	/**
	 * Register event handler
	 */
	onEvent(handler: PomodoroEventHandler): void {
		this.eventHandlers.push(handler)
	}

	/**
	 * Emit event to all handlers
	 */
	private emit(type: PomodoroEventType, session: PomodoroSession): void {
		const event: PomodoroEvent = {
			type,
			session: { ...session },
			timestamp: Date.now()
		}
		for (const handler of this.eventHandlers) {
			try {
				handler(event)
			} catch (e) {
				console.error('Pomodoro event handler error:', e)
			}
		}
	}

	/**
	 * Create new pomodoro session
	 */
	createSession(jid: string, config?: Partial<PomodoroConfig>): PomodoroSession {
		const id = `pomo_${Date.now()}_${Math.random().toString(36).substring(7)}`
		const session: PomodoroSession = {
			id,
			jid,
			status: 'idle',
			currentSession: 1,
			totalSessions: 0,
			config: { ...DEFAULT_POMODORO_CONFIG, ...config }
		}
		this.sessions.set(jid, session)
		return session
	}

	/**
	 * Get session for user
	 */
	getSession(jid: string): PomodoroSession | undefined {
		return this.sessions.get(jid)
	}

	/**
	 * Start work session
	 */
	startWork(jid: string): PomodoroSession {
		let session = this.sessions.get(jid)
		if (!session) {
			session = this.createSession(jid)
		}

		// Clear any existing timer
		this.clearTimer(jid)

		session.status = 'work'
		session.startTime = Date.now()
		session.remainingTime = session.config.workDuration * 60 * 1000

		this.emit('work_start', session)
		this.startTimer(jid, session.remainingTime)

		return session
	}

	/**
	 * Start break (short or long)
	 */
	startBreak(jid: string): PomodoroSession | null {
		const session = this.sessions.get(jid)
		if (!session) return null

		// Clear any existing timer
		this.clearTimer(jid)

		// Determine break type
		const isLongBreak = session.currentSession % session.config.sessionsBeforeLongBreak === 0
		session.status = isLongBreak ? 'long_break' : 'short_break'
		session.startTime = Date.now()
		session.remainingTime = (isLongBreak 
			? session.config.longBreakDuration 
			: session.config.shortBreakDuration) * 60 * 1000

		this.emit('break_start', session)
		this.startTimer(jid, session.remainingTime)

		return session
	}

	/**
	 * Pause current session
	 */
	pause(jid: string): PomodoroSession | null {
		const session = this.sessions.get(jid)
		if (!session || session.status === 'idle' || session.status === 'paused') {
			return null
		}

		this.clearTimer(jid)
		
		// Calculate remaining time
		const elapsed = Date.now() - (session.startTime || Date.now())
		session.remainingTime = (session.remainingTime || 0) - elapsed
		session.pauseTime = Date.now()
		session.status = 'paused'

		this.emit('paused', session)
		return session
	}

	/**
	 * Resume paused session
	 */
	resume(jid: string): PomodoroSession | null {
		const session = this.sessions.get(jid)
		if (!session || session.status !== 'paused') {
			return null
		}

		session.startTime = Date.now()
		session.status = 'work' // Resume to work (could track previous state)

		this.emit('resumed', session)
		this.startTimer(jid, session.remainingTime || 0)

		return session
	}

	/**
	 * Stop/reset session
	 */
	stop(jid: string): void {
		this.clearTimer(jid)
		this.sessions.delete(jid)
	}

	/**
	 * Get remaining time formatted
	 */
	getRemainingTime(jid: string): string {
		const session = this.sessions.get(jid)
		if (!session || session.status === 'idle') {
			return '00:00'
		}

		let remaining = session.remainingTime || 0
		
		if (session.status !== 'paused' && session.startTime) {
			const elapsed = Date.now() - session.startTime
			remaining = remaining - elapsed
		}

		if (remaining < 0) remaining = 0

		const minutes = Math.floor(remaining / 60000)
		const seconds = Math.floor((remaining % 60000) / 1000)

		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
	}

	/**
	 * Get session status formatted
	 */
	getStatusMessage(jid: string): string {
		const session = this.sessions.get(jid)
		if (!session) {
			return '⏱️ *Pomodoro Timer*\n\nNo active session.\nUse /pomodoro start to begin!'
		}

		const remaining = this.getRemainingTime(jid)
		const stats = this.stats.get(jid)

		const statusEmoji = {
			'idle': '⏹️',
			'work': '🍅',
			'short_break': '☕',
			'long_break': '🌴',
			'paused': '⏸️'
		}

		const statusText = {
			'idle': 'Ready',
			'work': 'Focus Time',
			'short_break': 'Short Break',
			'long_break': 'Long Break',
			'paused': 'Paused'
		}

		const lines = [
			`${statusEmoji[session.status]} *Pomodoro Timer*`,
			'',
			`📊 Status: *${statusText[session.status]}*`,
			`⏱️ Time: *${remaining}*`,
			`🔢 Session: *${session.currentSession}/${session.config.sessionsBeforeLongBreak}*`,
			''
		]

		if (stats) {
			lines.push('📈 *Today\'s Stats:*')
			lines.push(`  • Work Sessions: ${stats.totalWorkSessions}`)
			lines.push(`  • Focus Time: ${stats.totalWorkMinutes} min`)
			lines.push(`  • Current Streak: ${stats.currentStreak}`)
		}

		return lines.join('\n')
	}

	/**
	 * Get user stats
	 */
	getStats(jid: string): PomodoroStats {
		let stats = this.stats.get(jid)
		if (!stats) {
			stats = {
				jid,
				totalWorkSessions: 0,
				totalWorkMinutes: 0,
				totalBreakMinutes: 0,
				currentStreak: 0,
				longestStreak: 0
			}
			this.stats.set(jid, stats)
		}
		return stats
	}

	/**
	 * Get formatted stats
	 */
	getStatsMessage(jid: string): string {
		const stats = this.getStats(jid)

		return [
			'📊 *Pomodoro Statistics*',
			'',
			`🍅 Total Work Sessions: *${stats.totalWorkSessions}*`,
			`⏱️ Total Focus Time: *${stats.totalWorkMinutes} minutes*`,
			`☕ Total Break Time: *${stats.totalBreakMinutes} minutes*`,
			`🔥 Current Streak: *${stats.currentStreak} sessions*`,
			`🏆 Longest Streak: *${stats.longestStreak} sessions*`,
			'',
			stats.lastSessionDate ? `📅 Last Session: ${stats.lastSessionDate}` : ''
		].filter(Boolean).join('\n')
	}

	/**
	 * Start internal timer
	 */
	private startTimer(jid: string, duration: number): void {
		const timer = setTimeout(() => {
			this.onTimerComplete(jid)
		}, duration)
		this.timers.set(jid, timer)
	}

	/**
	 * Clear timer
	 */
	private clearTimer(jid: string): void {
		const timer = this.timers.get(jid)
		if (timer) {
			clearTimeout(timer)
			this.timers.delete(jid)
		}
	}

	/**
	 * Handle timer completion
	 */
	private onTimerComplete(jid: string): void {
		const session = this.sessions.get(jid)
		if (!session) return

		const stats = this.getStats(jid)

		if (session.status === 'work') {
			// Work session complete
			session.totalSessions++
			stats.totalWorkSessions++
			stats.totalWorkMinutes += session.config.workDuration
			stats.currentStreak++
			stats.longestStreak = Math.max(stats.longestStreak, stats.currentStreak)
			stats.lastSessionDate = new Date().toISOString().split('T')[0]

			this.emit('work_end', session)

			if (session.config.autoStartBreaks) {
				this.startBreak(jid)
			} else {
				session.status = 'idle'
			}
		} else if (session.status === 'short_break' || session.status === 'long_break') {
			// Break complete
			const breakDuration = session.status === 'long_break' 
				? session.config.longBreakDuration 
				: session.config.shortBreakDuration
			stats.totalBreakMinutes += breakDuration

			if (session.status === 'long_break') {
				session.currentSession = 1
			} else {
				session.currentSession++
			}

			this.emit('break_end', session)

			if (session.config.autoStartWork) {
				this.startWork(jid)
			} else {
				session.status = 'idle'
			}
		}
	}

	/**
	 * Format help message
	 */
	getHelpMessage(): string {
		return [
			'🍅 *Pomodoro Timer - Help*',
			'',
			'*Commands:*',
			'• /pomodoro start - Start work session',
			'• /pomodoro break - Start break',
			'• /pomodoro pause - Pause timer',
			'• /pomodoro resume - Resume timer',
			'• /pomodoro stop - Stop & reset',
			'• /pomodoro status - Show status',
			'• /pomodoro stats - Show statistics',
			'',
			'*Settings:*',
			'• /pomodoro set work <minutes>',
			'• /pomodoro set short <minutes>',
			'• /pomodoro set long <minutes>',
			'',
			'*Technique:*',
			'1. 🍅 Work for 25 minutes',
			'2. ☕ Short break (5 min)',
			'3. 🔄 Repeat 4 times',
			'4. 🌴 Long break (15 min)'
		].join('\n')
	}

	/**
	 * Parse command
	 */
	parseCommand(jid: string, command: string): string {
		const parts = command.toLowerCase().trim().split(/\s+/)
		const action = parts[0]

		switch (action) {
			case 'start':
				this.startWork(jid)
				return this.getStatusMessage(jid)
			
			case 'break':
				const breakSession = this.startBreak(jid)
				if (!breakSession) {
					return '❌ No active session. Use /pomodoro start first.'
				}
				return this.getStatusMessage(jid)
			
			case 'pause':
				const pauseResult = this.pause(jid)
				if (!pauseResult) {
					return '❌ No active session to pause.'
				}
				return '⏸️ Timer paused.\n' + this.getStatusMessage(jid)
			
			case 'resume':
				const resumeResult = this.resume(jid)
				if (!resumeResult) {
					return '❌ No paused session to resume.'
				}
				return '▶️ Timer resumed.\n' + this.getStatusMessage(jid)
			
			case 'stop':
			case 'reset':
				this.stop(jid)
				return '⏹️ Pomodoro timer stopped and reset.'
			
			case 'status':
				return this.getStatusMessage(jid)
			
			case 'stats':
				return this.getStatsMessage(jid)
			
			case 'set':
				return this.handleSet(jid, parts.slice(1))
			
			case 'help':
			default:
				return this.getHelpMessage()
		}
	}

	/**
	 * Handle set commands
	 */
	private handleSet(jid: string, args: string[]): string {
		let session = this.sessions.get(jid)
		if (!session) {
			session = this.createSession(jid)
		}

		const [setting, valueStr] = args
		const value = parseInt(valueStr ?? '')

		if (isNaN(value) || value < 1 || value > 120) {
			return '❌ Please provide a valid duration (1-120 minutes)'
		}

		switch (setting) {
			case 'work':
				session.config.workDuration = value
				return `✅ Work duration set to ${value} minutes`
			case 'short':
				session.config.shortBreakDuration = value
				return `✅ Short break set to ${value} minutes`
			case 'long':
				session.config.longBreakDuration = value
				return `✅ Long break set to ${value} minutes`
			default:
				return '❌ Unknown setting. Use: work, short, or long'
		}
	}

	/**
	 * Cleanup all timers
	 */
	cleanup(): void {
		for (const [jid] of this.timers) {
			this.clearTimer(jid)
		}
		this.sessions.clear()
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createPomodoroManager = (): PomodoroManager => {
	return new PomodoroManager()
}

// =====================================================
// QUICK HELPERS
// =====================================================

const defaultManager = new PomodoroManager()

export const pomodoro = {
	start: (jid: string) => defaultManager.startWork(jid),
	break: (jid: string) => defaultManager.startBreak(jid),
	pause: (jid: string) => defaultManager.pause(jid),
	resume: (jid: string) => defaultManager.resume(jid),
	stop: (jid: string) => defaultManager.stop(jid),
	status: (jid: string) => defaultManager.getStatusMessage(jid),
	stats: (jid: string) => defaultManager.getStatsMessage(jid),
	command: (jid: string, cmd: string) => defaultManager.parseCommand(jid, cmd)
}
