/**
 * Baileys-Joss: Media Downloader
 * 
 * Download semua media dari chat
 */

import * as fs from 'fs'
import * as path from 'path'
import type { WAMessage } from '../Types'
import { downloadMediaMessage } from './messages'

export type DownloadMediaType = 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'all'

export interface DownloadOptions {
	/** Output directory */
	outputDir: string
	/** Media types to download */
	types?: DownloadMediaType[]
	/** Create subfolder for each type */
	createSubfolders?: boolean
	/** Custom filename template */
	filenameTemplate?: string
	/** Skip existing files */
	skipExisting?: boolean
	/** Maximum file size in bytes (0 = no limit) */
	maxFileSize?: number
	/** Progress callback */
	onProgress?: (current: number, total: number, filename: string) => void
	/** Error callback */
	onError?: (message: WAMessage, error: Error) => void
	/** Delay between downloads in ms */
	delay?: number
}

export interface DownloadResult {
	messageId: string
	type: DownloadMediaType
	filename: string
	filepath: string
	size: number
	success: boolean
	error?: string
}

export interface DownloadSummary {
	total: number
	successful: number
	failed: number
	skipped: number
	totalSize: number
	results: DownloadResult[]
	startedAt: Date
	completedAt: Date
}

/**
 * Get media type from message
 */
const getMediaType = (message: WAMessage): DownloadMediaType | null => {
	const content = message.message
	if (!content) return null

	if (content.imageMessage) return 'image'
	if (content.videoMessage) return 'video'
	if (content.audioMessage) return 'audio'
	if (content.documentMessage) return 'document'
	if (content.stickerMessage) return 'sticker'

	return null
}

/**
 * Get file extension for media type
 */
const getExtension = (message: WAMessage): string => {
	const content = message.message
	if (!content) return ''

	if (content.imageMessage) {
		const mime = content.imageMessage.mimetype || 'image/jpeg'
		if (mime.includes('png')) return '.png'
		if (mime.includes('gif')) return '.gif'
		if (mime.includes('webp')) return '.webp'
		return '.jpg'
	}
	if (content.videoMessage) {
		const mime = content.videoMessage.mimetype || 'video/mp4'
		if (mime.includes('3gp')) return '.3gp'
		if (mime.includes('webm')) return '.webm'
		return '.mp4'
	}
	if (content.audioMessage) {
		const mime = content.audioMessage.mimetype || 'audio/ogg'
		if (mime.includes('mp3') || mime.includes('mpeg')) return '.mp3'
		if (mime.includes('mp4')) return '.m4a'
		if (mime.includes('wav')) return '.wav'
		return '.ogg'
	}
	if (content.documentMessage) {
		const filename = content.documentMessage.fileName
		if (filename) {
			const ext = path.extname(filename)
			if (ext) return ext
		}
		return '.bin'
	}
	if (content.stickerMessage) {
		if (content.stickerMessage.isAnimated) return '.webp'
		return '.webp'
	}

	return ''
}

/**
 * Generate filename from template
 */
const generateFilename = (
	message: WAMessage,
	type: DownloadMediaType,
	template?: string
): string => {
	const ts = message.messageTimestamp
	const timestamp = ts ? (typeof ts === 'number' ? ts : Number(ts)) : Date.now() / 1000
	const date = new Date(timestamp * 1000)
	const id = message.key.id || 'unknown'
	const ext = getExtension(message)

	// Get original filename for documents
	let originalName = ''
	if (message.message?.documentMessage?.fileName) {
		originalName = path.basename(
			message.message.documentMessage.fileName,
			path.extname(message.message.documentMessage.fileName)
		)
	}

	if (template) {
		const dateStr = date.toISOString().split('T')[0] || ''
		const timeStr = (date.toTimeString().split(' ')[0] || '').replace(/:/g, '-')
		return template
			.replace('{id}', id)
			.replace('{type}', type)
			.replace('{timestamp}', timestamp.toString())
			.replace('{date}', dateStr)
			.replace('{time}', timeStr)
			.replace('{originalName}', originalName || id)
			.replace('{ext}', ext)
	}

	// Default format: type_date_time_id.ext
	const dateStr = date.toISOString().split('T')[0] || ''
	const timeStr = (date.toTimeString().split(' ')[0] || '').replace(/:/g, '-')

	return `${type}_${dateStr}_${timeStr}_${id.substring(0, 8)}${ext}`
}

/**
 * Sleep helper
 */
const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

/**
 * Media Downloader
 */
export class MediaDownloader {
	private getMessage: (key: { remoteJid: string; id: string }) => Promise<WAMessage | undefined>

	constructor(
		getMessage: (key: { remoteJid: string; id: string }) => Promise<WAMessage | undefined>
	) {
		this.getMessage = getMessage
	}

	/**
	 * Filter messages that have downloadable media
	 */
	filterMediaMessages(messages: WAMessage[], types: DownloadMediaType[] = ['all']): WAMessage[] {
		return messages.filter(msg => {
			const type = getMediaType(msg)
			if (!type) return false
			if (types.includes('all')) return true
			return types.includes(type)
		})
	}

	/**
	 * Download media from a single message
	 */
	async downloadSingle(
		message: WAMessage,
		outputDir: string,
		options: Omit<DownloadOptions, 'outputDir'> = {}
	): Promise<DownloadResult> {
		const type = getMediaType(message)
		const result: DownloadResult = {
			messageId: message.key.id || 'unknown',
			type: type || 'all',
			filename: '',
			filepath: '',
			size: 0,
			success: false
		}

		if (!type) {
			result.error = 'No media in message'
			return result
		}

		try {
			// Generate filename
			const filename = generateFilename(message, type, options.filenameTemplate)
			result.filename = filename

			// Determine output path
			let outputPath = outputDir
			if (options.createSubfolders) {
				outputPath = path.join(outputDir, type + 's') // images, videos, etc.
			}

			// Ensure directory exists
			await fs.promises.mkdir(outputPath, { recursive: true })

			const filepath = path.join(outputPath, filename)
			result.filepath = filepath

			// Skip if exists
			if (options.skipExisting) {
				try {
					await fs.promises.access(filepath)
					result.success = true
					result.error = 'Skipped (already exists)'
					return result
				} catch {
					// File doesn't exist, continue
				}
			}

			// Download media
			const buffer = await downloadMediaMessage(
				message,
				'buffer',
				{},
				{
					logger: console as any,
					reuploadRequest: async () => message
				}
			)

			if (!buffer || !(buffer instanceof Buffer)) {
				throw new Error('Failed to download media')
			}

			// Check file size
			if (options.maxFileSize && options.maxFileSize > 0 && buffer.length > options.maxFileSize) {
				result.error = `File too large (${buffer.length} bytes)`
				return result
			}

			// Save file
			await fs.promises.writeFile(filepath, buffer)
			result.size = buffer.length
			result.success = true

		} catch (error) {
			result.error = (error as Error).message
			options.onError?.(message, error as Error)
		}

		return result
	}

	/**
	 * Download media from multiple messages
	 */
	async downloadMultiple(
		messages: WAMessage[],
		options: DownloadOptions
	): Promise<DownloadSummary> {
		const types = options.types || ['all']
		const mediaMessages = this.filterMediaMessages(messages, types)

		const summary: DownloadSummary = {
			total: mediaMessages.length,
			successful: 0,
			failed: 0,
			skipped: 0,
			totalSize: 0,
			results: [],
			startedAt: new Date(),
			completedAt: new Date()
		}

		for (let i = 0; i < mediaMessages.length; i++) {
			const msg = mediaMessages[i]
			if (!msg) continue

			const result = await this.downloadSingle(msg, options.outputDir, options)
			summary.results.push(result)

			if (result.success) {
				if (result.error?.includes('Skipped')) {
					summary.skipped++
				} else {
					summary.successful++
					summary.totalSize += result.size
				}
			} else {
				summary.failed++
			}

			options.onProgress?.(i + 1, mediaMessages.length, result.filename)

			// Delay between downloads
			if (options.delay && i < mediaMessages.length - 1) {
				await sleep(options.delay)
			}
		}

		summary.completedAt = new Date()
		return summary
	}

	/**
	 * Download all media from a chat
	 */
	async downloadFromChat(
		jid: string,
		messages: WAMessage[],
		options: Omit<DownloadOptions, 'outputDir'> & { outputDir?: string }
	): Promise<DownloadSummary> {
		// Create output directory based on JID
		const sanitizedJid = jid.replace(/[^a-zA-Z0-9]/g, '_')
		const outputDir = options.outputDir || path.join(process.cwd(), 'downloads', sanitizedJid)

		return this.downloadMultiple(messages, {
			...options,
			outputDir
		})
	}
}

/**
 * Create media downloader
 */
export const createMediaDownloader = (
	getMessage: (key: { remoteJid: string; id: string }) => Promise<WAMessage | undefined>
): MediaDownloader => {
	return new MediaDownloader(getMessage)
}

/**
 * Quick download helper
 */
export const downloadAllMedia = async (
	messages: WAMessage[],
	outputDir: string,
	options?: Omit<DownloadOptions, 'outputDir'>
): Promise<DownloadSummary> => {
	const downloader = new MediaDownloader(async () => undefined)
	return downloader.downloadMultiple(messages, { ...options, outputDir })
}
