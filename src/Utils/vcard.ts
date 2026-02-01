/**
 * Baileys-Joss: vCard / Contact Card Generator
 * 
 * Fitur untuk membuat dan mengirim kartu kontak
 */

export interface VCardContact {
	/** Full name */
	fullName: string
	/** Display name (optional) */
	displayName?: string
	/** Organization/Company */
	organization?: string
	/** Title/Position */
	title?: string
	/** Phone numbers */
	phones?: Array<{
		number: string
		type?: 'CELL' | 'WORK' | 'HOME' | 'MAIN' | 'FAX' | 'PAGER'
		label?: string
	}>
	/** Email addresses */
	emails?: Array<{
		email: string
		type?: 'WORK' | 'HOME' | 'OTHER'
	}>
	/** Website URLs */
	urls?: Array<{
		url: string
		type?: 'WORK' | 'HOME' | 'OTHER'
	}>
	/** Physical addresses */
	addresses?: Array<{
		street?: string
		city?: string
		state?: string
		postalCode?: string
		country?: string
		type?: 'WORK' | 'HOME' | 'OTHER'
	}>
	/** Birthday (YYYY-MM-DD format) */
	birthday?: string
	/** Notes */
	note?: string
}

/**
 * Escape special characters for vCard
 */
const escapeVCard = (str: string): string => {
	return str
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
}

/**
 * Format phone number for vCard
 */
const formatPhone = (phone: string): string => {
	// Remove all non-digit characters except +
	return phone.replace(/[^\d+]/g, '')
}

/**
 * Generate vCard string from contact data
 */
export const generateVCard = (contact: VCardContact): string => {
	const lines: string[] = []
	
	// vCard header
	lines.push('BEGIN:VCARD')
	lines.push('VERSION:3.0')
	
	// Full name (required)
	const escapedName = escapeVCard(contact.fullName)
	lines.push(`FN:${escapedName}`)
	
	// Structured name (N: last;first;middle;prefix;suffix)
	const nameParts = contact.fullName.split(' ')
	if (nameParts.length >= 2) {
		const lastName = nameParts[nameParts.length - 1] || ''
		const firstName = nameParts.slice(0, -1).join(' ')
		lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`)
	} else {
		lines.push(`N:${escapedName};;;;`)
	}
	
	// Organization
	if (contact.organization) {
		lines.push(`ORG:${escapeVCard(contact.organization)}`)
	}
	
	// Title
	if (contact.title) {
		lines.push(`TITLE:${escapeVCard(contact.title)}`)
	}
	
	// Phone numbers
	if (contact.phones && contact.phones.length > 0) {
		for (const phone of contact.phones) {
			const type = phone.type || 'CELL'
			const formattedPhone = formatPhone(phone.number)
			if (phone.label) {
				lines.push(`TEL;type=${type};type=VOICE;X-ABLabel=${escapeVCard(phone.label)}:${formattedPhone}`)
			} else {
				lines.push(`TEL;type=${type};type=VOICE:${formattedPhone}`)
			}
		}
	}
	
	// Email addresses
	if (contact.emails && contact.emails.length > 0) {
		for (const email of contact.emails) {
			const type = email.type || 'OTHER'
			lines.push(`EMAIL;type=${type}:${email.email}`)
		}
	}
	
	// URLs
	if (contact.urls && contact.urls.length > 0) {
		for (const url of contact.urls) {
			const type = url.type || 'OTHER'
			lines.push(`URL;type=${type}:${url.url}`)
		}
	}
	
	// Addresses
	if (contact.addresses && contact.addresses.length > 0) {
		for (const addr of contact.addresses) {
			const type = addr.type || 'OTHER'
			const parts = [
				'', // PO Box
				'', // Extended address
				addr.street || '',
				addr.city || '',
				addr.state || '',
				addr.postalCode || '',
				addr.country || ''
			].map(p => escapeVCard(p))
			lines.push(`ADR;type=${type}:${parts.join(';')}`)
		}
	}
	
	// Birthday
	if (contact.birthday) {
		lines.push(`BDAY:${contact.birthday}`)
	}
	
	// Notes
	if (contact.note) {
		lines.push(`NOTE:${escapeVCard(contact.note)}`)
	}
	
	// vCard footer
	lines.push('END:VCARD')
	
	return lines.join('\r\n')
}

/**
 * Generate multiple vCards (for contact array)
 */
export const generateVCards = (contacts: VCardContact[]): string => {
	return contacts.map(generateVCard).join('\r\n')
}

/**
 * Parse vCard string to contact data (basic parser)
 */
export const parseVCard = (vcard: string): Partial<VCardContact> => {
	const contact: Partial<VCardContact> = {}
	const lines = vcard.split(/\r?\n/)
	
	for (const line of lines) {
		const [key, ...valueParts] = line.split(':')
		if (!key) continue
		const value = valueParts.join(':')
		
		if (key.startsWith('FN')) {
			contact.fullName = value.replace(/\\([;,n\\])/g, '$1').replace(/\\n/g, '\n')
		} else if (key.startsWith('ORG')) {
			contact.organization = value.replace(/\\([;,n\\])/g, '$1')
		} else if (key.startsWith('TITLE')) {
			contact.title = value.replace(/\\([;,n\\])/g, '$1')
		} else if (key.startsWith('TEL')) {
			contact.phones = contact.phones || []
			const typeMatch = key.match(/type=(\w+)/i)
			const phoneType = (typeMatch?.[1]?.toUpperCase() || 'CELL') as 'CELL' | 'WORK' | 'HOME' | 'MAIN' | 'FAX' | 'PAGER'
			contact.phones.push({
				number: value,
				type: phoneType
			})
		} else if (key.startsWith('EMAIL')) {
			contact.emails = contact.emails || []
			const typeMatch = key.match(/type=(\w+)/i)
			contact.emails.push({
				email: value,
				type: (typeMatch?.[1]?.toUpperCase() as 'WORK' | 'HOME' | 'OTHER') || 'OTHER'
			})
		} else if (key.startsWith('BDAY')) {
			contact.birthday = value
		} else if (key.startsWith('NOTE')) {
			contact.note = value.replace(/\\n/g, '\n')
		}
	}
	
	return contact
}

/**
 * Create a simple contact card message content
 */
export const createContactCard = (contact: VCardContact): { 
	contacts: { 
		displayName: string
		contacts: Array<{ vcard: string }>
	} 
} => {
	return {
		contacts: {
			displayName: contact.displayName || contact.fullName,
			contacts: [{ vcard: generateVCard(contact) }]
		}
	}
}

/**
 * Create a contact array message content
 */
export const createContactCards = (contacts: VCardContact[]): { 
	contacts: { 
		displayName: string
		contacts: Array<{ vcard: string }>
	} 
} => {
	const firstContact = contacts[0]
	return {
		contacts: {
			displayName: contacts.length === 1 && firstContact
				? (firstContact.displayName || firstContact.fullName)
				: `${contacts.length} Contacts`,
			contacts: contacts.map(c => ({ vcard: generateVCard(c) }))
		}
	}
}

/**
 * Quick helper to create contact from phone number
 */
export const quickContact = (
	name: string, 
	phone: string, 
	options?: { organization?: string; email?: string }
): VCardContact => {
	return {
		fullName: name,
		phones: [{ number: phone, type: 'CELL' }],
		organization: options?.organization,
		emails: options?.email ? [{ email: options.email, type: 'WORK' }] : undefined
	}
}
