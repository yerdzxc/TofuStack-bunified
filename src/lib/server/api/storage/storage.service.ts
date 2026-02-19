import { inject, injectable } from '@needle-di/core';
import { S3Client } from 'bun';
import { ConfigService } from '../common/configs/config.service';
import { generateId } from '../common/utils/crypto';
import sharp, { type ResizeOptions } from 'sharp';

type Upload = {
	file: File;
	key?: string;
	resizeOptions?: ResizeOptions;
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

	private async resizeImage(fileBuffer: Buffer, resizeOptions: ResizeOptions) {
		return sharp(fileBuffer).resize(resizeOptions).toBuffer();
	}

	private async convertToBuffer(file: File) {
		const arrayBuffer = await file.arrayBuffer();
		return Buffer.from(arrayBuffer);
	}
}
