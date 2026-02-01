/**
 * Baileys-Joss: Voice Note Utilities
 * 
 * Fitur untuk merekam dan mengirim voice note
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

const execAsync = promisify(exec)

export interface VoiceNoteOptions {
	/** Duration in seconds */
	seconds?: number
	/** Audio sample rate (default: 48000) */
	sampleRate?: number
	/** Audio channels (default: 1 for mono) */
	channels?: number
}

export interface AudioConversionOptions {
	/** Target format (default: 'ogg') */
	format?: 'ogg' | 'mp3' | 'wav'
	/** Audio bitrate (default: '64k') */
	bitrate?: string
	/** Sample rate (default: 48000) */
	sampleRate?: number
	/** Audio channels (default: 1) */
	channels?: number
}

/**
 * Check if FFmpeg is available
 */
export const isFFmpegAvailable = async (): Promise<boolean> => {
	try {
		await execAsync('ffmpeg -version')
		return true
	} catch {
		return false
	}
}

/**
 * Get audio duration using FFprobe
 */
const getAudioDuration = async (audioPath: string): Promise<number> => {
	try {
		const { stdout } = await execAsync(
			`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
		)
		return Math.ceil(parseFloat(stdout.trim()))
	} catch {
		return 0
	}
}

/**
 * Get audio duration from buffer
 */
export const getAudioDurationFromBuffer = async (buffer: Buffer): Promise<number> => {
	const tempPath = path.join(os.tmpdir(), `audio_${Date.now()}.tmp`)
	try {
		await fs.promises.writeFile(tempPath, buffer)
		const duration = await getAudioDuration(tempPath)
		return duration
	} finally {
		try {
			await fs.promises.unlink(tempPath)
		} catch {}
	}
}

/**
 * Convert audio to Opus OGG format (required for WhatsApp voice notes)
 */
export const convertToOpusOgg = async (
	input: Buffer | string,
	options: AudioConversionOptions = {}
): Promise<Buffer> => {
	const isBuffer = Buffer.isBuffer(input)
	const inputPath = isBuffer 
		? path.join(os.tmpdir(), `input_${Date.now()}.tmp`)
		: input
	const outputPath = path.join(os.tmpdir(), `output_${Date.now()}.ogg`)

	try {
		// Write buffer to temp file if needed
		if (isBuffer) {
			await fs.promises.writeFile(inputPath, input)
		}

		const sampleRate = options.sampleRate || 48000
		const channels = options.channels || 1
		const bitrate = options.bitrate || '64k'

		// Convert using FFmpeg
		await execAsync(
			`ffmpeg -y -i "${inputPath}" -ar ${sampleRate} -ac ${channels} -b:a ${bitrate} -c:a libopus "${outputPath}"`
		)

		const outputBuffer = await fs.promises.readFile(outputPath)
		return outputBuffer

	} finally {
		// Cleanup temp files
		try {
			if (isBuffer) await fs.promises.unlink(inputPath)
			await fs.promises.unlink(outputPath)
		} catch {}
	}
}

/**
 * Convert audio to MP3 format
 */
export const convertToMp3 = async (
	input: Buffer | string,
	options: AudioConversionOptions = {}
): Promise<Buffer> => {
	const isBuffer = Buffer.isBuffer(input)
	const inputPath = isBuffer 
		? path.join(os.tmpdir(), `input_${Date.now()}.tmp`)
		: input
	const outputPath = path.join(os.tmpdir(), `output_${Date.now()}.mp3`)

	try {
		if (isBuffer) {
			await fs.promises.writeFile(inputPath, input)
		}

		const sampleRate = options.sampleRate || 44100
		const channels = options.channels || 2
		const bitrate = options.bitrate || '128k'

		await execAsync(
			`ffmpeg -y -i "${inputPath}" -ar ${sampleRate} -ac ${channels} -b:a ${bitrate} "${outputPath}"`
		)

		return await fs.promises.readFile(outputPath)

	} finally {
		try {
			if (isBuffer) await fs.promises.unlink(inputPath)
			await fs.promises.unlink(outputPath)
		} catch {}
	}
}

/**
 * Create voice note message content
 */
export const createVoiceNote = async (
	audio: Buffer | string,
	options: VoiceNoteOptions = {}
): Promise<{
	audio: Buffer
	ptt: true
	seconds: number
	mimetype: string
}> => {
	let audioBuffer: Buffer

	// Load audio if it's a file path
	if (typeof audio === 'string') {
		audioBuffer = await fs.promises.readFile(audio)
	} else {
		audioBuffer = audio
	}

	// Get or calculate duration
	let seconds = options.seconds
	if (!seconds) {
		seconds = await getAudioDurationFromBuffer(audioBuffer)
	}

	// Convert to Opus OGG format for WhatsApp compatibility
	const hasFFmpeg = await isFFmpegAvailable()
	if (hasFFmpeg) {
		audioBuffer = await convertToOpusOgg(audioBuffer, {
			sampleRate: options.sampleRate,
			channels: options.channels
		})
	}

	return {
		audio: audioBuffer,
		ptt: true,
		seconds: seconds || 1,
		mimetype: 'audio/ogg; codecs=opus'
	}
}

/**
 * Create regular audio message (not voice note)
 */
export const createAudioMessage = async (
	audio: Buffer | string,
	options: VoiceNoteOptions = {}
): Promise<{
	audio: Buffer
	ptt: false
	seconds: number
	mimetype: string
}> => {
	let audioBuffer: Buffer

	if (typeof audio === 'string') {
		audioBuffer = await fs.promises.readFile(audio)
	} else {
		audioBuffer = audio
	}

	let seconds = options.seconds
	if (!seconds) {
		seconds = await getAudioDurationFromBuffer(audioBuffer)
	}

	return {
		audio: audioBuffer,
		ptt: false,
		seconds: seconds || 1,
		mimetype: 'audio/mp4'
	}
}

/**
 * Voice note helper for quick usage
 */
export const VoiceNoteHelper = {
	/**
	 * Create PTT voice note from buffer
	 */
	fromBuffer: async (buffer: Buffer, seconds?: number) => {
		return createVoiceNote(buffer, { seconds })
	},

	/**
	 * Create PTT voice note from file
	 */
	fromFile: async (filePath: string) => {
		return createVoiceNote(filePath)
	},

	/**
	 * Create regular audio from buffer
	 */
	audioFromBuffer: async (buffer: Buffer, seconds?: number) => {
		return createAudioMessage(buffer, { seconds })
	},

	/**
	 * Create regular audio from file
	 */
	audioFromFile: async (filePath: string) => {
		return createAudioMessage(filePath)
	},

	/**
	 * Check FFmpeg availability
	 */
	checkFFmpeg: isFFmpegAvailable,

	/**
	 * Get audio duration
	 */
	getDuration: getAudioDurationFromBuffer,

	/**
	 * Convert to Opus OGG
	 */
	toOpus: convertToOpusOgg,

	/**
	 * Convert to MP3
	 */
	toMp3: convertToMp3
}
