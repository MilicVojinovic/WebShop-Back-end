import { Injectable } from "@nestjs/common";
import { In, Repository } from "typeorm";
import { Order } from "src/entities/order.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Cart } from "src/entities/cart.entity";
import { ApiResponse } from "src/misc/api.response.class";

@Injectable()
export class OrderService {
    constructor(
        @InjectRepository(Order)
        private readonly order: Repository<Order>,

        @InjectRepository(Cart)
        private readonly cart: Repository<Cart>,

    ) { }

    async add(cartId: number , userId : number): Promise< Order | ApiResponse> {

        // find order with cartId 
        const order = await this.order.findOne({
            cartId: cartId,
        });

        // check if order for specified cartId exist
        if (order) {
            return new ApiResponse("error", -7001, "An order for this cart has already been made.");
        }

        // find cart with specified cartId
        const cart = await this.cart.findOne(cartId, {
            relations: [
                "cartArticles"
            ]
        });

        // check if cart for specified cartId exist
        if (!cart) {
            return new ApiResponse("error", -7002, "No such curt found");
        }

        // check if cart for specified cartId has articles
        if (cart.cartArticles.length === 0) {
            return new ApiResponse("error", -7003, "This cart is empty");
        }

        // create new order for specified cartId,save it to database 
        // and return order info
        const newOrder: Order = new Order();

        newOrder.cartId = cartId;
        newOrder.userId = userId;

        const savedOrder = await this.order.save(newOrder);

        cart.createdAt = new Date();
        await this.cart.save(cart);

        return await this.getById(savedOrder.orderId)
    }

    async getById(orderId: number) {
        return await this.order.findOne(orderId, {
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

    async getAllByUserId(userId: number) {

        // // get all Cart objects for current userId from Cart repository
        // const carts = await this.cart.find({
        //     where: {
        //         userId: userId
        //     }
        // });

        // // create empty list
        // let cartIdsList : number[] = [];

        // // fill cartIdsList list with cartId from list of Cart objects
        // for (const cart of carts) {
        //     cartIdsList.push(cart.cartId);
        // }

        // // find all cartIds in Order repository which will effectively give us all Order objects for current userId
        // return await this.order.find({
        //     where: {
        //         cartId: In([...cartIdsList])
        //     }
        //     ,
        //     relations: [
        //         "cart",
        //         "cart.user",
        //         "cart.cartArticles",
        //         "cart.cartArticles.article",
        //         "cart.cartArticles.article.category",
        //         "cart.cartArticles.article.articlePrices",
        //     ],
        // });

        return await this.order.find({
                where: {
                    userId : userId
                }
                ,
                relations: [
                    "cart",
                    "cart.user",
                    "cart.cartArticles",
                    "cart.cartArticles.article",
                    "cart.cartArticles.article.category",
                    "cart.cartArticles.article.articlePrices",
                ],
            });
    }

    async changeStatus(orderId: number, newStatus: "rejected" | "accepted" | "shipped" | "pending") {
        const order = await this.getById(orderId);

        if (!order) {
            return new ApiResponse("error", -9001, "No such order found!")!
        }

        order.status = newStatus;

        await this.order.save(order);

        return await this.getById(orderId);


    }




}