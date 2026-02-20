import { Transformer } from '@napi-rs/image';
import { ConfigService } from '../common/configs/config.service';
import { inject, injectable } from '@needle-di/core';

@injectable()
export class ImagesService {
  constructor(private configService = inject(ConfigService)) {
  }

  private async resize(fileBuffer: Buffer, resizeOptions: { width?: number; height?: number; fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside' }) {
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
}
