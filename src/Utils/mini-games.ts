/**
 * Baileys-Joss: Mini Games
 * 
 * Game sederhana untuk chat: Tebak Angka, Quiz, Tictactoe
 */

import type { AnyMessageContent, WAMessage } from '../Types'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface GameSession {
	id: string
	jid: string
	type: 'guess' | 'quiz' | 'tictactoe' | 'rps' | 'dice' | 'flip'
	state: 'active' | 'finished' | 'timeout'
	players: string[]
	data: Record<string, unknown>
	createdAt: Date
	expiresAt: Date
}

export interface QuizQuestion {
	question: string
	options: string[]
	correctIndex: number
	explanation?: string
	category?: string
	difficulty?: 'easy' | 'medium' | 'hard'
}

export interface TictactoeBoard {
	cells: Array<'X' | 'O' | null>
	currentPlayer: 'X' | 'O'
	playerX: string
	playerO: string
}

export interface GameResult {
	winner?: string
	draw?: boolean
	score?: number
	message: string
}

// =====================================================
// GAME MANAGER
// =====================================================

export class MiniGamesManager {
	private sessions: Map<string, GameSession> = new Map()
	private sessionTimeout = 5 * 60 * 1000 // 5 minutes

	/**
	 * Generate unique session ID
	 */
	private generateId(): string {
		return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
	}

	/**
	 * Get session by JID
	 */
	getSession(jid: string): GameSession | undefined {
		for (const [, session] of this.sessions) {
			if (session.jid === jid && session.state === 'active') {
				return session
			}
		}
		return undefined
	}

	/**
	 * End session
	 */
	endSession(sessionId: string): void {
		const session = this.sessions.get(sessionId)
		if (session) {
			session.state = 'finished'
		}
	}

	/**
	 * Clean expired sessions
	 */
	cleanExpiredSessions(): void {
		const now = Date.now()
		for (const [id, session] of this.sessions) {
			if (session.expiresAt.getTime() < now) {
				session.state = 'timeout'
				this.sessions.delete(id)
			}
		}
	}

	// =====================================================
	// GUESS NUMBER GAME
	// =====================================================

	/**
	 * Start a number guessing game
	 */
	startGuessNumber(jid: string, min = 1, max = 100): GameSession {
		const secretNumber = Math.floor(Math.random() * (max - min + 1)) + min
		
		const session: GameSession = {
			id: this.generateId(),
			jid,
			type: 'guess',
			state: 'active',
			players: [],
			data: {
				secretNumber,
				min,
				max,
				attempts: 0,
				maxAttempts: 10
			},
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + this.sessionTimeout)
		}

		this.sessions.set(session.id, session)
		return session
	}

	/**
	 * Process guess for number game
	 */
	guessNumber(sessionId: string, guess: number): { 
		correct: boolean 
		hint: 'higher' | 'lower' | 'correct'
		attempts: number
		gameOver: boolean
		message: string
	} {
		const session = this.sessions.get(sessionId)
		if (!session || session.type !== 'guess' || session.state !== 'active') {
			return { correct: false, hint: 'correct', attempts: 0, gameOver: true, message: '❌ Game tidak ditemukan!' }
		}

		const { secretNumber, maxAttempts } = session.data as { secretNumber: number; maxAttempts: number }
		session.data.attempts = ((session.data.attempts as number) || 0) + 1
		const attempts = session.data.attempts as number

		if (guess === secretNumber) {
			session.state = 'finished'
			return {
				correct: true,
				hint: 'correct',
				attempts,
				gameOver: true,
				message: `🎉 BENAR! Angkanya adalah ${secretNumber}!\nKamu berhasil dalam ${attempts} percobaan!`
			}
		}

		if (attempts >= maxAttempts) {
			session.state = 'finished'
			return {
				correct: false,
				hint: guess < secretNumber ? 'higher' : 'lower',
				attempts,
				gameOver: true,
				message: `💀 Game Over! Angkanya adalah ${secretNumber}.\nKamu kehabisan kesempatan!`
			}
		}

		const hint = guess < secretNumber ? 'higher' : 'lower'
		return {
			correct: false,
			hint,
			attempts,
			gameOver: false,
			message: hint === 'higher' 
				? `⬆️ Terlalu kecil! Coba angka yang lebih BESAR\n📊 Sisa percobaan: ${maxAttempts - attempts}`
				: `⬇️ Terlalu besar! Coba angka yang lebih KECIL\n📊 Sisa percobaan: ${maxAttempts - attempts}`
		}
	}

	// =====================================================
	// QUIZ GAME
	// =====================================================

	/**
	 * Start a quiz game
	 */
	startQuiz(jid: string, questions: QuizQuestion[]): GameSession {
		const session: GameSession = {
			id: this.generateId(),
			jid,
			type: 'quiz',
			state: 'active',
			players: [],
			data: {
				questions,
				currentIndex: 0,
				score: 0,
				answers: []
			},
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + this.sessionTimeout)
		}

		this.sessions.set(session.id, session)
		return session
	}

	/**
	 * Get current quiz question
	 */
	getCurrentQuestion(sessionId: string): { question: QuizQuestion; index: number; total: number } | null {
		const session = this.sessions.get(sessionId)
		if (!session || session.type !== 'quiz' || session.state !== 'active') {
			return null
		}

		const { questions, currentIndex } = session.data as { questions: QuizQuestion[]; currentIndex: number }
		const question = questions[currentIndex]
		if (!question) return null

		return {
			question,
			index: currentIndex + 1,
			total: questions.length
		}
	}

	/**
	 * Answer quiz question
	 */
	answerQuiz(sessionId: string, answerIndex: number): {
		correct: boolean
		correctAnswer: string
		explanation?: string
		score: number
		gameOver: boolean
		nextQuestion?: QuizQuestion
		message: string
	} {
		const session = this.sessions.get(sessionId)
		if (!session || session.type !== 'quiz' || session.state !== 'active') {
			return { correct: false, correctAnswer: '', score: 0, gameOver: true, message: '❌ Quiz tidak ditemukan!' }
		}

		const data = session.data as { 
			questions: QuizQuestion[]
			currentIndex: number
			score: number
			answers: boolean[]
		}
		
		const currentQuestion = data.questions[data.currentIndex]
		if (!currentQuestion) {
			session.state = 'finished'
			return { correct: false, correctAnswer: '', score: data.score, gameOver: true, message: '❌ Pertanyaan tidak valid!' }
		}

		const correct = answerIndex === currentQuestion.correctIndex
		if (correct) data.score++
		data.answers.push(correct)
		data.currentIndex++

		const gameOver = data.currentIndex >= data.questions.length
		if (gameOver) {
			session.state = 'finished'
		}

		const nextQuestion = gameOver ? undefined : data.questions[data.currentIndex]

		return {
			correct,
			correctAnswer: currentQuestion.options[currentQuestion.correctIndex] || '',
			explanation: currentQuestion.explanation,
			score: data.score,
			gameOver,
			nextQuestion,
			message: correct
				? `✅ BENAR! +1 poin (${data.score}/${data.questions.length})`
				: `❌ SALAH! Jawaban: ${currentQuestion.options[currentQuestion.correctIndex]}${currentQuestion.explanation ? `\n💡 ${currentQuestion.explanation}` : ''}`
		}
	}

	// =====================================================
	// TIC TAC TOE
	// =====================================================

	/**
	 * Start Tic Tac Toe game
	 */
	startTictactoe(jid: string, playerX: string, playerO: string): GameSession {
		const session: GameSession = {
			id: this.generateId(),
			jid,
			type: 'tictactoe',
			state: 'active',
			players: [playerX, playerO],
			data: {
				cells: Array(9).fill(null) as Array<'X' | 'O' | null>,
				currentPlayer: 'X' as const,
				playerX,
				playerO
			},
			createdAt: new Date(),
			expiresAt: new Date(Date.now() + this.sessionTimeout)
		}

		this.sessions.set(session.id, session)
		return session
	}

	/**
	 * Make a move in Tic Tac Toe
	 */
	tictactoeMove(sessionId: string, player: string, position: number): {
		valid: boolean
		board: string
		gameOver: boolean
		winner?: string
		draw?: boolean
		message: string
	} {
		const session = this.sessions.get(sessionId)
		if (!session || session.type !== 'tictactoe' || session.state !== 'active') {
			return { valid: false, board: '', gameOver: true, message: '❌ Game tidak ditemukan!' }
		}

		const board = session.data as unknown as TictactoeBoard
		const isPlayerX = player === board.playerX
		const isPlayerO = player === board.playerO
		const expectedSymbol = board.currentPlayer

		// Check if it's the player's turn
		if ((expectedSymbol === 'X' && !isPlayerX) || (expectedSymbol === 'O' && !isPlayerO)) {
			return { valid: false, board: this.renderTictactoeBoard(board.cells), gameOver: false, message: '❌ Bukan giliranmu!' }
		}

		// Check if position is valid
		if (position < 0 || position > 8 || board.cells[position] !== null) {
			return { valid: false, board: this.renderTictactoeBoard(board.cells), gameOver: false, message: '❌ Posisi tidak valid!' }
		}

		// Make the move
		board.cells[position] = expectedSymbol

		// Check for winner
		const winner = this.checkTictactoeWinner(board.cells)
		if (winner) {
			session.state = 'finished'
			const winnerName = winner === 'X' ? board.playerX : board.playerO
			return {
				valid: true,
				board: this.renderTictactoeBoard(board.cells),
				gameOver: true,
				winner: winnerName,
				message: `🎉 ${winnerName} (${winner}) MENANG!\n\n${this.renderTictactoeBoard(board.cells)}`
			}
		}

		// Check for draw
		if (board.cells.every(cell => cell !== null)) {
			session.state = 'finished'
			return {
				valid: true,
				board: this.renderTictactoeBoard(board.cells),
				gameOver: true,
				draw: true,
				message: `🤝 SERI!\n\n${this.renderTictactoeBoard(board.cells)}`
			}
		}

		// Switch player
		board.currentPlayer = board.currentPlayer === 'X' ? 'O' : 'X'
		const nextPlayer = board.currentPlayer === 'X' ? board.playerX : board.playerO

		return {
			valid: true,
			board: this.renderTictactoeBoard(board.cells),
			gameOver: false,
			message: `${this.renderTictactoeBoard(board.cells)}\n\nGiliran: ${nextPlayer} (${board.currentPlayer})`
		}
	}

	/**
	 * Check for Tic Tac Toe winner
	 */
	private checkTictactoeWinner(cells: Array<'X' | 'O' | null>): 'X' | 'O' | null {
		const lines = [
			[0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
			[0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
			[0, 4, 8], [2, 4, 6] // Diagonals
		]

		for (const line of lines) {
			const a = line[0]
			const b = line[1]
			const c = line[2]
			if (a !== undefined && b !== undefined && c !== undefined) {
				if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
					return cells[a]
				}
			}
		}

		return null
	}

	/**
	 * Render Tic Tac Toe board
	 */
	private renderTictactoeBoard(cells: Array<'X' | 'O' | null>): string {
		const symbols = cells.map((cell, i) => cell || (i + 1).toString())
		return `
┌───┬───┬───┐
│ ${symbols[0]} │ ${symbols[1]} │ ${symbols[2]} │
├───┼───┼───┤
│ ${symbols[3]} │ ${symbols[4]} │ ${symbols[5]} │
├───┼───┼───┤
│ ${symbols[6]} │ ${symbols[7]} │ ${symbols[8]} │
└───┴───┴───┘`
	}

	// =====================================================
	// SIMPLE GAMES
	// =====================================================

	/**
	 * Rock Paper Scissors
	 */
	rockPaperScissors(userChoice: 'rock' | 'paper' | 'scissors'): {
		userChoice: string
		botChoice: string
		result: 'win' | 'lose' | 'draw'
		message: string
	} {
		const choices = ['rock', 'paper', 'scissors'] as const
		const emojis: Record<string, string> = { rock: '🪨', paper: '📄', scissors: '✂️' }
		const botChoice = choices[Math.floor(Math.random() * 3)] ?? 'rock'

		let result: 'win' | 'lose' | 'draw'
		if (userChoice === botChoice) {
			result = 'draw'
		} else if (
			(userChoice === 'rock' && botChoice === 'scissors') ||
			(userChoice === 'paper' && botChoice === 'rock') ||
			(userChoice === 'scissors' && botChoice === 'paper')
		) {
			result = 'win'
		} else {
			result = 'lose'
		}

		const resultText = result === 'win' ? '🎉 Kamu MENANG!' : result === 'lose' ? '😢 Kamu KALAH!' : '🤝 SERI!'

		return {
			userChoice,
			botChoice,
			result,
			message: `${emojis[userChoice]} vs ${emojis[botChoice]}\n\n${resultText}`
		}
	}

	/**
	 * Roll a dice
	 */
	rollDice(sides = 6, count = 1): {
		results: number[]
		total: number
		message: string
	} {
		const results: number[] = []
		for (let i = 0; i < count; i++) {
			results.push(Math.floor(Math.random() * sides) + 1)
		}
		const total = results.reduce((sum, n) => sum + n, 0)

		const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
		const visual = results.map(r => sides === 6 ? diceEmojis[r - 1] : `[${r}]`).join(' ')

		return {
			results,
			total,
			message: `🎲 ${visual}\n\nTotal: ${total}`
		}
	}

	/**
	 * Flip a coin
	 */
	flipCoin(): {
		result: 'heads' | 'tails'
		message: string
	} {
		const result = Math.random() < 0.5 ? 'heads' : 'tails'
		return {
			result,
			message: result === 'heads' ? '🪙 KEPALA! (Heads)' : '🪙 EKOR! (Tails)'
		}
	}

	/**
	 * Random pick from options
	 */
	randomPick<T>(options: T[]): {
		selected: T
		index: number
		message: string
	} {
		const index = Math.floor(Math.random() * options.length)
		const selected = options[index] as T
		return {
			selected,
			index,
			message: `🎰 Hasil random:\n\n➡️ ${selected}`
		}
	}
}

// =====================================================
// SAMPLE QUIZ QUESTIONS
// =====================================================

export const sampleQuizQuestions: QuizQuestion[] = [
	{
		question: 'Apa ibu kota Indonesia?',
		options: ['Surabaya', 'Jakarta', 'Bandung', 'Medan'],
		correctIndex: 1,
		category: 'Geography',
		difficulty: 'easy'
	},
	{
		question: 'Siapa penemu telepon?',
		options: ['Thomas Edison', 'Nikola Tesla', 'Alexander Graham Bell', 'Albert Einstein'],
		correctIndex: 2,
		explanation: 'Alexander Graham Bell mematenkan telepon pada tahun 1876',
		category: 'Science',
		difficulty: 'medium'
	},
	{
		question: 'Berapa jumlah provinsi di Indonesia (2024)?',
		options: ['34', '37', '38', '35'],
		correctIndex: 2,
		explanation: 'Indonesia memiliki 38 provinsi setelah pemekaran',
		category: 'Geography',
		difficulty: 'medium'
	},
	{
		question: 'Apa rumus kimia air?',
		options: ['CO2', 'H2O', 'O2', 'NaCl'],
		correctIndex: 1,
		category: 'Science',
		difficulty: 'easy'
	},
	{
		question: 'Planet terbesar di tata surya?',
		options: ['Mars', 'Saturnus', 'Jupiter', 'Neptunus'],
		correctIndex: 2,
		category: 'Science',
		difficulty: 'easy'
	}
]

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createMiniGames = (): MiniGamesManager => {
	return new MiniGamesManager()
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Format quiz question as message
 */
export const formatQuizQuestion = (
	question: QuizQuestion,
	index: number,
	total: number
): string => {
	const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F']
	const options = question.options.map((opt, i) => `${optionLabels[i]}. ${opt}`).join('\n')
	
	return `📚 *QUIZ* (${index}/${total})${question.difficulty ? ` [${question.difficulty.toUpperCase()}]` : ''}\n\n${question.question}\n\n${options}\n\n_Reply dengan huruf jawaban (A/B/C/D)_`
}
