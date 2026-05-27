import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateCategoryDto {

    @ApiProperty({
        description: 'Category name',
        example: 'Electronics',
        required: true
    })
    @IsNotEmpty()
    @IsString()
    name!: string;

    @ApiProperty({
        description: 'Parent category ID',
        example: '123',
        required: false
    })
    @IsString()
    @IsOptional()
    parentId?: string;

}