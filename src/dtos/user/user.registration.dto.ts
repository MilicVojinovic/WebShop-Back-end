import * as Validator from "class-validator";

export class UserRegistrationDto {

    @Validator.IsNotEmpty()
    @Validator.IsEmail({
        allow_ip_domain: false,  // we don't want domain like : mvojinovic@127.0.0.1
        allow_utf8_local_part: true,
        require_tld: true,  //we want Top Level Domain e-mails, not like : mvojinovic@localhost or something else locally , eg in house company mail that can't be access via www..... 
    })
    email: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(6, 128)
    //  it would be ideally if we apply some reg ex for password validation: small letters,numbers,capital letters
    password: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(2, 64)
    forename: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(2, 64)
    surname: string;

    @Validator.IsNotEmpty()
    @Validator.IsPhoneNumber(null) // +381 11 15.....
    phoneNumber: string;

    @Validator.IsNotEmpty()
    @Validator.IsString()
    @Validator.Length(10, 512)
    postalAddress: string;


}