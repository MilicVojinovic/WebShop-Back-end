import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Category } from "./Category";
import { ArticleFeature } from "./ArticleFeature";
import { ArticlePrice } from "./ArticlePrice";
import { CartArticle } from "./CartArticle";
import { Photo } from "./Photo";

@Index("fk_article_category_id", ["categoryId"], {})
@Entity("article")
export class Article {
  @PrimaryGeneratedColumn({ type: "int", name: "article_id", unsigned: true })
  articleId: number;

  @Column({type :"varchar", length: 128})
  name: string;

  @Column( {type :"int", name: "category_id", unsigned: true})
  categoryId: number;

  @Column({type :"varchar" , length: 255 })
  excerpt: string;

  @Column({type :"text"})
  description: string;

  @Column({type :"enum", enum: ["available", "visible", "hidden"],
    default: () => "'available'",
  })
  status: "available" | "visible" | "hidden";

  @Column({type :"tinyint",
     name: "is_promoted",unsigned: true })
  isPromoted: number;

  @Column({ type: "timestamp",
    name: "created_at",
    default: () => "CURRENT_TIMESTAMP",
  })
  createdAt: Date;


  @ManyToOne(
    () => Category,
    (category) => category.articles, 
    {onDelete: "NO ACTION",onUpdate: "CASCADE",
  })
  @JoinColumn([{ name: "category_id", referencedColumnName: "categoryId" }])
  category: Category;

  @OneToMany(  () => ArticleFeature, (articleFeature) => articleFeature.article)
  articleFeatures: ArticleFeature[];

  @OneToMany(  () => ArticlePrice, (articlePrice) => articlePrice.article)
  articlePrices: ArticlePrice[];

  @OneToMany(  () => CartArticle, (cartArticle) => cartArticle.article)
  cartArticles: CartArticle[];

  @OneToMany(  () => Photo, (photo) => photo.article)
  photos: Photo[];
}
