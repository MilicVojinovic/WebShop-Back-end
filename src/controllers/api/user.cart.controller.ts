import { Controller, Get, UseGuards, Req, Post, Body, Patch } from "@nestjs/common";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { CartService } from "src/services/cart/cart.service";
import { Cart } from "src/entities/cart.entity";
import { Request } from "express";
import { AddArticleToCartDto } from "src/dtos/cart/add.article.to.cart.dto";
import { EditArticleInCartDto } from "src/dtos/cart/edit.article.in.cart.dto";
import { Order } from "src/entities/order.entity";
import { OrderService } from "src/services/order/order.service";
import { ApiResponse } from "src/misc/api.response.class";
import { OrderMailer } from "src/services/order/order.mailer.service";

@Controller('api/user/cart')
export class UserCartController {
    constructor(
        // use Cart Service 
        private cartService: CartService,

        // use Order Service 
        private orderService: OrderService,

        // use Order Mailer Service 
        private orderMailer: OrderMailer

    ) { }


    // check if there already exist cart for active user; if not create new cart 
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
        // get cart for user based on his id from token  
        return await this.getActiveCartForUserId(req.token.id);
      }


    // POST http://localhost:3000/api/user/cart/addToCart/
    @Post('addToCart')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')

    // 
    async addToCart (@Body() data:AddArticleToCartDto,@Req() req: Request) : Promise<Cart> {
        // get cart for user based on his id from token  
        const cart = await this.getActiveCartForUserId(req.token.id);
        // add article to cart or if already exist in cart change his quantity value 
        return await this.cartService.addArticleToCart(cart.cartId , data.articleId , data.quantity);
    }

    // PATCH  http://localhost:3000/api/user/cart/
    @Patch()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async changeQuantity ( @Body() data:EditArticleInCartDto ,@Req() req: Request) : Promise<Cart>{
        // get cart for user based on his id from token 
        const cart = await this.getActiveCartForUserId(req.token.id);
        // change article quantity and delete article from cart if quantity value is set to 0
        return await this.cartService.changeQuantity(cart.cartId , data.articleId , data.quantity);
    }



    // POST http://localhost:3000/api/user/cart/makeOrder/
    @Post('makeOrder')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async makeOrder(@Req() req: Request): Promise<Order | ApiResponse> {

        // get cart for user based on his id from token 
        const cart = await this.getActiveCartForUserId(req.token.id);

        // check if order already exist,
        // if not create new and return order data
        const order = await this.orderService.add(cart.cartId , req.token.id);

        if (order instanceof ApiResponse ){
            return order;
        }

        await this.orderMailer.sendOrderEmail(order);

        return order;
        
    }

    // GET http://localhost:3000/api/user/cart/orders/
    @Get('orders')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('user')
    async getOrders(@Req() req:Request):Promise <Order[]>{
        return await this.orderService.getAllByUserId(req.token.id);
    }

}