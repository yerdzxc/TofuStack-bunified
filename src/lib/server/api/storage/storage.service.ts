import { inject, injectable } from '@needle-di/core';
import { S3Client } from 'bun';
import { Transformer } from '@napi-rs/image';
import { ConfigService } from '../common/configs/config.service';
import { generateId } from '../common/utils/crypto';

type Upload = {
	file: File;
	key?: string;
	resizeOptions?: {
		width?: number;
		height?: number;
		fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
	};
};

@injectable()
export class StorageService {
	private readonly s3Client: S3Client;
	private readonly bucket: string;

	constructor(private configService = inject(ConfigService)) {
		this.bucket = this.configService.envs.STORAGE_BUCKET || 'dev';
		this.s3Client = new S3Client({
			endpoint: this.configService.envs.STORAGE_HOST,
			port: this.configService.envs.STORAGE_PORT,
			accessKeyId: this.configService.envs.STORAGE_ACCESS_KEY,
			secretAccessKey: this.configService.envs.STORAGE_SECRET_KEY,
			region: 'garage',
			forcePathStyle: true
		});
	}

	async configure() {
		console.info(`Storage configured with S3 bucket: ${this.bucket}`);
	}

	async upload({ file, resizeOptions, key }: Upload) {
		let buffer = await this.convertToBuffer(file);
		if (resizeOptions) {
			buffer = await this.resizeImage(buffer, resizeOptions);
		}

		const fileKey = key || generateId();

		await this.s3Client.write(`s3://${this.bucket}/${fileKey}`, buffer, {
			contentType: file.type
		});

		return { key: fileKey };
	}

	async remove(key: string) {
		await this.s3Client.unlink(`s3://${this.bucket}/${key}`);
	}

	private async resizeImage(fileBuffer: Buffer, resizeOptions: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' }) {
		const transformer = new Transformer(fileBuffer);
		const metadata = await transformer.metadata();
		
		const width = resizeOptions.width ?? 0;
		const height = resizeOptions.height ?? 0;
		
		let resized = transformer.resize(width, height);
		
		switch (metadata.format) {
			case 'png':
				return resized.png();
			case 'jpeg':
			case 'jpg':
				return resized.jpeg(90);
			case 'webp':
				return resized.webp(90);
			case 'avif':
				return resized.avif({ quality: 90 });
			case 'gif':
				return resized.png();
			default:
				return resized.png();
		}
	}

	private async convertToBuffer(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}
}
