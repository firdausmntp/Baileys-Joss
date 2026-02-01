/**
 * Baileys-Joss: Meme Generator
 * 
 * Generate meme sederhana dengan text overlay
 */

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface MemeTemplate {
	id: string
	name: string
	description: string
	textPositions: Array<{
		id: string
		label: string
		defaultText: string
		position: 'top' | 'bottom' | 'center' | 'custom'
		customPosition?: { x: number; y: number }
	}>
	imageUrl?: string
	width?: number
	height?: number
}

export interface MemeConfig {
	template: string | MemeTemplate
	texts: Record<string, string>
	fontSize?: number
	fontColor?: string
	strokeColor?: string
	strokeWidth?: number
}

export interface GeneratedMeme {
	templateId: string
	texts: Record<string, string>
	svgContent: string
	htmlContent: string
}

// =====================================================
// BUILT-IN MEME TEMPLATES
// =====================================================

export const MEME_TEMPLATES: MemeTemplate[] = [
	{
		id: 'drake',
		name: 'Drake Hotline Bling',
		description: 'Drake approving/disapproving meme',
		textPositions: [
			{ id: 'top', label: 'Rejected', defaultText: 'Something bad', position: 'top' },
			{ id: 'bottom', label: 'Approved', defaultText: 'Something good', position: 'bottom' }
		],
		width: 600,
		height: 600
	},
	{
		id: 'distracted',
		name: 'Distracted Boyfriend',
		description: 'Guy looking at another girl meme',
		textPositions: [
			{ id: 'boyfriend', label: 'Boyfriend', defaultText: 'Me', position: 'custom', customPosition: { x: 50, y: 70 } },
			{ id: 'girlfriend', label: 'Girlfriend', defaultText: 'My responsibilities', position: 'custom', customPosition: { x: 80, y: 70 } },
			{ id: 'other', label: 'Other Girl', defaultText: 'Something fun', position: 'custom', customPosition: { x: 20, y: 50 } }
		],
		width: 800,
		height: 550
	},
	{
		id: 'expanding_brain',
		name: 'Expanding Brain',
		description: 'Brain expanding through levels',
		textPositions: [
			{ id: 'level1', label: 'Level 1', defaultText: 'Normal idea', position: 'custom', customPosition: { x: 50, y: 15 } },
			{ id: 'level2', label: 'Level 2', defaultText: 'Better idea', position: 'custom', customPosition: { x: 50, y: 40 } },
			{ id: 'level3', label: 'Level 3', defaultText: 'Galaxy brain idea', position: 'custom', customPosition: { x: 50, y: 65 } },
			{ id: 'level4', label: 'Level 4', defaultText: 'Transcended idea', position: 'custom', customPosition: { x: 50, y: 90 } }
		],
		width: 700,
		height: 800
	},
	{
		id: 'two_buttons',
		name: 'Two Buttons',
		description: 'Sweating guy choosing between two buttons',
		textPositions: [
			{ id: 'button1', label: 'Button 1', defaultText: 'Option A', position: 'custom', customPosition: { x: 30, y: 20 } },
			{ id: 'button2', label: 'Button 2', defaultText: 'Option B', position: 'custom', customPosition: { x: 70, y: 20 } }
		],
		width: 600,
		height: 700
	},
	{
		id: 'this_is_fine',
		name: 'This is Fine',
		description: 'Dog in burning room saying this is fine',
		textPositions: [
			{ id: 'text', label: 'Text', defaultText: 'This is fine', position: 'bottom' }
		],
		width: 600,
		height: 400
	},
	{
		id: 'change_my_mind',
		name: 'Change My Mind',
		description: 'Steven Crowder change my mind meme',
		textPositions: [
			{ id: 'statement', label: 'Statement', defaultText: 'Your opinion here', position: 'center' }
		],
		width: 700,
		height: 400
	},
	{
		id: 'success_kid',
		name: 'Success Kid',
		description: 'Baby with fist celebrating success',
		textPositions: [
			{ id: 'top', label: 'Setup', defaultText: 'When you', position: 'top' },
			{ id: 'bottom', label: 'Punchline', defaultText: 'Success!', position: 'bottom' }
		],
		width: 500,
		height: 500
	},
	{
		id: 'one_does_not',
		name: 'One Does Not Simply',
		description: 'Boromir from LOTR meme',
		textPositions: [
			{ id: 'top', label: 'Top', defaultText: 'One does not simply', position: 'top' },
			{ id: 'bottom', label: 'Bottom', defaultText: 'Walk into Mordor', position: 'bottom' }
		],
		width: 600,
		height: 400
	}
]

// =====================================================
// MEME GENERATOR CLASS
// =====================================================

export class MemeGenerator {
	private templates: Map<string, MemeTemplate> = new Map()

	constructor() {
		// Load built-in templates
		for (const template of MEME_TEMPLATES) {
			this.templates.set(template.id, template)
		}
	}

	/**
	 * Get all available templates
	 */
	getTemplates(): MemeTemplate[] {
		return Array.from(this.templates.values())
	}

	/**
	 * Get template by ID
	 */
	getTemplate(id: string): MemeTemplate | undefined {
		return this.templates.get(id)
	}

	/**
	 * Add custom template
	 */
	addTemplate(template: MemeTemplate): void {
		this.templates.set(template.id, template)
	}

	/**
	 * Generate meme as text (ASCII art style)
	 */
	generateTextMeme(templateId: string, texts: Record<string, string>): string {
		const template = this.templates.get(templateId)
		if (!template) {
			return `❌ Template "${templateId}" not found`
		}

		const lines: string[] = []
		const width = 40

		// Header
		lines.push('╔' + '═'.repeat(width) + '╗')
		lines.push('║' + ` 🎭 ${template.name} `.padStart((width + template.name.length + 4) / 2).padEnd(width) + '║')
		lines.push('╠' + '═'.repeat(width) + '╣')

		// Text positions
		for (const pos of template.textPositions) {
			const text = texts[pos.id] || pos.defaultText
			const wrappedLines = this.wrapText(text, width - 4)
			
			for (const line of wrappedLines) {
				lines.push('║ ' + line.padEnd(width - 2) + ' ║')
			}
			lines.push('║' + '─'.repeat(width) + '║')
		}

		// Footer
		lines.pop() // Remove last separator
		lines.push('╚' + '═'.repeat(width) + '╝')

		return lines.join('\n')
	}

	/**
	 * Generate meme as SVG
	 */
	generateSvgMeme(config: MemeConfig): GeneratedMeme {
		const template = typeof config.template === 'string' 
			? this.templates.get(config.template)
			: config.template

		if (!template) {
			throw new Error(`Template not found`)
		}

		const width = template.width || 600
		const height = template.height || 400
		const fontSize = config.fontSize || 32
		const fontColor = config.fontColor || '#FFFFFF'
		const strokeColor = config.strokeColor || '#000000'
		const strokeWidth = config.strokeWidth || 2

		let textElements = ''

		for (const pos of template.textPositions) {
			const text = config.texts[pos.id] || pos.defaultText
			let x = width / 2
			let y = height / 2

			switch (pos.position) {
				case 'top':
					y = fontSize + 10
					break
				case 'bottom':
					y = height - 20
					break
				case 'center':
					// Already centered
					break
				case 'custom':
					if (pos.customPosition) {
						x = (pos.customPosition.x / 100) * width
						y = (pos.customPosition.y / 100) * height
					}
					break
			}

			textElements += `
				<text x="${x}" y="${y}" 
					font-size="${fontSize}" 
					fill="${fontColor}"
					stroke="${strokeColor}"
					stroke-width="${strokeWidth}"
					text-anchor="middle"
					font-family="Impact, sans-serif"
					font-weight="bold">
					${this.escapeXml(text)}
				</text>
			`
		}

		const svgContent = `
			<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
				<rect width="100%" height="100%" fill="#333"/>
				<text x="${width/2}" y="${height/2 - 50}" 
					font-size="24" 
					fill="#888"
					text-anchor="middle"
					font-family="Arial, sans-serif">
					[${template.name}]
				</text>
				${textElements}
			</svg>
		`.trim()

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<style>
					body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; }
				</style>
			</head>
			<body>${svgContent}</body>
			</html>
		`.trim()

		return {
			templateId: template.id,
			texts: config.texts,
			svgContent,
			htmlContent
		}
	}

	/**
	 * Generate meme description (for text-only display)
	 */
	describeMeme(templateId: string, texts: Record<string, string>): string {
		const template = this.templates.get(templateId)
		if (!template) {
			return `❌ Template "${templateId}" not found`
		}

		const lines: string[] = [
			`🎭 *${template.name}*`,
			`📝 _${template.description}_`,
			''
		]

		for (const pos of template.textPositions) {
			const text = texts[pos.id] || pos.defaultText
			lines.push(`➡️ *${pos.label}:* ${text}`)
		}

		return lines.join('\n')
	}

	/**
	 * List templates as formatted message
	 */
	listTemplates(): string {
		const lines = ['🎭 *Available Meme Templates*', '']
		
		for (const template of this.templates.values()) {
			lines.push(`• *${template.id}* - ${template.name}`)
			lines.push(`  _${template.description}_`)
		}

		lines.push('')
		lines.push('_Use: /meme <template_id> <text1> | <text2>_')

		return lines.join('\n')
	}

	/**
	 * Quick meme from popular formats
	 */
	quickMeme(format: 'drake' | 'expanding' | 'buttons' | 'fine' | 'change', ...texts: string[]): string {
		switch (format) {
			case 'drake':
				return this.generateTextMeme('drake', {
					top: texts[0] || 'Bad thing',
					bottom: texts[1] || 'Good thing'
				})
			case 'expanding':
				return this.generateTextMeme('expanding_brain', {
					level1: texts[0] || 'Level 1',
					level2: texts[1] || 'Level 2',
					level3: texts[2] || 'Level 3',
					level4: texts[3] || 'Level 4'
				})
			case 'buttons':
				return this.generateTextMeme('two_buttons', {
					button1: texts[0] || 'Option A',
					button2: texts[1] || 'Option B'
				})
			case 'fine':
				return this.generateTextMeme('this_is_fine', {
					text: texts[0] || 'This is fine'
				})
			case 'change':
				return this.generateTextMeme('change_my_mind', {
					statement: texts[0] || 'Your opinion here'
				})
			default:
				return '❌ Unknown format'
		}
	}

	/**
	 * Wrap text to fit width
	 */
	private wrapText(text: string, maxWidth: number): string[] {
		const words = text.split(' ')
		const lines: string[] = []
		let currentLine = ''

		for (const word of words) {
			if ((currentLine + ' ' + word).trim().length <= maxWidth) {
				currentLine = (currentLine + ' ' + word).trim()
			} else {
				if (currentLine) lines.push(currentLine)
				currentLine = word
			}
		}

		if (currentLine) lines.push(currentLine)
		return lines.length > 0 ? lines : ['']
	}

	/**
	 * Escape XML special characters
	 */
	private escapeXml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
	}
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export const createMemeGenerator = (): MemeGenerator => {
	return new MemeGenerator()
}

// =====================================================
// QUICK HELPERS
// =====================================================

/**
 * Quick Drake meme
 */
export const drakeMeme = (bad: string, good: string): string => {
	const gen = new MemeGenerator()
	return gen.quickMeme('drake', bad, good)
}

/**
 * Quick expanding brain meme
 */
export const expandingBrainMeme = (...levels: string[]): string => {
	const gen = new MemeGenerator()
	return gen.quickMeme('expanding', ...levels)
}

/**
 * Quick "this is fine" meme
 */
export const thisIsFineMeme = (text?: string): string => {
	const gen = new MemeGenerator()
	return gen.quickMeme('fine', text || 'This is fine')
}
