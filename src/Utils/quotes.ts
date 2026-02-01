/**
 * Baileys-Joss: Quote Generator
 * 
 * Random quotes, motivational quotes, dan quotes harian
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface Quote {
	id: string
	text: string
	author: string
	category: QuoteCategory
	language: 'en' | 'id' | string
	tags?: string[]
}

export type QuoteCategory = 
	| 'motivational'
	| 'inspirational'
	| 'love'
	| 'life'
	| 'success'
	| 'friendship'
	| 'wisdom'
	| 'funny'
	| 'islamic'
	| 'philosophy'

export interface QuoteOfTheDay {
	quote: Quote
	date: string
}

// =====================================================
// BUILT-IN QUOTES DATABASE
// =====================================================

export const QUOTES: Quote[] = [
	// Motivational - English
	{ id: 'mot1', text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs', category: 'motivational', language: 'en', tags: ['work', 'passion'] },
	{ id: 'mot2', text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill', category: 'motivational', language: 'en', tags: ['success', 'failure'] },
	{ id: 'mot3', text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt', category: 'motivational', language: 'en', tags: ['belief'] },
	{ id: 'mot4', text: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt', category: 'motivational', language: 'en', tags: ['dreams', 'future'] },
	{ id: 'mot5', text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius', category: 'motivational', language: 'en', tags: ['perseverance'] },
	
	// Motivational - Indonesian
	{ id: 'mot6', text: 'Hidup ini seperti sepeda. Agar tetap seimbang, kau harus terus bergerak.', author: 'Albert Einstein', category: 'motivational', language: 'id', tags: ['life', 'balance'] },
	{ id: 'mot7', text: 'Kesuksesan adalah kemampuan untuk pergi dari satu kegagalan ke kegagalan lain tanpa kehilangan semangat.', author: 'Winston Churchill', category: 'motivational', language: 'id', tags: ['success'] },
	{ id: 'mot8', text: 'Jangan takut untuk memulai lagi dari awal. Kali ini, kamu tidak memulai dari nol, tapi dari pengalaman.', author: 'Unknown', category: 'motivational', language: 'id', tags: ['start', 'experience'] },
	
	// Inspirational
	{ id: 'ins1', text: 'In the middle of every difficulty lies opportunity.', author: 'Albert Einstein', category: 'inspirational', language: 'en', tags: ['opportunity'] },
	{ id: 'ins2', text: 'The only impossible journey is the one you never begin.', author: 'Tony Robbins', category: 'inspirational', language: 'en', tags: ['journey'] },
	{ id: 'ins3', text: 'Be the change you wish to see in the world.', author: 'Mahatma Gandhi', category: 'inspirational', language: 'en', tags: ['change'] },
	{ id: 'ins4', text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson', category: 'inspirational', language: 'en', tags: ['inner strength'] },
	
	// Life
	{ id: 'lif1', text: 'Life is what happens when you\'re busy making other plans.', author: 'John Lennon', category: 'life', language: 'en', tags: ['plans'] },
	{ id: 'lif2', text: 'The purpose of our lives is to be happy.', author: 'Dalai Lama', category: 'life', language: 'en', tags: ['happiness'] },
	{ id: 'lif3', text: 'Life is really simple, but we insist on making it complicated.', author: 'Confucius', category: 'life', language: 'en', tags: ['simplicity'] },
	{ id: 'lif4', text: 'Hidup itu bukan tentang menemukan diri sendiri. Hidup itu tentang menciptakan diri sendiri.', author: 'George Bernard Shaw', category: 'life', language: 'id', tags: ['self'] },
	
	// Success
	{ id: 'suc1', text: 'Success usually comes to those who are too busy to be looking for it.', author: 'Henry David Thoreau', category: 'success', language: 'en', tags: ['busy', 'work'] },
	{ id: 'suc2', text: 'Don\'t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller', category: 'success', language: 'en', tags: ['greatness'] },
	{ id: 'suc3', text: 'I find that the harder I work, the more luck I seem to have.', author: 'Thomas Jefferson', category: 'success', language: 'en', tags: ['luck', 'work'] },
	
	// Wisdom
	{ id: 'wis1', text: 'The only true wisdom is in knowing you know nothing.', author: 'Socrates', category: 'wisdom', language: 'en', tags: ['knowledge'] },
	{ id: 'wis2', text: 'Knowledge speaks, but wisdom listens.', author: 'Jimi Hendrix', category: 'wisdom', language: 'en', tags: ['knowledge', 'listening'] },
	{ id: 'wis3', text: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey', category: 'wisdom', language: 'en', tags: ['growth'] },
	
	// Love
	{ id: 'lov1', text: 'The best thing to hold onto in life is each other.', author: 'Audrey Hepburn', category: 'love', language: 'en', tags: ['together'] },
	{ id: 'lov2', text: 'Love is composed of a single soul inhabiting two bodies.', author: 'Aristotle', category: 'love', language: 'en', tags: ['soul'] },
	{ id: 'lov3', text: 'Cinta sejati tidak datang dengan menemukan seseorang yang sempurna, tetapi dengan belajar melihat orang yang tidak sempurna dengan sempurna.', author: 'Sam Keen', category: 'love', language: 'id', tags: ['true love'] },
	
	// Friendship
	{ id: 'fri1', text: 'A friend is someone who knows all about you and still loves you.', author: 'Elbert Hubbard', category: 'friendship', language: 'en', tags: ['friends'] },
	{ id: 'fri2', text: 'Friendship is born at that moment when one person says to another, "What! You too?"', author: 'C.S. Lewis', category: 'friendship', language: 'en', tags: ['connection'] },
	
	// Funny
	{ id: 'fun1', text: 'I\'m not lazy. I\'m just on energy saving mode.', author: 'Unknown', category: 'funny', language: 'en', tags: ['lazy'] },
	{ id: 'fun2', text: 'I\'m not arguing. I\'m just explaining why I\'m right.', author: 'Unknown', category: 'funny', language: 'en', tags: ['argument'] },
	{ id: 'fun3', text: 'My bed is a magical place where I suddenly remember everything I forgot to do.', author: 'Unknown', category: 'funny', language: 'en', tags: ['sleep'] },
	{ id: 'fun4', text: 'Aku tidak malas. Aku hanya sangat termotivasi untuk tidak melakukan apa-apa.', author: 'Unknown', category: 'funny', language: 'id', tags: ['lazy'] },
	
	// Islamic
	{ id: 'isl1', text: 'Verily, with hardship comes ease.', author: 'Quran 94:6', category: 'islamic', language: 'en', tags: ['patience'] },
	{ id: 'isl2', text: 'Allah does not burden a soul beyond that it can bear.', author: 'Quran 2:286', category: 'islamic', language: 'en', tags: ['strength'] },
	{ id: 'isl3', text: 'Sesungguhnya sesudah kesulitan itu ada kemudahan.', author: 'QS. Al-Insyirah: 6', category: 'islamic', language: 'id', tags: ['patience'] },
	{ id: 'isl4', text: 'Barang siapa yang bersabar, maka Allah akan membuatnya sabar.', author: 'HR. Bukhari', category: 'islamic', language: 'id', tags: ['patience'] },
	
	// Philosophy
	{ id: 'phi1', text: 'I think, therefore I am.', author: 'René Descartes', category: 'philosophy', language: 'en', tags: ['existence'] },
	{ id: 'phi2', text: 'The unexamined life is not worth living.', author: 'Socrates', category: 'philosophy', language: 'en', tags: ['life'] },
	{ id: 'phi3', text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche', category: 'philosophy', language: 'en', tags: ['purpose'] }
]

// =====================================================
// QUOTE MANAGER CLASS
// =====================================================

export class QuoteManager {
	private quotes: Quote[] = []
	private quotesOfTheDay: Map<string, QuoteOfTheDay> = new Map()
	private customQuotes: Quote[] = []

	constructor() {
		this.quotes = [...QUOTES]
	}

	/**
	 * Get random quote
	 */
	getRandomQuote(options?: {
		category?: QuoteCategory
		language?: string
		tag?: string
	}): Quote {
		let filtered = [...this.quotes, ...this.customQuotes]

		if (options?.category) {
			filtered = filtered.filter(q => q.category === options.category)
		}

		if (options?.language) {
			filtered = filtered.filter(q => q.language === options.language)
		}

		if (options?.tag) {
			const tagToFind = options.tag
			filtered = filtered.filter(q => q.tags?.includes(tagToFind))
		}

		if (filtered.length === 0) {
			const idx = Math.floor(Math.random() * this.quotes.length)
			return this.quotes[idx] ?? QUOTES[0]!
		}

		const filteredIdx = Math.floor(Math.random() * filtered.length)
		return filtered[filteredIdx] ?? QUOTES[0]!
	}

	/**
	 * Get quote of the day (same quote for entire day)
	 */
	getQuoteOfTheDay(category?: QuoteCategory): QuoteOfTheDay {
		const todayArr = new Date().toISOString().split('T')
		const today = todayArr[0] ?? new Date().toDateString()
		const key = `${today}_${category || 'all'}`

		const existingQotd = this.quotesOfTheDay.get(key)
		if (existingQotd) {
			return existingQotd
		}

		const quote = this.getRandomQuote({ category })
		const qotd: QuoteOfTheDay = { quote, date: today }
		this.quotesOfTheDay.set(key, qotd)
		return qotd
	}

	/**
	 * Add custom quote
	 */
	addQuote(quote: Omit<Quote, 'id'>): Quote {
		const newQuote: Quote = {
			...quote,
			id: `custom_${Date.now()}_${Math.random().toString(36).substring(7)}`
		}
		this.customQuotes.push(newQuote)
		return newQuote
	}

	/**
	 * Get all quotes by category
	 */
	getByCategory(category: QuoteCategory): Quote[] {
		return [...this.quotes, ...this.customQuotes].filter(q => q.category === category)
	}

	/**
	 * Get all quotes by author
	 */
	getByAuthor(author: string): Quote[] {
		const normalizedAuthor = author.toLowerCase()
		return [...this.quotes, ...this.customQuotes].filter(
			q => q.author.toLowerCase().includes(normalizedAuthor)
		)
	}

	/**
	 * Search quotes by text
	 */
	search(query: string): Quote[] {
		const normalizedQuery = query.toLowerCase()
		return [...this.quotes, ...this.customQuotes].filter(
			q => q.text.toLowerCase().includes(normalizedQuery) ||
			     q.author.toLowerCase().includes(normalizedQuery)
		)
	}

	/**
	 * Format quote for display
	 */
	formatQuote(quote: Quote, style: 'simple' | 'fancy' | 'minimal' = 'fancy'): string {
		switch (style) {
			case 'simple':
				return `"${quote.text}"\n— ${quote.author}`
			
			case 'minimal':
				return `${quote.text} - ${quote.author}`
			
			case 'fancy':
			default:
				const categoryEmoji = this.getCategoryEmoji(quote.category)
				return [
					`${categoryEmoji} *Quote of the Day*`,
					'',
					`_"${quote.text}"_`,
					'',
					`— *${quote.author}*`,
					'',
					`📂 ${this.capitalizeFirst(quote.category)}`
				].join('\n')
		}
	}

	/**
	 * Get available categories
	 */
	getCategories(): QuoteCategory[] {
		const categories = new Set<QuoteCategory>()
		for (const quote of [...this.quotes, ...this.customQuotes]) {
			categories.add(quote.category)
		}
		return Array.from(categories)
	}

	/**
	 * Get quote count
	 */
	getQuoteCount(): { total: number; byCategory: Record<string, number> } {
		const allQuotes = [...this.quotes, ...this.customQuotes]
		const byCategory: Record<string, number> = {}

		for (const quote of allQuotes) {
			byCategory[quote.category] = (byCategory[quote.category] || 0) + 1
		}

		return { total: allQuotes.length, byCategory }
	}

	/**
	 * Get help message
	 */
	getHelpMessage(): string {
		const categories = this.getCategories()
		return [
			'💬 *Quote Generator - Help*',
			'',
			'*Commands:*',
			'• /quote - Random quote',
			'• /quote daily - Quote of the day',
			'• /quote <category> - Quote by category',
			'• /quote search <text> - Search quotes',
			'• /quote list - List categories',
			'',
			'*Available Categories:*',
			categories.map(c => `• ${c}`).join('\n')
		].join('\n')
	}

	/**
	 * Parse command and return formatted quote
	 */
	parseCommand(command: string): string {
		const parts = command.toLowerCase().trim().split(/\s+/)
		const action = parts[0]

		switch (action) {
			case 'daily':
			case 'hari':
			case 'harian':
				const qotd = this.getQuoteOfTheDay()
				return this.formatQuote(qotd.quote)
			
			case 'search':
			case 'cari':
				const query = parts.slice(1).join(' ')
				if (!query) {
					return '❌ Please provide search query'
				}
				const results = this.search(query)
				const firstResult = results[0]
				if (results.length === 0 || !firstResult) {
					return '❌ No quotes found'
				}
				return this.formatQuote(firstResult)
			
			case 'list':
			case 'categories':
			case 'kategori':
				const counts = this.getQuoteCount()
				const lines = ['📂 *Quote Categories*', '']
				for (const [cat, count] of Object.entries(counts.byCategory)) {
					lines.push(`• ${this.getCategoryEmoji(cat as QuoteCategory)} ${this.capitalizeFirst(cat)}: ${count}`)
				}
				lines.push('', `Total: ${counts.total} quotes`)
				return lines.join('\n')
			
			case 'help':
			case 'bantuan':
				return this.getHelpMessage()
			
			default:
				// Check if it's a category
				const category = action as QuoteCategory
				if (this.getCategories().includes(category)) {
					const quote = this.getRandomQuote({ category })
					return this.formatQuote(quote)
				}
				
				// Default: random quote
				const randomQuote = this.getRandomQuote()
				return this.formatQuote(randomQuote)
		}
	}

	/**
	 * Get category emoji
	 */
	private getCategoryEmoji(category: QuoteCategory): string {
		const emojis: Record<QuoteCategory, string> = {
			motivational: '🔥',
			inspirational: '✨',
			love: '❤️',
			life: '🌱',
			success: '🏆',
			friendship: '🤝',
			wisdom: '🦉',
			funny: '😂',
			islamic: '☪️',
			philosophy: '🤔'
		}
		return emojis[category] || '💬'
	}

	/**
	 * Capitalize first letter
	 */
	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createQuoteManager = (): QuoteManager => {
	return new QuoteManager()
}

// =====================================================
// QUICK HELPERS
// =====================================================

const defaultManager = new QuoteManager()

/**
 * Get random quote
 */
export const getRandomQuote = (category?: QuoteCategory): string => {
	const quote = defaultManager.getRandomQuote({ category })
	return defaultManager.formatQuote(quote)
}

/**
 * Get quote of the day
 */
export const getQuoteOfTheDay = (): string => {
	const qotd = defaultManager.getQuoteOfTheDay()
	return defaultManager.formatQuote(qotd.quote)
}

/**
 * Get motivational quote
 */
export const getMotivationalQuote = (): string => {
	return getRandomQuote('motivational')
}

/**
 * Get Islamic quote
 */
export const getIslamicQuote = (): string => {
	return getRandomQuote('islamic')
}

/**
 * Get funny quote
 */
export const getFunnyQuote = (): string => {
	return getRandomQuote('funny')
}

/**
 * Parse quote command
 */
export const quoteCommand = (cmd: string): string => {
	return defaultManager.parseCommand(cmd)
}
