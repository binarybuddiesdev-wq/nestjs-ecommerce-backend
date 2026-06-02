import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SetRelatedProductsDto {

    @ApiProperty({
        description: 'Array of product IDs to set as related',
        example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
    })
    @IsArray()
    @IsString({ each: true })
    relatedProductIds!: string[];

}