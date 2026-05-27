import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class UpdateCategoryDto {

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        example: 'Electronics'
    })
    name?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        example: 'electronics'
    })
    slug?: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        required: false,
        example: true
    })
    isActive?: boolean;

}