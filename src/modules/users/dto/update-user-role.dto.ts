import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty } from "class-validator";
import { UserRole } from "@/types/index.js";

export class UpdateUserRoleDto {

    @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role!: UserRole;

}