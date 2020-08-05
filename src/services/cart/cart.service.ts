import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart } from "src/entities/cart.entity";
import { CartArticle } from "src/entities/cart-article.entity";
import { Article } from "src/entities/article.entity";
import { Order } from "src/entities/order.entity";

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart)
        private readonly cart: Repository<Cart>,

        @InjectRepository(CartArticle)
        private readonly cartArticle: Repository<CartArticle>    ) { }


    // get last active (no order is placed and no 0 quantity of articles) cart for active user
    async getLastActiveCartByUserId(userId: number): Promise<Cart | null> {
        //get array of carts from repository,with userId from active user
        const carts = await this.cart.find({
            where: {
                userId: userId
            },
            order: {
                createdAt: "DESC",
            },
            take: 1,
            relations: ["order"],
        });

        // check if there is cart for active user
        if (!carts || carts.length === 0) {
            return null;
        }
        // get last created cart from carts array ;  "DESC" created at command in query
        const cart = carts[0];

        // check if there is order on that last created cart
        if (cart.order !== null) {
            return null;
        }

        return cart;
    }

    // create new cart for active user
    async createNewCartForUser(userId: number): Promise<Cart> {
        const newCart: Cart = new Cart();
        newCart.userId = userId;

        return await this.cart.save(newCart);
    }

    // add article to cart in cart_article table
    async addArticleToCart(cartId: number, articleId: number, quantity: number): Promise<Cart> {
        // get Cart Article data(row) for cart id and desired article id
        let record: CartArticle = await this.cartArticle.findOne({
            cartId: cartId,
            articleId: articleId,
        })

        // check if Cart Article data(row) for desired article already exist ;
        if (!record) {
            // if not create new row for article with article id 
            record = new CartArticle();
            record.cartId = cartId;
            record.articleId = articleId;
            record.quantity = quantity;

            record = await this.cartArticle.save(record);

        } else {
            // Cart Article data(row) exist => just change quantity 
            record.quantity += quantity;
        }


        await this.cartArticle.save(record);

        return this.getById(cartId);

    }

   
    // change quantity of article in cart_article table
    async changeQuantity(cartId : number , articleId : number , newQuantity: number ): Promise<Cart>{
        // get Cart Article data(row) for cart id and article id 
        let record: CartArticle = await this.cartArticle.findOne({
            cartId: cartId,
            articleId: articleId,
        });

         // check if Cart Article data(row) exist ;
        if(record) {
            record.quantity = newQuantity;

            // if quantity is change to 0 we delete that article from active cart 
            // else we save active cart with new value for quantity
            if(record.quantity ===0){
                await this.cartArticle.delete(record.cartArticleId)
            } else {
                await this.cartArticle.save(record);
            }
        }

        return await this.getById(cartId);
    }


    // get cart and related tables
    async getById(cartId: number): Promise<Cart> {
        return await this.cart.findOne(cartId, {
            relations: [
                "user",
                "cartArticles",
                "cartArticles.article",
                "cartArticles.article.category",
                "cartArticles.article.articlePrices",

            ]
        });
    }


}