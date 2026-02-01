/**
 * Baileys-Joss: Status/Story Posting
 * 
 * Fitur untuk posting status WhatsApp
 */

import { randomBytes } from 'crypto'
import type { AnyMessageContent } from '../Types'

export type StatusType = 'text' | 'image' | 'video' | 'audio'

export interface TextStatusOptions {
	/** Status text content */
	text: string
	/** Background color (hex) */
	backgroundColor?: string
	/** Font type (0-9) */
	font?: number
	/** Text color (hex) */
	textColor?: string
}

export interface MediaStatusOptions {
	/** Media buffer or URL */
	media: Buffer | string
	/** Caption */
	caption?: string
	/** View once */
	viewOnce?: boolean
}

export interface StatusPostResult {
	messageId: string
	timestamp: Date
	type: StatusType
}

/**
 * Pre-defined background colors for text status
 */
export const STATUS_BACKGROUNDS = {
	solid: {
		green: '#25D366',
		blue: '#34B7F1',
		purple: '#8B5CF6',
		red: '#EF4444',
		orange: '#F97316',
		yellow: '#EAB308',
		pink: '#EC4899',
		teal: '#14B8A6',
		gray: '#6B7280',
		black: '#000000',
		white: '#FFFFFF'
	},
	gradient: {
		sunset: ['#F97316', '#EF4444'],
		ocean: ['#3B82F6', '#06B6D4'],
		forest: ['#22C55E', '#10B981'],
		purple: ['#8B5CF6', '#EC4899'],
		midnight: ['#1E3A8A', '#4C1D95'],
		aurora: ['#06B6D4', '#8B5CF6', '#EC4899']
	}
}

/**
 * Font types for text status (0-9)
 */
export const STATUS_FONTS = {
	SANS_SERIF: 0,
	SERIF: 1,
	NORICAN: 2,
	BRYNDAN: 3,
	BEBASNEUE: 4,
	OSWALD: 5,
	DAMION: 6,
	DANCING: 7,
	COMFORTAA: 8,
	EXOTWO: 9
}

/**
 * Generate random message ID for status
 */
export const generateStatusMessageId = (): string => {
	return `3EB0${randomBytes(16).toString('hex').toUpperCase()}`
}

/**
 * Create text status content
 */
export const createTextStatus = (options: TextStatusOptions): AnyMessageContent => {
	const backgroundColor = options.backgroundColor || STATUS_BACKGROUNDS.solid.green
	const font = options.font ?? STATUS_FONTS.SANS_SERIF
	const textColor = options.textColor || '#FFFFFF'

	return {
		text: options.text,
		backgroundColor,
		font,
		contextInfo: {
			mentionedJid: [],
			isForwarded: false
		}
	} as any
}

/**
 * Create image status content
 */
export const createImageStatus = (
	media: Buffer | string,
	options?: { caption?: string; viewOnce?: boolean }
): AnyMessageContent => {
	const content: any = {
		image: typeof media === 'string' ? { url: media } : media,
		caption: options?.caption
	}

	if (options?.viewOnce) {
		content.viewOnce = true
	}

	return content
}

/**
 * Create video status content
 */
export const createVideoStatus = (
	media: Buffer | string,
	options?: { caption?: string; viewOnce?: boolean; gifPlayback?: boolean }
): AnyMessageContent => {
	const content: any = {
		video: typeof media === 'string' ? { url: media } : media,
		caption: options?.caption,
		gifPlayback: options?.gifPlayback
	}

	if (options?.viewOnce) {
		content.viewOnce = true
	}

	return content
}

/**
 * Create audio status content
 */
export const createAudioStatus = (
	media: Buffer | string,
	options?: { ptt?: boolean }
): AnyMessageContent => {
	return {
		audio: typeof media === 'string' ? { url: media } : media,
		ptt: options?.ptt ?? false
	}
}

/**
 * Status JID constant
 */
export const STATUS_BROADCAST_JID = 'status@broadcast'

/**
 * Create status privacy options
 */
export interface StatusPrivacyOptions {
	/** 'contacts' | 'blacklist' | 'whitelist' */
	type: 'contacts' | 'blacklist' | 'whitelist'
	/** List of JIDs for blacklist/whitelist */
	list?: string[]
}

/**
 * Helper to get status broadcast JID
 */
export const getStatusJid = (): string => STATUS_BROADCAST_JID

/**
 * Quick status helpers
 */
export const StatusHelper = {
	/**
	 * Create a simple text status
	 */
	text: (text: string, backgroundColor?: string): AnyMessageContent => {
		return createTextStatus({ text, backgroundColor })
	},

	/**
	 * Create an image status from buffer
	 */
	image: (buffer: Buffer, caption?: string): AnyMessageContent => {
		return createImageStatus(buffer, { caption })
	},

	/**
	 * Create an image status from URL
	 */
	imageUrl: (url: string, caption?: string): AnyMessageContent => {
		return createImageStatus(url, { caption })
	},

	/**
	 * Create a video status from buffer
	 */
	video: (buffer: Buffer, caption?: string): AnyMessageContent => {
		return createVideoStatus(buffer, { caption })
	},

	/**
	 * Create a video status from URL
	 */
	videoUrl: (url: string, caption?: string): AnyMessageContent => {
		return createVideoStatus(url, { caption })
	},

	/**
	 * Create a GIF status
	 */
	gif: (buffer: Buffer, caption?: string): AnyMessageContent => {
		return createVideoStatus(buffer, { caption, gifPlayback: true })
	},

	/**
	 * Create a voice note status
	 */
	voiceNote: (buffer: Buffer): AnyMessageContent => {
		return createAudioStatus(buffer, { ptt: true })
	}
}
