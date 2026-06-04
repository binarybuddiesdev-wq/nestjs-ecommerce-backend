import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {

    @ApiProperty({ description: 'New quantity for the cart item', example: 3, minimum: 1 })
    @IsNumber()
    @IsNotEmpty()
    @Min(1)
    @Type(() => Number)
    quantity!: number;

}
