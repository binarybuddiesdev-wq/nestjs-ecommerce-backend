import { Body, Controller, Delete, Get, HttpCode, Param, Patch } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
    ApiOperation as ApiOperationEnum, ApiRoutes, ApiTags as ApiTagsEnum, CurrentUser, DELETE_ADMIN_USER_SUCCESS, DeleteAdminUserResponse, LIST_ALL_USERS_SUCCESS,
    ListAllUsersResponse, Roles, UPDATE_USER_ROLE_SUCCESS,
    UpdateUserRoleResponse
} from "@/common/index.js";
import { UpdateUserRoleDto } from "./dto/index.js";
import { UserRole } from "@/types/index.js";

@ApiTags(ApiTagsEnum.USERS)
@Controller(ApiRoutes.ADMIN_USERS)
export class AdminUsersController {
    constructor(private readonly usersService: UsersService) { }

    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @Get()
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.ADMIN_LIST_USERS })
    @ApiResponse(ListAllUsersResponse)
    async listAllUsers() {
        const data = await this.usersService.listAllUsers();
        return { message: LIST_ALL_USERS_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Patch(ApiRoutes.ADMIN_USER_ROLE)
    @Roles(UserRole.ADMIN)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.ADMIN_UPDATE_USER_ROLE })
    @ApiResponse(UpdateUserRoleResponse)
    async adminUpdateRole(@Param('id') userId: string, @Body() dto: UpdateUserRoleDto) {
        const data = await this.usersService.adminUpdateRole(userId, dto);
        return { message: UPDATE_USER_ROLE_SUCCESS, data }
    }

    @ApiBearerAuth()
    @Roles(UserRole.ADMIN)
    @Delete(ApiRoutes.ADMIN_USER_BY_ID)
    @HttpCode(200)
    @ApiOperation({ summary: ApiOperationEnum.ADMIN_DELETE_USER })
    @ApiResponse(DeleteAdminUserResponse)
    async adminDeleteUser(@Param('id') userId: string) {
        await this.usersService.adminDeleteUser(userId);
        return { message: DELETE_ADMIN_USER_SUCCESS, data: {} }
    }
}