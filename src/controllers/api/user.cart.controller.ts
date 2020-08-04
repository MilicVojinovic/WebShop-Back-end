import { Controller, Get, UseGuards, Req, Post, Body, Patch } from "@nestjs/common";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { Administrator } from "src/entities/administrator.entity";
import { CartService } from "src/services/cart/cart.service";
import { Cart } from "src/entities/cart.entity";
import { Request } from "express";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { AddArticleToCartDto } from "src/dtos/cart/add.article.to.cart.dto";
import { EditArticleDto } from "src/dtos/article/edit.article.dto";
import { EditArticleInCartDto } from "src/dtos/cart/edit.article.in.cart.dto";

@Controller('api/user/cart')
export class UserCartController {
    constructor(
        private cartService: CartService
    ) { }


    private async getActiveCartForUserId (userId : number) : Promise<Cart>{

        let cart = await this.cartService.getLastActiveCartByUserId(userId);

        if (!cart) {
            cart = await this.cartService.createNewCartForUser(userId);
        }
        
        return await this.cartService.getById(cart.cartId);
    }



    // GET  http://localhost:3000/api/user/cart/
    @Get()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async getCurrentCart(@Req() req: Request): Promise<Cart> {
        return await this.getActiveCartForUserId(req.token.id);
      }


    // POST http://localhost:3000/api/user/cart/addToCart/
    @Post('addToCart')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async addToCart(@Body() data:AddArticleToCartDto,@Req() req: Request) : Promise<Cart> {
        const cart = await this.getActiveCartForUserId(req.token.id);
        
        return await this.cartService.addArticleToCart(cart.cartId , data.articleId , data.quantity);
    }

    // PATCH  http://localhost:3000/api/user/cart/
    @Patch()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async changeQuantity ( @Body() data:EditArticleInCartDto ,@Req() req: Request) : Promise<Cart>{
        const cart = await this.getActiveCartForUserId(req.token.id);
        return await this.cartService.changeQuantity(cart.cartId , data.articleId , data.quantity);
        
    }

}