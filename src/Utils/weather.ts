/**
 * Baileys-Joss: Weather Bot
 * 
 * Informasi cuaca dengan integrasi OpenWeatherMap API
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface WeatherConfig {
	apiKey?: string
	units: 'metric' | 'imperial'
	language: string
	defaultCity?: string
}

export interface WeatherData {
	city: string
	country: string
	temperature: number
	feelsLike: number
	humidity: number
	pressure: number
	windSpeed: number
	windDirection: number
	description: string
	icon: string
	visibility: number
	clouds: number
	sunrise: number
	sunset: number
	timestamp: number
}

export interface ForecastData {
	city: string
	country: string
	forecasts: Array<{
		date: string
		time: string
		temperature: number
		feelsLike: number
		humidity: number
		description: string
		icon: string
		windSpeed: number
		pop: number // probability of precipitation
	}>
}

export interface WeatherAlert {
	event: string
	description: string
	start: number
	end: number
	severity: 'minor' | 'moderate' | 'severe' | 'extreme'
}

// =====================================================
// WEATHER ICONS & DESCRIPTIONS
// =====================================================

const WEATHER_EMOJIS: Record<string, string> = {
	'01d': '☀️', '01n': '🌙',   // clear sky
	'02d': '⛅', '02n': '☁️',   // few clouds
	'03d': '☁️', '03n': '☁️',   // scattered clouds
	'04d': '☁️', '04n': '☁️',   // broken clouds
	'09d': '🌧️', '09n': '🌧️',  // shower rain
	'10d': '🌦️', '10n': '🌧️',  // rain
	'11d': '⛈️', '11n': '⛈️',   // thunderstorm
	'13d': '❄️', '13n': '❄️',   // snow
	'50d': '🌫️', '50n': '🌫️',  // mist
}

const WIND_DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

// Sample cities data for offline mode
const SAMPLE_CITIES: Record<string, Partial<WeatherData>> = {
	'jakarta': { city: 'Jakarta', country: 'ID', temperature: 32, humidity: 75, description: 'partly cloudy', icon: '02d' },
	'singapore': { city: 'Singapore', country: 'SG', temperature: 30, humidity: 80, description: 'thunderstorm', icon: '11d' },
	'london': { city: 'London', country: 'GB', temperature: 15, humidity: 70, description: 'cloudy', icon: '04d' },
	'tokyo': { city: 'Tokyo', country: 'JP', temperature: 22, humidity: 60, description: 'clear sky', icon: '01d' },
	'new york': { city: 'New York', country: 'US', temperature: 18, humidity: 55, description: 'few clouds', icon: '02d' },
	'sydney': { city: 'Sydney', country: 'AU', temperature: 25, humidity: 65, description: 'sunny', icon: '01d' },
	'paris': { city: 'Paris', country: 'FR', temperature: 17, humidity: 68, description: 'light rain', icon: '10d' },
	'dubai': { city: 'Dubai', country: 'AE', temperature: 38, humidity: 45, description: 'clear sky', icon: '01d' },
	'seoul': { city: 'Seoul', country: 'KR', temperature: 20, humidity: 58, description: 'overcast', icon: '04d' },
	'mumbai': { city: 'Mumbai', country: 'IN', temperature: 33, humidity: 78, description: 'haze', icon: '50d' },
}

// =====================================================
// WEATHER BOT CLASS
// =====================================================

export class WeatherBot {
	private config: WeatherConfig
	private cache: Map<string, { data: WeatherData; timestamp: number }> = new Map()
	private cacheTimeout = 10 * 60 * 1000 // 10 minutes

	constructor(config?: Partial<WeatherConfig>) {
		this.config = {
			units: 'metric',
			language: 'en',
			...config
		}
	}

	/**
	 * Set API key
	 */
	setApiKey(apiKey: string): void {
		this.config.apiKey = apiKey
	}

	/**
	 * Get weather for city
	 */
	async getWeather(city: string): Promise<WeatherData> {
		const normalizedCity = city.toLowerCase().trim()

		// Check cache first
		const cached = this.cache.get(normalizedCity)
		if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
			return cached.data
		}

		// If API key is set, try to fetch real data
		if (this.config.apiKey) {
			try {
				const data = await this.fetchWeatherFromAPI(city)
				this.cache.set(normalizedCity, { data, timestamp: Date.now() })
				return data
			} catch (error) {
				console.error('Weather API error:', error)
				// Fall through to mock data
			}
		}

		// Use mock data
		const mockData = this.getMockWeather(city)
		this.cache.set(normalizedCity, { data: mockData, timestamp: Date.now() })
		return mockData
	}

	/**
	 * Fetch weather from OpenWeatherMap API
	 */
	private async fetchWeatherFromAPI(city: string): Promise<WeatherData> {
		const url = new URL('https://api.openweathermap.org/data/2.5/weather')
		url.searchParams.set('q', city)
		url.searchParams.set('appid', this.config.apiKey!)
		url.searchParams.set('units', this.config.units)
		url.searchParams.set('lang', this.config.language)

		const response = await fetch(url.toString())
		if (!response.ok) {
			throw new Error(`API error: ${response.status}`)
		}

		const data = await response.json()

		return {
			city: data.name,
			country: data.sys.country,
			temperature: Math.round(data.main.temp),
			feelsLike: Math.round(data.main.feels_like),
			humidity: data.main.humidity,
			pressure: data.main.pressure,
			windSpeed: data.wind.speed,
			windDirection: data.wind.deg || 0,
			description: data.weather[0].description,
			icon: data.weather[0].icon,
			visibility: data.visibility / 1000, // convert to km
			clouds: data.clouds.all,
			sunrise: data.sys.sunrise * 1000,
			sunset: data.sys.sunset * 1000,
			timestamp: Date.now()
		}
	}

	/**
	 * Get mock weather data
	 */
	private getMockWeather(city: string): WeatherData {
		const normalizedCity = city.toLowerCase().trim()
		const sample = SAMPLE_CITIES[normalizedCity]

		if (sample) {
			return {
				city: sample.city || city,
				country: sample.country || 'XX',
				temperature: sample.temperature || 25,
				feelsLike: (sample.temperature || 25) + 2,
				humidity: sample.humidity || 60,
				pressure: 1013,
				windSpeed: 5,
				windDirection: 180,
				description: sample.description || 'clear sky',
				icon: sample.icon || '01d',
				visibility: 10,
				clouds: 20,
				sunrise: Date.now() - 6 * 60 * 60 * 1000,
				sunset: Date.now() + 6 * 60 * 60 * 1000,
				timestamp: Date.now()
			}
		}

		// Generate random weather for unknown cities
		return {
			city: this.capitalizeWords(city),
			country: 'XX',
			temperature: Math.floor(Math.random() * 30) + 10,
			feelsLike: Math.floor(Math.random() * 30) + 12,
			humidity: Math.floor(Math.random() * 50) + 40,
			pressure: Math.floor(Math.random() * 50) + 990,
			windSpeed: Math.floor(Math.random() * 20) + 1,
			windDirection: Math.floor(Math.random() * 360),
			description: 'partly cloudy',
			icon: '02d',
			visibility: 10,
			clouds: Math.floor(Math.random() * 100),
			sunrise: Date.now() - 6 * 60 * 60 * 1000,
			sunset: Date.now() + 6 * 60 * 60 * 1000,
			timestamp: Date.now()
		}
	}

	/**
	 * Format weather data for display
	 */
	formatWeather(data: WeatherData, style: 'simple' | 'detailed' | 'compact' = 'detailed'): string {
		const emoji = WEATHER_EMOJIS[data.icon] || '🌤️'
		const tempUnit = this.config.units === 'metric' ? '°C' : '°F'
		const speedUnit = this.config.units === 'metric' ? 'km/h' : 'mph'
		const windDir = this.getWindDirection(data.windDirection)

		if (style === 'compact') {
			return `${emoji} ${data.city}: ${data.temperature}${tempUnit}, ${data.description}`
		}

		if (style === 'simple') {
			return [
				`${emoji} *Weather in ${data.city}, ${data.country}*`,
				'',
				`🌡️ Temperature: ${data.temperature}${tempUnit}`,
				`💨 Wind: ${data.windSpeed} ${speedUnit}`,
				`💧 Humidity: ${data.humidity}%`,
				`📝 ${this.capitalizeFirst(data.description)}`
			].join('\n')
		}

		// Detailed
		const sunrise = new Date(data.sunrise).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
		const sunset = new Date(data.sunset).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

		return [
			`${emoji} *Weather in ${data.city}, ${data.country}*`,
			'',
			`🌡️ *Temperature*`,
			`  Current: ${data.temperature}${tempUnit}`,
			`  Feels like: ${data.feelsLike}${tempUnit}`,
			'',
			`💨 *Wind*`,
			`  Speed: ${data.windSpeed} ${speedUnit}`,
			`  Direction: ${windDir} (${data.windDirection}°)`,
			'',
			`💧 *Humidity*: ${data.humidity}%`,
			`📊 *Pressure*: ${data.pressure} hPa`,
			`👁️ *Visibility*: ${data.visibility} km`,
			`☁️ *Clouds*: ${data.clouds}%`,
			'',
			`🌅 Sunrise: ${sunrise}`,
			`🌇 Sunset: ${sunset}`,
			'',
			`📝 _${this.capitalizeFirst(data.description)}_`,
			'',
			`⏱️ _Updated: ${new Date(data.timestamp).toLocaleTimeString()}_`
		].join('\n')
	}

	/**
	 * Get weather advice based on conditions
	 */
	getAdvice(data: WeatherData): string {
		const advices: string[] = []

		// Temperature advice
		if (data.temperature > 35) {
			advices.push('🥵 Very hot! Stay hydrated and avoid direct sunlight.')
		} else if (data.temperature > 30) {
			advices.push('☀️ Hot weather. Wear light clothes and drink water.')
		} else if (data.temperature < 10) {
			advices.push('🧥 Cold! Wear warm clothes.')
		} else if (data.temperature < 0) {
			advices.push('❄️ Freezing! Bundle up and stay warm.')
		}

		// Rain/weather advice
		if (data.icon.includes('09') || data.icon.includes('10')) {
			advices.push('☔ Bring an umbrella!')
		}
		if (data.icon.includes('11')) {
			advices.push('⛈️ Thunderstorm expected. Stay indoors if possible.')
		}
		if (data.icon.includes('13')) {
			advices.push('❄️ Snowy conditions. Drive carefully.')
		}
		if (data.icon.includes('50')) {
			advices.push('🌫️ Low visibility due to mist/fog. Be careful.')
		}

		// Wind advice
		if (data.windSpeed > 40) {
			advices.push('💨 Strong winds! Secure loose objects.')
		}

		// UV advice for clear days
		if (data.icon.includes('01d') && data.temperature > 25) {
			advices.push('🧴 Clear and sunny. Apply sunscreen!')
		}

		return advices.length > 0 
			? `\n💡 *Advice:*\n${advices.join('\n')}`
			: ''
	}

	/**
	 * Parse command and return weather
	 */
	async parseCommand(command: string): Promise<string> {
		const parts = command.trim().split(/\s+/)
		const action = parts[0]?.toLowerCase()

		switch (action) {
			case 'help':
			case 'bantuan':
				return this.getHelpMessage()
			
			case 'set':
				if (parts[1] === 'api' && parts[2]) {
					this.setApiKey(parts.slice(2).join(' '))
					return '✅ API key has been set.'
				}
				if (parts[1] === 'units') {
					this.config.units = parts[2] === 'imperial' ? 'imperial' : 'metric'
					return `✅ Units set to ${this.config.units}`
				}
				return '❌ Unknown setting. Use: api, units'
			
			default:
				// Treat as city name
				const city = parts.join(' ')
				if (!city) {
					return '❌ Please specify a city.\nExample: /weather Jakarta'
				}
				
				try {
					const data = await this.getWeather(city)
					const formatted = this.formatWeather(data)
					const advice = this.getAdvice(data)
					return formatted + advice
				} catch (error) {
					return `❌ Could not get weather for "${city}". Please check the city name.`
				}
		}
	}

	/**
	 * Get help message
	 */
	getHelpMessage(): string {
		return [
			'🌤️ *Weather Bot - Help*',
			'',
			'*Commands:*',
			'• /weather <city> - Get weather',
			'• /weather set api <key> - Set API key',
			'• /weather set units metric|imperial',
			'',
			'*Examples:*',
			'• /weather Jakarta',
			'• /weather New York',
			'• /weather Tokyo',
			'',
			'*Note:*',
			'For accurate data, set up OpenWeatherMap API key.',
			'Get free API at: openweathermap.org'
		].join('\n')
	}

	/**
	 * Get wind direction from degrees
	 */
	private getWindDirection(degrees: number): string {
		const index = Math.round(degrees / 45) % 8
		return WIND_DIRECTIONS[index] ?? 'N'
	}

	/**
	 * Capitalize first letter
	 */
	private capitalizeFirst(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1)
	}

	/**
	 * Capitalize each word
	 */
	private capitalizeWords(str: string): string {
		return str.split(' ').map(w => this.capitalizeFirst(w)).join(' ')
	}

	/**
	 * Clear cache
	 */
	clearCache(): void {
		this.cache.clear()
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createWeatherBot = (config?: Partial<WeatherConfig>): WeatherBot => {
	return new WeatherBot(config)
}

// =====================================================
// QUICK HELPERS
// =====================================================

const defaultBot = new WeatherBot()

/**
 * Get weather for city
 */
export const getWeather = async (city: string): Promise<string> => {
	const data = await defaultBot.getWeather(city)
	return defaultBot.formatWeather(data)
}

/**
 * Get simple weather
 */
export const getSimpleWeather = async (city: string): Promise<string> => {
	const data = await defaultBot.getWeather(city)
	return defaultBot.formatWeather(data, 'simple')
}

/**
 * Parse weather command
 */
export const weatherCommand = async (cmd: string): Promise<string> => {
	return defaultBot.parseCommand(cmd)
}
