import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateAddressDto {

    @ApiProperty({ example: 'Home' })
    @IsString()
    @IsNotEmpty()
    label!: string;

    @ApiProperty({ example: '123 Main Street' })
    @IsString()
    @IsNotEmpty()
    street!: string;

    @ApiProperty({ example: 'Hyderabad' })
    @IsString()
    @IsNotEmpty()
    city!: string;

    @ApiProperty({ example: 'Andhra Pradesh' })
    @IsString()
    @IsNotEmpty()
    state!: string;

    @ApiProperty({ example: '560001' })
    @IsString()
    @IsNotEmpty()
    zipCode!: string;

    @ApiProperty({ example: 'INDIA' })
    @IsString()
    @IsNotEmpty()
    country!: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

}