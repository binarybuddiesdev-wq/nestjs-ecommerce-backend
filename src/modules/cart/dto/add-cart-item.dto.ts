import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AddCartItemDto {

    @ApiProperty({ description: 'Product ID to add to cart', example: '60f7b1c1c9e7c9a1a8f7b1c1' })
    @IsString()
    @IsNotEmpty()
    productId!: string;

    @ApiProperty({ description: 'Quantity to add', example: 2, minimum: 1 })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Type(() => Number)
    quantity!: number;

}