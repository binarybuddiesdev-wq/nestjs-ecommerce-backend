import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class RemoveCartItemsDto {

    @ApiProperty({ type: [String], example: ['60f7b1c1c9e7c9a1a8f7b1c1', '60f7b1c1c9e7c9a1a8f7b1c2'] })
    @IsArray()
    @IsNotEmpty()
    @IsString({ each: true })
    productIds!: string[];

}