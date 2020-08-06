import { Controller, Post, Body, Req, Put } from "@nestjs/common";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { LoginAdministratorDto } from "src/dtos/administrator/login.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import * as crypto from 'crypto';
import { LoginInfoDto } from "src/dtos/auth/login.info.dto";
import * as jwt from 'jsonwebtoken';
import { JwtDataDto } from "src/dtos/auth/jwt.data.dto";
import { Request } from "express";
import { jwtSecret } from "config/jwt.secret";
import { UserRegistrationDto } from "src/dtos/user/user.registration.dto";
import { UserService } from "src/services/user/user.service";
import { LoginUserDto } from "src/dtos/user/login.user.dto ";

@Controller('auth')
export class AuthController {
    constructor(public administratorService: AdministratorService
        , public userService: UserService) { }

    @Post('administrator/login') // http://localhost:3000/auth/administrator/login
    async doAdministratorLogin(@Body() data: LoginAdministratorDto, @Req() req: Request): Promise<LoginInfoDto | ApiResponse> {

        //get administrator from repository by username provided by client
        const administrator = await this.administratorService.getByUsername(data.username);

        //check if administrator with that username exist
        if (!administrator) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3001)))
        }

        //create password hash from password provided by client
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        // check if password hash from client
        // is equal with password hash from repository
        if (administrator.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3002)))
        }


        // create data Token if all checks (username and password) are ok
        const jwtData = new JwtDataDto();
        jwtData.role = "administrator";
        jwtData.id = administrator.administratorId;
        jwtData.identity = administrator.username;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimestamp = sada.getTime() / 1000;

        jwtData.exp = istekTimestamp;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        // create Token
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        // create response object containing Token for corresponding username and password
        const responseObject = new LoginInfoDto(
            administrator.administratorId,
            administrator.username,
            token
        );
        // return response object
        return new Promise(resolve => resolve(responseObject));
    }


    //  POST http://localhost:3000/auth/user/register/
    @Post('user/register')
    async userRegister(@Body() data: UserRegistrationDto) {
        return await this.userService.register(data);
    }


    // POST  http://localhost:3000/auth/user/login
    @Post('user/login')
    async doUserLogin(@Body() data: LoginUserDto, @Req() req: Request): Promise<LoginInfoDto | ApiResponse> {

        //get user from repository by email provided by client
        const user = await this.userService.getByEmail(data.email);

        //check if user with that email exist
        if (!user) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3001)))
        }

        //create password hash from password provided by client
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        // check if password hash from client
        // is equal with password hash from repository
        if (user.passwordHash !== passwordHashString) {
            return new Promise(resolve => resolve(new ApiResponse('error', -3002)))
        }


        // create data Token if all checks (username and password) are ok
        const jwtData = new JwtDataDto();
        jwtData.role = "user";
        jwtData.id = user.userId;
        jwtData.identity = user.email;

        let sada = new Date();
        sada.setDate(sada.getDate() + 14);
        const istekTimestamp = sada.getTime() / 1000;

        jwtData.exp = istekTimestamp;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        // create Token from jwtData object
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        // create response object containing Token for corresponding email and password
        const responseObject = new LoginInfoDto(
            user.userId,
            user.email,
            token
        );

        // return response object
        return new Promise(resolve => resolve(responseObject));
    }


}