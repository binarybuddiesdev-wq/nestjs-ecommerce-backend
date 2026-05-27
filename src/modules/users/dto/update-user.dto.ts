import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateUserDto {

    @ApiPropertyOptional({ description: 'User display name', example: 'John Doe' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiPropertyOptional({ description: 'User avatar URL', example: 'https://example.com/avatar.jpg' })
    @IsString()
    @IsOptional()
    avatar?: string;
}