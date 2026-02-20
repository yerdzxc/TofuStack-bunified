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
	private _s3Client: S3Client | undefined;
	private _bucket: string | undefined;

	constructor(private configService = inject(ConfigService)) {}

	private get s3Client() {
		if (!this._s3Client) {
			const envs = this.configService.envs;
			this._bucket = envs.STORAGE_BUCKET || 'dev';
			this._s3Client = new S3Client({
				endpoint: envs.STORAGE_HOST,
				port: envs.STORAGE_PORT,
				accessKeyId: envs.STORAGE_ACCESS_KEY,
				secretAccessKey: envs.STORAGE_SECRET_KEY,
				region: 'garage',
				forcePathStyle: true
			});
		}
		return this._s3Client;
	}

	private get bucket() {
		if (!this._bucket) {
			this._bucket = this.configService.envs.STORAGE_BUCKET || 'dev';
		}
		return this._bucket;
	}

	async configure() {
		console.info(`Storage configured with S3 bucket: ${this.bucket}`);
	}

	async upload({ file, resizeOptions, key }: Upload) {
		let buffer = await this.convertToBuffer(file);
		if (resizeOptions) {
			buffer = await this.resizeImage(buffer, resizeOptions, file.type);
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

	private async resizeImage(
		fileBuffer: Buffer,
		resizeOptions: {
			width?: number;
			height?: number;
			fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
		},
		contentType: string
	) {
		const transformer = new Transformer(fileBuffer);
		const width = resizeOptions.width ?? 0;
		const height = resizeOptions.height ?? 0;
		const resized = transformer.resize(width, height);

		switch (contentType) {
			case 'image/jpeg':
				return resized.jpeg(90);
			case 'image/webp':
				return resized.webp(90);
			case 'image/avif':
				return resized.avif({ quality: 90 });
			case 'image/png':
			case 'image/gif':
			default:
				return resized.png();
		}
	}

	private async convertToBuffer(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}
}
