import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CategoriesController } from './categories.controller.js';
import { PublicCategoriesController } from './public-categories.controller.js';

@Module({
  providers: [CategoriesService],
  controllers: [CategoriesController, PublicCategoriesController]
})
export class CategoriesModule {}
