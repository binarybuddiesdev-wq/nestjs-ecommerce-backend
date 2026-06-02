import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {

    constructor(private readonly configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
        });
    }

    async uploadImage(filePath: string): Promise<string> {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                folder: 'ecommerce',
            });
            return result.secure_url;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown upload error';
            if (message.includes('Invalid image file')) {
                throw new BadRequestException('Uploaded file must be a valid image');
            }
            throw new InternalServerErrorException(`Image upload failed: ${message}`);
        }
    }

}
