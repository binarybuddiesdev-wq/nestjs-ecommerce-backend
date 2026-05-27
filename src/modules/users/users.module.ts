import { Module } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UsersController } from './users.controller.js';
import { AdminUsersController } from './admin-users.controller.js';

@Module({
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService]
})
export class UsersModule { }
