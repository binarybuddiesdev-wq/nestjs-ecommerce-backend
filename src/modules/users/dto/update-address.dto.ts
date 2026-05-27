import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateAddressDto {

    @ApiPropertyOptional({ example: 'Home' })
    @IsString()
    @IsOptional()
    label?: string;

    @ApiPropertyOptional({ example: '123 Main Street' })
    @IsString()
    @IsOptional()
    street?: string;

    @ApiPropertyOptional({ example: 'Hyderabad' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ example: 'Andhra Pradesh' })
    @IsString()
    @IsOptional()
    state?: string;

    @ApiPropertyOptional({ example: '560001' })
    @IsString()
    @IsOptional()
    zipCode?: string;

    @ApiPropertyOptional({ example: 'INDIA' })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ example: false })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;

}