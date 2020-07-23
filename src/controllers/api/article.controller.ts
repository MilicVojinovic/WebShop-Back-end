import { Controller, Post, Body, UseInterceptors, Param, UploadedFile } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Article } from "entities/article.entity";
import { ArticleService } from "src/services/article/article.service";
import { AddArticleDto } from "src/dtos/article/add.article.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { StorageConfig } from "config/storage.config";
import { Photo } from "entities/photo.entity";
import { PhotoService } from "src/services/photo/photo.service";
import { ApiResponse } from "src/misc/api.response.class";


@Controller('api/article')
@Crud({
    model: {
        type: Article
    },
    params: {
        id: {
            field: 'articleId',
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            photos: {
                eager: true
            },
            articlePrices: {
                eager: true
            },
            articleFeatures: {
                eager: true
            },
            features: {
                eager: true
            },

        }

    }
})
export class ArticleController {
    constructor(
        public service: ArticleService,

        public photoService: PhotoService,
    ) { }

    @Post('createFull')  // POST http://localhost:3000/api/article/createFull/
    createFullArticle(@Body() data: AddArticleDto) {
        return this.service.createFullArticle(data);
    }

    @Post(':id/uploadPhoto/')  // POST http://localhost:3000/api/article/:id/uploadPhoto/
    @UseInterceptors(
        FileInterceptor('photo', {
            storage: diskStorage({
                destination: StorageConfig.photoDestination,
                filename: (req, file, callback) => {
                    let original: string = file.originalname;

                    let normalized = original.replace(/\s+/g, '-');
                    normalized = normalized.replace (/[^A-z0-9\.\-]/g, '');
                    let sada = new Date();
                    let datePart = '';
                    datePart += sada.getFullYear().toString();
                    datePart += (sada.getMonth() + 1).toString();
                    datePart += sada.getDate().toString();

                    let randomPart: string =
                        new Array(10)
                            .fill(0)
                            .map(e => (Math.random() * 9).toFixed(0).toString())
                            .join('');

                    let filename = datePart + '-' + randomPart + '-' + normalized;
                    filename = filename.toLocaleLowerCase();

                    callback(null, filename);
                }
            }),
            fileFilter: (req, file, callback) => {
                // 1. Check extensions (jpg , png)
                if (!file.originalname.toLowerCase().match(/\.(jpg|png)$/)) {
                    callback(new Error('Bad file extensions'), false);
                    return;
                }
                // 2. Check mimetype : image/jpeg | image/png
                if (!(file.mimetype.includes('jpeg') || file.mimetype.includes('png')) ) {
                    callback(new Error('Bad file content'), false);
                    return;
                }

                callback(null, true);
            },
            limits :{
                files: 1,
                fieldSize : StorageConfig.photoMaxFileSize
            } 

        })
    )
    async uploadPhoto(@Param('id') articleId: number, @UploadedFile() photo): Promise<ApiResponse | Photo> {

        const newPhoto: Photo = new Photo();

        newPhoto.articleId = articleId;
        newPhoto.imagePath = photo.filename;

        const savedPhoto = await this.photoService.add(newPhoto);

        if (!savedPhoto) {
            return new ApiResponse('error', -4001)
        }

        return savedPhoto;
    }



}
