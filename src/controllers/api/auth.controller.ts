import { Controller, Post, Body, Req, Put, UseGuards, HttpException, HttpStatus } from "@nestjs/common";
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
import { JwtRefreshDataDto } from "src/dtos/auth/jwt.refresh.data.dto";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { UserRefreshTokenDto } from "src/dtos/auth/user.refresh.token.dto";

@Controller('auth')
export class AuthController {
    constructor(
        public administratorService: AdministratorService,
        public userService: UserService,
    ) { }

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
        jwtData.exp = this.getDatePlus(60 * 60 * 24 * 14);;
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        // create Token
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        // create response object containing Token for corresponding username and password
        const responseObject = new LoginInfoDto(
            administrator.administratorId,
            administrator.username,
            token,
            "",
            ""
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


        // create data for Token if all checks (email and password) are ok
        const jwtData = new JwtDataDto();
        jwtData.role = "user";
        jwtData.id = user.userId;
        jwtData.identity = user.email;
        jwtData.exp = this.getDatePlus(60 * 5);  // in seconds
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        // create Token from jwtData object
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        // create data for refresh Token
        const jwtRefreshData = new JwtRefreshDataDto();
        jwtRefreshData.role = jwtData.role;
        jwtRefreshData.id = jwtData.id;
        jwtRefreshData.identity = jwtData.identity;
        jwtRefreshData.exp = this.getDatePlus(60 * 60 * 24 * 31) // in seconds
        jwtRefreshData.ip = jwtData.ip;
        jwtRefreshData.ua = jwtData.ua;

        // create Refresh Token from jwtRefreshData object
        let refreshToken: string = jwt.sign(jwtRefreshData.toPlainObject(), jwtSecret);

        // create response object containing Token and Refresh Token 
        // for corresponding email and password
        const responseObject = new LoginInfoDto(
            user.userId,
            user.email,
            token,
            refreshToken,
            this.getIsoDate(jwtRefreshData.exp),
        );

        // save data in user_token table 
        await this.userService.addToken(
            user.userId,
            refreshToken,
            this.getDatabaseDateFormat(this.getIsoDate(jwtRefreshData.exp))
        );

        // return response object
        return new Promise(resolve => resolve(responseObject));
    }

    // POST http://localhost:3000/auth/user/refresh/
    @Post('user/refresh')
    async userTokenRefresh(@Req() req: Request, @Body() data: UserRefreshTokenDto): Promise<LoginInfoDto | ApiResponse> {
                
        // get data from User_Token database for refresh token sent by client
        const userToken = await this.userService.getUserToken(data.token);

        // check if refresh token sent by client exist in database
        if (!userToken) {
            return new ApiResponse("error", -10002, "No such refresh token");
        }

         // check if refresh token sent by client is valid
        if (userToken.isValid === 0) {
            return new ApiResponse("error", -10003, "The token is no longer valid");
        }

        // create current timestamp and check if token sent by client didn't expire
        const now = new Date();

        const expireDate = new Date(userToken.expiresAt);

        if (expireDate.getTime() < now.getTime()) {
            return new ApiResponse("error", -10004, "The token has expired");
        }

        // create new jwt Refresh Data by verifying (reverse signing of token) Refresh Token

        let jwtRefreshData: JwtRefreshDataDto;

        try {
            jwtRefreshData = jwt.verify(data.token, jwtSecret);
        } catch (e) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check did we get jwtRefreshData object from Refresh Token
        if (!jwtRefreshData) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check if ip address is the same as the one Refresh Token was made from
        if (jwtRefreshData.ip !== req.ip.toString()) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check if user agent is the same as the one Refresh Token was made from
        if (jwtRefreshData.ua !== req.headers["user-agent"]) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }


        // create data for new Token from Refresh Token and extend expire time for new Token
        const jwtData = new JwtDataDto();

        jwtData.role = jwtRefreshData.role;
        jwtData.id = jwtRefreshData.id;
        jwtData.identity = jwtRefreshData.identity;
        jwtData.exp = this.getDatePlus(60 * 5); // in seconds
        jwtData.ip = jwtRefreshData.ip;
        jwtData.ua = jwtRefreshData.ua;

        // create Token from jwtData object
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        // create response object containing Token and Refresh Token for corresponding email and password
        const responseObject = new LoginInfoDto(
            jwtData.id,
            jwtData.identity,
            token,
            data.token, // the same refresh token until it expires
            this.getIsoDate(jwtRefreshData.exp),
        );

        return responseObject;

    }


    

    private getDatePlus(numberOfSeconds: number): number {
        return new Date().getTime() / 1000 + numberOfSeconds;
    }

    private getIsoDate(timestamp: number): string {
        const date = new Date();
        date.setTime(timestamp * 1000);
        return date.toISOString();
    }

    private getDatabaseDateFormat(isoFormat: string): string {
        return isoFormat.substr(0, 19).replace('T', ' ');
    }


}