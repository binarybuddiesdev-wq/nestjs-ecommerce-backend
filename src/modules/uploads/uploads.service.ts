import { PinoLogger } from 'nestjs-pino';
import { Injectable } from '@nestjs/common';

import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

@Injectable()
export class UploadsService {

    constructor(
        private readonly logger: PinoLogger,
        private readonly cloudinaryService: CloudinaryService
    ) { }

    async uploadImages(filePaths: string[]) {
        const urls: string[] = [];
        for (const filePath of filePaths) {
            const url = await this.cloudinaryService.uploadImage(filePath);
            urls.push(url);
        }
        this.logger.info({ urls }, 'Images uploaded successfully');
        return urls;
    }

}
