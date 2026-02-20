import { Transformer } from '@napi-rs/image';
import { ConfigService } from '../common/configs/config.service';
import { inject, injectable } from '@needle-di/core';

@injectable()
export class ImagesService {
	constructor(private configService = inject(ConfigService)) {}

	private async resize(
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
}
