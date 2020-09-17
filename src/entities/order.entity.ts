import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Cart } from "./cart.entity";
import * as Validator from "class-validator";
import { User } from "./user.entity";


@Index("uq_order_cart_id", ["cartId"], { unique: true })
@Entity("order")
export class Order {
  @PrimaryGeneratedColumn({ type: "int", name: "order_id", unsigned: true })
  orderId: number;

  @Column("timestamp", {
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;

  @Column({type: "int",
    name: "cart_id",
    unique: true,
    unsigned: true,
  })
  cartId: number;

  @Column( {type: "enum",
    enum: ["rejected", "accepted", "shipped", "pending"],
    default: () => "'pending'",
  })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.IsIn([ "rejected", "accepted", "shipped", "pending"  ])
  status: "rejected" | "accepted" | "shipped" | "pending";

  @Column( {type: "int",
  name: "user_id"
     })
  @Validator.IsNotEmpty()
  @Validator.IsNumber()
  userId : number;

  @OneToOne(() => Cart, (cart) => cart.order, {
    onDelete: "NO ACTION",
    onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "cart_id", referencedColumnName: "cartId" }])
  cart: Cart;

  // @ManyToOne(() => User, user => user.orders)
  // @JoinTable({
  //   name: "cart",
  //   joinColumn: { name: "order_id", referencedColumnName: "orderId" },
  //   inverseJoinColumn: { name: "user_id", referencedColumnName: "userId" }
  // })
  // user: User;



}
