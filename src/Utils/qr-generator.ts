/**
 * Baileys-Joss: QR Code Generator
 * 
 * Generate QR code custom untuk pairing
 */

export interface QRCodeOptions {
	/** QR code size in pixels */
	size?: number
	/** Error correction level */
	errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
	/** Foreground color (hex) */
	foregroundColor?: string
	/** Background color (hex) */
	backgroundColor?: string
	/** Margin (number of modules) */
	margin?: number
	/** Output format */
	format?: 'svg' | 'terminal' | 'base64' | 'dataUrl'
	/** Logo URL or base64 (for center logo) */
	logo?: string
	/** Logo size ratio (0.1 - 0.3 recommended) */
	logoSizeRatio?: number
}

/**
 * Default QR code options
 */
const DEFAULT_OPTIONS: Required<Omit<QRCodeOptions, 'logo'>> = {
	size: 256,
	errorCorrectionLevel: 'M',
	foregroundColor: '#000000',
	backgroundColor: '#FFFFFF',
	margin: 4,
	format: 'terminal',
	logoSizeRatio: 0.2
}

/**
 * Character sets for terminal rendering
 */
const TERMINAL_CHARS = {
	FULL: '██',
	UPPER: '▀▀',
	LOWER: '▄▄',
	EMPTY: '  '
}

/**
 * Simple QR code generator (uses qrcode library if available)
 */
export class QRCodeGenerator {
	private options: Required<Omit<QRCodeOptions, 'logo'>> & { logo?: string }

	constructor(options: QRCodeOptions = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options }
	}

	/**
	 * Generate QR code as terminal string (fallback without library)
	 */
	async generateTerminal(data: string): Promise<string> {
		try {
			// Try to use qrcode library if available
			const qrcode = await import('qrcode')
			return await qrcode.toString(data, {
				type: 'terminal',
				small: true,
				errorCorrectionLevel: this.options.errorCorrectionLevel
			})
		} catch {
			// Fallback: return placeholder message
			return `
┌─────────────────────────────────────┐
│                                     │
│         QR CODE PLACEHOLDER         │
│                                     │
│   Install 'qrcode' package for      │
│   actual QR code generation:        │
│                                     │
│   npm install qrcode                │
│                                     │
│   Data: ${data.substring(0, 20)}... │
│                                     │
└─────────────────────────────────────┘
`
		}
	}

	/**
	 * Generate QR code as SVG
	 */
	async generateSvg(data: string): Promise<string> {
		try {
			const qrcode = await import('qrcode')
			return await qrcode.toString(data, {
				type: 'svg',
				errorCorrectionLevel: this.options.errorCorrectionLevel,
				margin: this.options.margin,
				color: {
					dark: this.options.foregroundColor,
					light: this.options.backgroundColor
				},
				width: this.options.size
			})
		} catch {
			return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.options.size}" height="${this.options.size}">
				<rect width="100%" height="100%" fill="${this.options.backgroundColor}"/>
				<text x="50%" y="50%" text-anchor="middle" fill="${this.options.foregroundColor}">QR Code (install qrcode package)</text>
			</svg>`
		}
	}

	/**
	 * Generate QR code as base64 PNG
	 */
	async generateBase64(data: string): Promise<string> {
		try {
			const qrcode = await import('qrcode')
			return await qrcode.toDataURL(data, {
				errorCorrectionLevel: this.options.errorCorrectionLevel,
				margin: this.options.margin,
				color: {
					dark: this.options.foregroundColor,
					light: this.options.backgroundColor
				},
				width: this.options.size
			})
		} catch {
			// Return a placeholder 1x1 pixel PNG
			return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
		}
	}

	/**
	 * Generate QR code as Buffer (PNG)
	 */
	async generateBuffer(data: string): Promise<Buffer> {
		try {
			const qrcode = await import('qrcode')
			return await qrcode.toBuffer(data, {
				errorCorrectionLevel: this.options.errorCorrectionLevel,
				margin: this.options.margin,
				color: {
					dark: this.options.foregroundColor,
					light: this.options.backgroundColor
				},
				width: this.options.size
			})
		} catch {
			throw new Error('qrcode package is required for buffer generation. Install with: npm install qrcode')
		}
	}

	/**
	 * Generate QR code based on format option
	 */
	async generate(data: string): Promise<string | Buffer> {
		switch (this.options.format) {
			case 'svg':
				return this.generateSvg(data)
			case 'base64':
			case 'dataUrl':
				return this.generateBase64(data)
			case 'terminal':
			default:
				return this.generateTerminal(data)
		}
	}

	/**
	 * Update options
	 */
	setOptions(options: Partial<QRCodeOptions>): void {
		Object.assign(this.options, options)
	}
}

/**
 * Create a styled QR code for WhatsApp pairing
 */
export const createWhatsAppQR = async (
	pairingCode: string,
	options: QRCodeOptions = {}
): Promise<string> => {
	const generator = new QRCodeGenerator({
		...options,
		foregroundColor: options.foregroundColor || '#128C7E', // WhatsApp green
		backgroundColor: options.backgroundColor || '#FFFFFF',
		errorCorrectionLevel: 'H' // High error correction for logo support
	})

	return generator.generateTerminal(pairingCode)
}

/**
 * Create QR code generator instance
 */
export const createQRGenerator = (options?: QRCodeOptions): QRCodeGenerator => {
	return new QRCodeGenerator(options)
}

/**
 * Quick QR code generation helpers
 */
export const QRHelper = {
	/**
	 * Generate terminal QR
	 */
	terminal: async (data: string): Promise<string> => {
		const generator = new QRCodeGenerator({ format: 'terminal' })
		return generator.generateTerminal(data)
	},

	/**
	 * Generate SVG QR
	 */
	svg: async (data: string, options?: Partial<QRCodeOptions>): Promise<string> => {
		const generator = new QRCodeGenerator({ ...options, format: 'svg' })
		return generator.generateSvg(data)
	},

	/**
	 * Generate base64 QR
	 */
	base64: async (data: string, options?: Partial<QRCodeOptions>): Promise<string> => {
		const generator = new QRCodeGenerator({ ...options, format: 'base64' })
		return generator.generateBase64(data)
	},

	/**
	 * Generate buffer QR
	 */
	buffer: async (data: string, options?: Partial<QRCodeOptions>): Promise<Buffer> => {
		const generator = new QRCodeGenerator(options)
		return generator.generateBuffer(data)
	}
}

/**
 * Custom QR code event handler for baileys
 */
export type QRCodeHandler = (qr: string, attempt: number) => void | Promise<void>

/**
 * Create a QR code handler with custom rendering
 */
export const createQRHandler = (
	options: QRCodeOptions & {
		onQR?: (rendered: string, raw: string, attempt: number) => void
		maxAttempts?: number
	} = {}
): QRCodeHandler => {
	const generator = new QRCodeGenerator(options)
	let attempts = 0
	const maxAttempts = options.maxAttempts || 5

	return async (qr: string) => {
		attempts++

		if (attempts > maxAttempts) {
			console.log(`Maximum QR code attempts (${maxAttempts}) reached`)
			return
		}

		const rendered = await generator.generateTerminal(qr)

		if (options.onQR) {
			options.onQR(rendered, qr, attempts)
		} else {
			console.log(`\nScan QR Code (Attempt ${attempts}/${maxAttempts}):\n`)
			console.log(rendered)
		}
	}
}
