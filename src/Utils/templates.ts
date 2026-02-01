/**
 * Baileys-Joss: Message Templates System
 * 
 * Template pesan siap pakai untuk berbagai keperluan
 */

export interface TemplateVariable {
	name: string
	defaultValue?: string
	required?: boolean
}

export interface MessageTemplate {
	id: string
	name: string
	description?: string
	content: string
	variables: TemplateVariable[]
	category?: string
	createdAt: Date
	updatedAt: Date
}

export interface TemplateData {
	[key: string]: string | number | undefined
}

/**
 * Message Template Manager
 */
export class TemplateManager {
	private templates: Map<string, MessageTemplate> = new Map()

	/**
	 * Generate unique ID
	 */
	private generateId(): string {
		return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
	}

	/**
	 * Extract variables from template string
	 * Variables are in format: {{variableName}}
	 */
	private extractVariables(content: string): TemplateVariable[] {
		const regex = /\{\{(\w+)(?::([^}]*))?\}\}/g
		const variables: TemplateVariable[] = []
		const seen = new Set<string>()
		let match

		while ((match = regex.exec(content)) !== null) {
			const name = match[1]
			if (!name) continue
			const defaultValue = match[2]

			if (!seen.has(name)) {
				seen.add(name)
				variables.push({
					name,
					defaultValue,
					required: !defaultValue
				})
			}
		}

		return variables
	}

	/**
	 * Create a new template
	 */
	create(options: {
		name: string
		content: string
		description?: string
		category?: string
		id?: string
	}): MessageTemplate {
		const template: MessageTemplate = {
			id: options.id ?? this.generateId(),
			name: options.name,
			content: options.content,
			description: options.description,
			category: options.category,
			variables: this.extractVariables(options.content),
			createdAt: new Date(),
			updatedAt: new Date()
		}

		this.templates.set(template.id, template)
		return template
	}

	/**
	 * Get a template by ID
	 */
	get(id: string): MessageTemplate | undefined {
		return this.templates.get(id)
	}

	/**
	 * Get template by name
	 */
	getByName(name: string): MessageTemplate | undefined {
		return Array.from(this.templates.values()).find(t => t.name === name)
	}

	/**
	 * Get all templates
	 */
	getAll(): MessageTemplate[] {
		return Array.from(this.templates.values())
	}

	/**
	 * Get templates by category
	 */
	getByCategory(category: string): MessageTemplate[] {
		return Array.from(this.templates.values()).filter(t => t.category === category)
	}

	/**
	 * Update a template
	 */
	update(id: string, updates: Partial<Omit<MessageTemplate, 'id' | 'createdAt'>>): MessageTemplate | undefined {
		const template = this.templates.get(id)
		if (!template) return undefined

		if (updates.content) {
			updates.variables = this.extractVariables(updates.content)
		}

		const updated = {
			...template,
			...updates,
			updatedAt: new Date()
		}

		this.templates.set(id, updated)
		return updated
	}

	/**
	 * Delete a template
	 */
	delete(id: string): boolean {
		return this.templates.delete(id)
	}

	/**
	 * Render template with data
	 */
	render(id: string, data: TemplateData = {}): string {
		const template = this.templates.get(id)
		if (!template) {
			throw new Error(`Template not found: ${id}`)
		}

		return this.renderContent(template.content, data)
	}

	/**
	 * Render template content with data
	 */
	renderContent(content: string, data: TemplateData = {}): string {
		return content.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (match, name, defaultValue) => {
			const value = data[name]
			if (value !== undefined && value !== null) {
				return String(value)
			}
			if (defaultValue !== undefined) {
				return defaultValue
			}
			return match
		})
	}

	/**
	 * Validate data against template
	 */
	validate(id: string, data: TemplateData): { valid: boolean; missing: string[] } {
		const template = this.templates.get(id)
		if (!template) {
			throw new Error(`Template not found: ${id}`)
		}

		const missing: string[] = []
		for (const variable of template.variables) {
			if (variable.required && !(variable.name in data)) {
				missing.push(variable.name)
			}
		}

		return {
			valid: missing.length === 0,
			missing
		}
	}

	/**
	 * Export templates to JSON
	 */
	export(): string {
		return JSON.stringify(Array.from(this.templates.values()), null, 2)
	}

	/**
	 * Import templates from JSON
	 */
	import(json: string, overwrite = false): number {
		const templates = JSON.parse(json) as MessageTemplate[]
		let imported = 0

		for (const template of templates) {
			if (!overwrite && this.templates.has(template.id)) {
				continue
			}
			this.templates.set(template.id, {
				...template,
				createdAt: new Date(template.createdAt),
				updatedAt: new Date(template.updatedAt)
			})
			imported++
		}

		return imported
	}
}

/**
 * Pre-built templates
 */
export const PRESET_TEMPLATES = {
	// Order Templates
	ORDER_CONFIRMATION: {
		name: 'Order Confirmation',
		category: 'order',
		content: `✅ *Order Confirmed!*

Order ID: #{{orderId}}
Customer: {{customerName}}
Date: {{orderDate}}

📦 *Items:*
{{items}}

💰 *Total: Rp {{total}}*

Thank you for your order! 🙏`
	},

	ORDER_SHIPPED: {
		name: 'Order Shipped',
		category: 'order',
		content: `📦 *Your Order is On The Way!*

Order ID: #{{orderId}}
Tracking: {{trackingNumber}}
Courier: {{courier}}

Estimated delivery: {{estimatedDate}}

Track your package: {{trackingUrl:}}`
	},

	// Invoice Templates
	INVOICE: {
		name: 'Invoice',
		category: 'invoice',
		content: `📄 *INVOICE*

Invoice #: {{invoiceNumber}}
Date: {{invoiceDate}}
Due Date: {{dueDate}}

*Bill To:*
{{customerName}}
{{customerAddress:}}

*Items:*
{{items}}

Subtotal: Rp {{subtotal}}
Tax ({{taxRate:11}}%): Rp {{tax}}
*Total: Rp {{total}}*

Payment Method: {{paymentMethod:Transfer Bank}}
Account: {{bankAccount:}}`
	},

	// Greeting Templates
	WELCOME: {
		name: 'Welcome Message',
		category: 'greeting',
		content: `👋 *Welcome, {{name}}!*

Thank you for joining {{companyName:us}}! 

We're excited to have you. Here's what you can do:
{{features:- Explore our products
- Get exclusive offers
- 24/7 support}}

Need help? Just reply to this message!`
	},

	BIRTHDAY: {
		name: 'Birthday Wishes',
		category: 'greeting',
		content: `🎂 *Happy Birthday, {{name}}!* 🎉

Wishing you a wonderful day filled with joy and happiness!

🎁 As a special gift, here's {{discount:10}}% off your next purchase!
Use code: {{code:BIRTHDAY{{year}}}}

Have a great celebration! 🥳`
	},

	// Notification Templates
	REMINDER: {
		name: 'Reminder',
		category: 'notification',
		content: `⏰ *Reminder*

Hi {{name}},

This is a friendly reminder about:
📋 {{subject}}

📅 Date: {{date}}
🕐 Time: {{time}}
📍 Location: {{location:TBD}}

{{notes:}}

Don't forget! 🙏`
	},

	APPOINTMENT: {
		name: 'Appointment Confirmation',
		category: 'notification',
		content: `📅 *Appointment Confirmed*

Hi {{name}},

Your appointment has been scheduled:

📋 Service: {{service}}
📅 Date: {{date}}
🕐 Time: {{time}}
📍 Location: {{location}}

Please arrive 10 minutes early.

Need to reschedule? Reply to this message.`
	},

	// Support Templates
	SUPPORT_TICKET: {
		name: 'Support Ticket',
		category: 'support',
		content: `🎫 *Support Ticket Created*

Ticket #: {{ticketId}}
Subject: {{subject}}
Priority: {{priority:Normal}}

Hi {{name}},

We've received your request and our team is working on it.

Expected response time: {{responseTime:24 hours}}

Thank you for your patience! 🙏`
	},

	SUPPORT_RESOLVED: {
		name: 'Support Resolved',
		category: 'support',
		content: `✅ *Issue Resolved*

Ticket #: {{ticketId}}

Hi {{name}},

Your issue has been resolved:

*Solution:*
{{solution}}

If you need further assistance, please reply to this message.

Thank you! 🙏`
	}
}

/**
 * Create a template manager with preset templates
 */
export const createTemplateManager = (includePresets = true): TemplateManager => {
	const manager = new TemplateManager()

	if (includePresets) {
		for (const [key, template] of Object.entries(PRESET_TEMPLATES)) {
			manager.create({
				...template,
				id: key.toLowerCase()
			})
		}
	}

	return manager
}

/**
 * Quick template rendering without manager
 */
export const renderTemplate = (content: string, data: TemplateData = {}): string => {
	return content.replace(/\{\{(\w+)(?::([^}]*))?\}\}/g, (match, name, defaultValue) => {
		const value = data[name]
		if (value !== undefined && value !== null) {
			return String(value)
		}
		if (defaultValue !== undefined) {
			return defaultValue
		}
		return match
	})
}
