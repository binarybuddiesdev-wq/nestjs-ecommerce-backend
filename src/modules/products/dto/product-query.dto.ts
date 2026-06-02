import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";

export class ProductQueryDto {

    @ApiProperty({ example: 'electronics', required: false })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiProperty({ example: 'samsung', required: false })
    @IsString()
    @IsOptional()
    search?: string;

    @ApiProperty({ example: 'Samsung', required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty({ example: '9500', required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    minPrice?: number;

    @ApiProperty({ example: '125000', required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    maxPrice?: number;

    @ApiProperty({ example: 'new-arrival', required: false })
    @IsString()
    @IsOptional()
    tag?: string;

    @ApiProperty({ example: true, required: false })
    @Transform(({ value }) => value === 'true' || value === true || value === '1')
    @IsBoolean()
    @IsOptional()
    inStock?: boolean;

    @ApiProperty({ example: 'price_asc', required: false, enum: ['price_asc', 'price_desc', 'createdAt_asc', 'createdAt_desc', 'name_asc', 'name_desc'] })
    @IsString()
    @IsOptional()
    sort?: string;

    @ApiProperty({ example: 10, required: false })
    @Type(() => Number)
    @IsNumber()
    @IsOptional()
    limit?: number;

    @ApiProperty({ example: '6a194dbae5b0347ce1eb692f', required: false })
    @IsString()
    @IsOptional()
    cursor?: string;

}