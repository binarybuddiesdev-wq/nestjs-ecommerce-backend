import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { vi } from 'vitest';

import { UploadsService } from './uploads.service.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service.js';

describe('UploadsService', () => {
  let service: UploadsService;

  const mockLogger = {
    info: vi.fn(),
  };

  const mockCloudinaryService = {
    uploadImage: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadsService,
        { provide: PinoLogger, useValue: mockLogger },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<UploadsService>(UploadsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

