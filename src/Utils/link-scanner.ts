/**
 * Baileys-Joss: Link Scanner
 * 
 * Scan dan validasi URL untuk keamanan:
 * - Check domain reputation
 * - Detect phishing patterns
 * - URL shortener expansion
 * - Safe browsing check
 */

import https from 'https'
import http from 'http'

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LinkScanResult {
	url: string
	safe: boolean
	riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical'
	riskScore: number // 0-100
	threats: string[]
	details: {
		isShortener: boolean
		finalUrl?: string
		domain: string
		isHttps: boolean
		hasIPAddress: boolean
		hasSuspiciousPath: boolean
		isKnownMalicious: boolean
		phishingScore: number
	}
	scannedAt: Date
}

export interface LinkScannerOptions {
	/** Follow redirects to get final URL */
	followRedirects?: boolean
	/** Maximum redirects to follow */
	maxRedirects?: number
	/** Timeout for URL check (ms) */
	timeout?: number
	/** Custom malicious domains list */
	maliciousDomains?: string[]
	/** Custom safe domains (always allowed) */
	safeDomains?: string[]
	/** Enable phishing pattern detection */
	enablePhishingDetection?: boolean
}

// =====================================================
// KNOWN DATA
// =====================================================

const URL_SHORTENERS = new Set([
	'bit.ly', 'bitly.com', 'tinyurl.com', 'goo.gl', 't.co',
	'ow.ly', 'is.gd', 'buff.ly', 'j.mp', 'rb.gy',
	'cutt.ly', 'short.link', 'tiny.cc', 'v.gd', 'clck.ru',
	's.id', 'shorturl.at', 'rebrand.ly', 'bl.ink', 'soo.gd'
])

const SUSPICIOUS_TLDS = new Set([
	'.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top',
	'.work', '.click', '.link', '.info', '.biz', '.cc'
])

const KNOWN_MALICIOUS_PATTERNS = [
	/phish/i,
	/scam/i,
	/fake.*login/i,
	/secure.*update/i,
	/account.*verify/i,
	/password.*reset.*urgent/i,
	/suspended.*account/i,
	/banking.*security/i
]

const TRUSTED_DOMAINS = new Set([
	'google.com', 'facebook.com', 'instagram.com', 'twitter.com',
	'youtube.com', 'linkedin.com', 'github.com', 'microsoft.com',
	'apple.com', 'amazon.com', 'whatsapp.com', 'telegram.org',
	'wikipedia.org', 'reddit.com', 'stackoverflow.com'
])

const PHISHING_KEYWORDS = [
	'login', 'signin', 'verify', 'secure', 'account', 'update',
	'confirm', 'password', 'credential', 'bank', 'paypal',
	'apple', 'google', 'microsoft', 'facebook', 'instagram'
]

// =====================================================
// LINK SCANNER CLASS
// =====================================================

export class LinkScanner {
	private options: Required<LinkScannerOptions>
	private maliciousDomains: Set<string>
	private safeDomains: Set<string>

	constructor(options: LinkScannerOptions = {}) {
		this.options = {
			followRedirects: options.followRedirects ?? true,
			maxRedirects: options.maxRedirects ?? 5,
			timeout: options.timeout ?? 5000,
			maliciousDomains: options.maliciousDomains ?? [],
			safeDomains: options.safeDomains ?? [],
			enablePhishingDetection: options.enablePhishingDetection ?? true
		}

		this.maliciousDomains = new Set(this.options.maliciousDomains)
		this.safeDomains = new Set([...TRUSTED_DOMAINS, ...this.options.safeDomains])
	}

	/**
	 * Scan a URL for security threats
	 */
	async scan(url: string): Promise<LinkScanResult> {
		const threats: string[] = []
		let riskScore = 0

		// Parse URL
		let parsedUrl: URL
		try {
			parsedUrl = new URL(url)
		} catch {
			return {
				url,
				safe: false,
				riskLevel: 'critical',
				riskScore: 100,
				threats: ['Invalid URL format'],
				details: {
					isShortener: false,
					domain: '',
					isHttps: false,
					hasIPAddress: false,
					hasSuspiciousPath: false,
					isKnownMalicious: false,
					phishingScore: 0
				},
				scannedAt: new Date()
			}
		}

		const domain = parsedUrl.hostname.toLowerCase()
		const isHttps = parsedUrl.protocol === 'https:'
		const isShortener = URL_SHORTENERS.has(domain)
		const hasIPAddress = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)

		// Check if it's a known safe domain
		if (this.safeDomains.has(domain) || this.isDomainSafe(domain)) {
			return {
				url,
				safe: true,
				riskLevel: 'safe',
				riskScore: 0,
				threats: [],
				details: {
					isShortener,
					domain,
					isHttps,
					hasIPAddress: false,
					hasSuspiciousPath: false,
					isKnownMalicious: false,
					phishingScore: 0
				},
				scannedAt: new Date()
			}
		}

		// Check HTTPS
		if (!isHttps) {
			threats.push('No HTTPS encryption')
			riskScore += 15
		}

		// Check IP address instead of domain
		if (hasIPAddress) {
			threats.push('Uses IP address instead of domain name')
			riskScore += 25
		}

		// Check for URL shortener
		if (isShortener) {
			threats.push('URL shortener (may hide malicious destination)')
			riskScore += 15
		}

		// Check suspicious TLD
		if (this.hasSuspiciousTLD(domain)) {
			threats.push('Suspicious top-level domain')
			riskScore += 20
		}

		// Check known malicious domains
		if (this.maliciousDomains.has(domain)) {
			threats.push('Known malicious domain')
			riskScore += 50
		}

		// Check suspicious path patterns
		const hasSuspiciousPath = this.checkSuspiciousPath(parsedUrl.pathname + parsedUrl.search)
		if (hasSuspiciousPath) {
			threats.push('Suspicious URL path pattern')
			riskScore += 20
		}

		// Phishing detection
		let phishingScore = 0
		if (this.options.enablePhishingDetection) {
			phishingScore = this.calculatePhishingScore(url, domain)
			if (phishingScore >= 50) {
				threats.push(`Phishing indicators detected (score: ${phishingScore})`)
				riskScore += Math.min(phishingScore / 2, 30)
			}
		}

		// Check for known malicious patterns
		const isKnownMalicious = KNOWN_MALICIOUS_PATTERNS.some(pattern => pattern.test(url))
		if (isKnownMalicious) {
			threats.push('Matches known malicious pattern')
			riskScore += 40
		}

		// Follow redirects if enabled
		let finalUrl: string | undefined
		if (this.options.followRedirects && isShortener) {
			try {
				finalUrl = await this.resolveRedirects(url)
				if (finalUrl && finalUrl !== url) {
					// Recursively scan the final URL
					const finalResult = await this.scan(finalUrl)
					if (!finalResult.safe) {
						threats.push(...finalResult.threats.map(t => `[Final URL] ${t}`))
						riskScore = Math.max(riskScore, finalResult.riskScore)
					}
				}
			} catch {
				threats.push('Failed to resolve URL shortener')
				riskScore += 10
			}
		}

		// Determine risk level
		const riskLevel = this.getRiskLevel(riskScore)

		return {
			url,
			safe: riskScore < 30,
			riskLevel,
			riskScore: Math.min(riskScore, 100),
			threats,
			details: {
				isShortener,
				finalUrl,
				domain,
				isHttps,
				hasIPAddress,
				hasSuspiciousPath,
				isKnownMalicious,
				phishingScore
			},
			scannedAt: new Date()
		}
	}

	/**
	 * Batch scan multiple URLs
	 */
	async scanMultiple(urls: string[]): Promise<LinkScanResult[]> {
		return Promise.all(urls.map(url => this.scan(url)))
	}

	/**
	 * Quick check if URL is suspicious
	 */
	quickCheck(url: string): { suspicious: boolean; reasons: string[] } {
		const reasons: string[] = []

		try {
			const parsedUrl = new URL(url)
			const domain = parsedUrl.hostname.toLowerCase()

			if (!parsedUrl.protocol.startsWith('https')) {
				reasons.push('No HTTPS')
			}

			if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
				reasons.push('IP address')
			}

			if (URL_SHORTENERS.has(domain)) {
				reasons.push('URL shortener')
			}

			if (this.hasSuspiciousTLD(domain)) {
				reasons.push('Suspicious TLD')
			}

			if (this.maliciousDomains.has(domain)) {
				reasons.push('Known malicious')
			}
		} catch {
			reasons.push('Invalid URL')
		}

		return {
			suspicious: reasons.length > 0,
			reasons
		}
	}

	/**
	 * Add domain to malicious list
	 */
	addMaliciousDomain(domain: string): void {
		this.maliciousDomains.add(domain.toLowerCase())
	}

	/**
	 * Add domain to safe list
	 */
	addSafeDomain(domain: string): void {
		this.safeDomains.add(domain.toLowerCase())
	}

	/**
	 * Remove domain from malicious list
	 */
	removeMaliciousDomain(domain: string): void {
		this.maliciousDomains.delete(domain.toLowerCase())
	}

	/**
	 * Check if domain is safe
	 */
	private isDomainSafe(domain: string): boolean {
		// Check if it's a subdomain of a trusted domain
		for (const trusted of this.safeDomains) {
			if (domain === trusted || domain.endsWith(`.${trusted}`)) {
				return true
			}
		}
		return false
	}

	/**
	 * Check for suspicious TLD
	 */
	private hasSuspiciousTLD(domain: string): boolean {
		for (const tld of SUSPICIOUS_TLDS) {
			if (domain.endsWith(tld)) {
				return true
			}
		}
		return false
	}

	/**
	 * Check for suspicious path patterns
	 */
	private checkSuspiciousPath(path: string): boolean {
		const lowerPath = path.toLowerCase()
		
		// Check for common phishing path patterns
		const suspiciousPatterns = [
			/\/login\//i,
			/\/signin\//i,
			/\/verify\//i,
			/\/secure\//i,
			/\/account\//i,
			/\.php\?.*(?:user|pass|login|token)/i,
			/\/wp-(?:admin|login)/i,
			/\/administrator/i
		]

		return suspiciousPatterns.some(pattern => pattern.test(lowerPath))
	}

	/**
	 * Calculate phishing score
	 */
	private calculatePhishingScore(url: string, domain: string): number {
		let score = 0
		const lowerUrl = url.toLowerCase()
		const lowerDomain = domain.toLowerCase()

		// Check for brand impersonation
		for (const keyword of PHISHING_KEYWORDS) {
			// Brand name in subdomain (like google.malicious.com)
			if (lowerDomain.includes(keyword) && !this.safeDomains.has(domain)) {
				score += 20
			}
			// Brand name in path
			if (lowerUrl.includes(keyword)) {
				score += 5
			}
		}

		// Check for lookalike domains
		const lookalikePairs: Array<[string, string[]]> = [
			['google', ['g00gle', 'googie', 'go0gle', 'goog1e']],
			['facebook', ['faceb00k', 'facebok', 'faceboook']],
			['microsoft', ['micr0soft', 'mircosoft', 'microsft']],
			['apple', ['app1e', 'appie', 'aple']],
			['paypal', ['paypa1', 'paypai', 'paypaI']]
		]

		for (const [, lookalikes] of lookalikePairs) {
			for (const lookalike of lookalikes) {
				if (lowerDomain.includes(lookalike)) {
					score += 40
				}
			}
		}

		// Check for excessive subdomains
		const subdomainCount = domain.split('.').length - 2
		if (subdomainCount > 2) {
			score += 10 * (subdomainCount - 2)
		}

		// Check for suspicious characters
		if (/[@]/.test(url.split('?')[0] || '')) {
			score += 30
		}

		// Check for encoded characters that look suspicious
		if (/%[0-9a-f]{2}/i.test(domain)) {
			score += 20
		}

		return Math.min(score, 100)
	}

	/**
	 * Get risk level from score
	 */
	private getRiskLevel(score: number): LinkScanResult['riskLevel'] {
		if (score < 15) return 'safe'
		if (score < 30) return 'low'
		if (score < 50) return 'medium'
		if (score < 75) return 'high'
		return 'critical'
	}

	/**
	 * Resolve URL redirects
	 */
	private resolveRedirects(url: string, depth = 0): Promise<string> {
		return new Promise((resolve, reject) => {
			if (depth >= this.options.maxRedirects) {
				resolve(url)
				return
			}

			const protocol = url.startsWith('https') ? https : http
			const request = protocol.get(url, {
				timeout: this.options.timeout,
				headers: { 'User-Agent': 'Mozilla/5.0' }
			}, (response) => {
				if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
					const redirectUrl = response.headers.location.startsWith('http')
						? response.headers.location
						: new URL(response.headers.location, url).toString()
					
					this.resolveRedirects(redirectUrl, depth + 1)
						.then(resolve)
						.catch(reject)
				} else {
					resolve(url)
				}
			})

			request.on('error', reject)
			request.on('timeout', () => {
				request.destroy()
				resolve(url)
			})
		})
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createLinkScanner = (options?: LinkScannerOptions): LinkScanner => {
	return new LinkScanner(options)
}

// =====================================================
// QUICK FUNCTIONS
// =====================================================

/**
 * Quick check if URL is a shortener
 */
export const isUrlShortener = (url: string): boolean => {
	try {
		const domain = new URL(url).hostname.toLowerCase()
		return URL_SHORTENERS.has(domain)
	} catch {
		return false
	}
}

/**
 * Extract domain from URL
 */
export const extractDomain = (url: string): string | null => {
	try {
		return new URL(url).hostname.toLowerCase()
	} catch {
		return null
	}
}

/**
 * Check if domain is trusted
 */
export const isTrustedDomain = (domain: string): boolean => {
	return TRUSTED_DOMAINS.has(domain.toLowerCase())
}
