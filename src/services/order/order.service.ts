import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Order } from "src/entities/order.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Cart } from "src/entities/cart.entity";
import { ApiResponse } from "src/misc/api.response.class";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly order: Repository<Order>, //  moramo evidentirati u app module!!!!

        @InjectRepository(Cart)
        private readonly cart: Repository<Cart>,

    ) { }

    async add(cartId: number): Promise<Order | ApiResponse> {
        const order = await this.order.findOne({
            cartId : cartId,
        });

        if(order){
            console.log( order.orderId);
            return new ApiResponse("error" , -7001 , "An order for this cart has already been made.");
        }

        const cart = await this.cart.findOne(cartId, {
            relations: [
                "cartArticles"
            ]
        });

        if(!cart){
            return new ApiResponse("error" , -7002 , "No such curt found");
        }

        if(cart.cartArticles.length === 0){
            return new ApiResponse("error" , -7003 , "This cart is empty");
        }

        const newOrder : Order = new Order();

        newOrder.cartId = cartId;

        const savedOrder = await this.order.save(newOrder);

        return await this.order.findOne(savedOrder.orderId, {
            relations: [
                "cart",
                "cart.user",
                "cart.cartArticles",
                "cart.cartArticles.article",
                "cart.cartArticles.article.category",
                "cart.cartArticles.article.articlePrices",
            ]
        })

    }




}