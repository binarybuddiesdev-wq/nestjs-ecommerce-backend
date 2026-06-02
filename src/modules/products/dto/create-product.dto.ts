import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {

    @ApiProperty({ example: 'iPhone 15 Pro' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'Latest Apple smartphone with A17 chip' })
    @IsString()
    @IsNotEmpty()
    description!: string;

    @ApiProperty({ example: 99900 })
    @IsNumber()
    @IsNotEmpty()
    price!: number;

    @ApiProperty({ example: 50 })
    @IsNumber()
    @IsNotEmpty()
    stock!: number;

    @ApiProperty({ example: '665abc123...' })
    @IsString()
    @IsNotEmpty()
    categoryId!: string;

    @ApiProperty({ example: 'Samsung', required: false })
    @IsString()
    @IsOptional()
    brand?: string;

    @ApiProperty({ example: ['new-arrival', 'best-seller'], required: false })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiProperty({ example: 129999, required: false })
    @IsNumber()
    @IsOptional()
    compareAtPrice?: number;

    @ApiProperty({ example: 1.5, required: false })
    @IsNumber()
    @IsOptional()
    weight?: number;

    @ApiProperty({ example: '30x20x10 cm', required: false })
    @IsString()
    @IsOptional()
    dimensions?: string;

    @ApiProperty({ example: '2 years manufacturer warranty', required: false })
    @IsString()
    @IsOptional()
    warrantyInfo?: string;

    @ApiProperty({ example: '2027-12-31', required: false })
    @IsDateString()
    @IsOptional()
    expiryDate?: string;

    @ApiProperty({ example: ['temp/file1.jpg', 'temp/file2.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    filePaths?: string[];

}
