import { BadRequestException, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createWriteStream } from 'node:fs';
import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { randomUUID } from 'node:crypto';
import type { FastifyRequest } from 'fastify';

import { UploadsService } from './uploads.service.js';
import {
    ApiOperation as ApiOperationEnum,
    ApiRoutes,
    ApiTags as ApiTagsEnum,
    NO_FILE_UPLOADED,
    UPLOAD_SUCCESS,
    UploadImagesResponse,
} from '@/common/index.js';

@ApiTags(ApiTagsEnum.UPLOADS)
@Controller(ApiRoutes.UPLOADS)
export class UploadsController {

    constructor(private readonly uploadsService: UploadsService) { }

    @Post()
    @ApiBearerAuth()
    @HttpCode(200)
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                files: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
        },
    })
    @ApiOperation({ summary: ApiOperationEnum.UPLOAD_IMAGES })
    @ApiResponse(UploadImagesResponse)
    async uploadImages(@Req() req: FastifyRequest) {
        const files = req.files();
        const filePaths: string[] = [];

        const tempDir = join(process.cwd(), 'temp');
        await mkdir(tempDir, { recursive: true });

        for await (const file of files) {
            const tempPath = join(tempDir, `${randomUUID()}-${file.filename}`);
            await pipeline(file.file, createWriteStream(tempPath));
            filePaths.push(tempPath);
        }

        if (filePaths.length === 0) {
            throw new BadRequestException(NO_FILE_UPLOADED);
        }

        const data = await this.uploadsService.uploadImages(filePaths);

        for (const filePath of filePaths) {
            await unlink(filePath).catch(() => { });
        }

        return { message: UPLOAD_SUCCESS, data };
    }

}
