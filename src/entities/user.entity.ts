import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Cart } from "./cart.entity";
import * as Validator from "class-validator";

@Index("uq_user_email", ["email"], { unique: true })
@Index("uq_user_phone_number", ["phoneNumber"], { unique: true })
@Entity("user")
export class User {
  @PrimaryGeneratedColumn({ type: "int", name: "user_id" })
  userId: number;

  @Column({
    type: "varchar",
    unique: true,
    length: 255,
  })
  @Validator.IsNotEmpty()
  @Validator.IsEmail({
    allow_ip_domain: false,  // we don't want domain like : mvojinovic@127.0.0.1
    allow_utf8_local_part: true,
    require_tld: true,  //we want Top Level Domain e-mails, not like : mvojinovic@localhost or something else locally , eg in house company mail that can't be access via www..... 
  })
  email: string;

  @Column({
    type: "varchar",
    name: "password_hash",
    length: 128,
  })
  @Validator.IsNotEmpty()
  @Validator.IsHash('sha512')
  passwordHash: string;


  @Column({
    type: "varchar",
    length: 64,
  })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Length(2, 64)
  forename: string;

  @Column({
    type: "varchar",
    length: 64
  })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Length(2, 64)
  surname: string;

  @Column({
    type: "varchar",
    name: "phone_number",
    unique: true,
    length: 24,
  })
  @Validator.IsNotEmpty()
  @Validator.IsPhoneNumber(null) // +381 11 15.....
  phoneNumber: string;

  @Column({
    type: "text",
    name: "postal_address"
  })
  @Validator.IsNotEmpty()
  @Validator.IsString()
  @Validator.Length(10, 512)
  postalAddress: string;

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
}
