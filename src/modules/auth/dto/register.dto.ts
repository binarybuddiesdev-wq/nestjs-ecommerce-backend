import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {

    @ApiProperty({ example: 'OJAS GAMBHEERA' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ example: 'strongPassword123' })
    @IsString()
    @MinLength(8)
    @IsNotEmpty()
    password!: string;

};
