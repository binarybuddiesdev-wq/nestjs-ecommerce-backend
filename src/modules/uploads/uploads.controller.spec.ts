import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';

import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

describe('UploadsController', () => {
  let controller: UploadsController;

  const mockUploadsService = {
    uploadImages: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadsController],
      providers: [
        { provide: UploadsService, useValue: mockUploadsService },
      ],
    }).compile();

    controller = module.get<UploadsController>(UploadsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

