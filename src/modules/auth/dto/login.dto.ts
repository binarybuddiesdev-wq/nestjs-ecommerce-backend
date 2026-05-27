import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {

    @ApiProperty({ example: 'ojas@gmail.com' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ example: 'Ojasgambheera@123' })
    @IsString()
    @IsNotEmpty()
    password!: string;

};
