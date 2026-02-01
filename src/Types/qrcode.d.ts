/**
 * Type declarations for qrcode module (optional dependency)
 */
declare module 'qrcode' {
	export interface QRCodeOptions {
		type?: 'terminal' | 'svg' | 'utf8'
		errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
		margin?: number
		small?: boolean
		width?: number
		color?: {
			dark?: string
			light?: string
		}
	}

	export interface QRCodeToDataURLOptions extends QRCodeOptions {
		type?: 'image/png' | 'image/jpeg' | 'image/webp'
	}

	export function toString(data: string, options?: QRCodeOptions): Promise<string>
	export function toDataURL(data: string, options?: QRCodeOptions): Promise<string>
	export function toBuffer(data: string, options?: QRCodeOptions): Promise<Buffer>
	export function toFile(path: string, data: string, options?: QRCodeOptions): Promise<void>
}
