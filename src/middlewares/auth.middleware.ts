import { NestMiddleware, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { AdministratorService } from "src/services/administrator/administrator.service";
import * as jwt from 'jsonwebtoken';
import { JwtDataDto } from "src/dtos/auth/jwt.data.dto";
import { jwtSecret } from "config/jwt.secret";
import { UserService } from "src/services/user/user.service";

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(
        public administratorService: AdministratorService,
        public userService: UserService  //moramo exportovati u app modulu!!!

    ) { }

    async use(req: Request, res: Response, next: NextFunction) {

        // check if there is data in request's authorization header
        if (!req.headers.authorization) {
            throw new HttpException('Token not found', HttpStatus.UNAUTHORIZED);
        }

        // get token from request's authorization header
        const token = req.headers.authorization;

        const tokenParts = token.split(' ');

        if (tokenParts.length !== 2) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // get jwtData object from token
        let jwtData: JwtDataDto;

        try {
            jwtData = jwt.verify(tokenParts[1], jwtSecret);
        } catch (e) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check did we get jwtData object from token
        if (!jwtData) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check if ip address is the same as the one token was made from
        if (jwtData.ip !== req.ip.toString()) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        // check if user agent is the same as the one token was made from
        if (jwtData.ua !== req.headers["user-agent"]) {
            throw new HttpException('Bad token found', HttpStatus.UNAUTHORIZED);
        }

        //check if user or administrator is login
        if (jwtData.role === "administrator") {
            const administrator = await this.administratorService.getById(jwtData.id);
            if (!administrator) {
                throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
            }
        } else if (jwtData.role === "user") {
            const user = await this.userService.getById(jwtData.id);
            if (!user) {
                throw new HttpException('Account not found', HttpStatus.UNAUTHORIZED);
            }
        }

        // check if token didn't expire
        let sada = new Date();
        const trenutniTimestamp = new Date().getTime() / 1000;

        if (trenutniTimestamp >= jwtData.exp) {
            throw new HttpException('The token has expired', HttpStatus.UNAUTHORIZED);
        }

        next();
    }



}