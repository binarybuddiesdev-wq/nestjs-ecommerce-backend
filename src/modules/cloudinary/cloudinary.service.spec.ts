import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { vi, describe, beforeEach, it, expect } from 'vitest';
import { v2 as cloudinary } from 'cloudinary';

import { CloudinaryService } from './cloudinary.service.js';

// Mock cloudinary library
vi.mock('cloudinary', () => {
  return {
    v2: {
      config: vi.fn(),
      uploader: {
        upload: vi.fn(),
      },
    },
  };
});

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'CLOUDINARY_CLOUD_NAME') return 'name';
              if (key === 'CLOUDINARY_API_KEY') return 'key';
              if (key === 'CLOUDINARY_API_SECRET') return 'secret';
              return null;
            }
          }
        }
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadImage', () => {
    it('should upload file to cloudinary and return secure_url', async () => {
      vi.mocked(cloudinary.uploader.upload).mockResolvedValue({
        secure_url: 'https://cloudinary/image.jpg',
      } as any);

      const result = await service.uploadImage('temp-path/image.jpg');

      expect(result).toBe('https://cloudinary/image.jpg');
      expect(cloudinary.uploader.upload).toHaveBeenCalledWith('temp-path/image.jpg', {
        folder: 'ecommerce',
      });
    });
  });
});
