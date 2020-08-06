import * as Validator from "class-validator";

export class AddAdministratorDto {
    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Matches(/^[a-z][a-z0-9\.]{3,30}[a-z0-9]$/)
    username: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(6, 128)
    //  it would be ideally if we apply some reg ex for password validation: small letters,numbers,capital letters
    password: string;
}