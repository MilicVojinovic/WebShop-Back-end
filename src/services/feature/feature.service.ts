import { Injectable } from "@nestjs/common";
import { TypeOrmCrudService } from "@nestjsx/crud-typeorm";
import { Feature } from "src/entities/feature.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DistinctFeaturesValuesDto } from "src/dtos/features/distinct.feature.values.dto";
import { ArticleFeature } from "src/entities/article-feature.entity";
import { async } from "rxjs/internal/scheduler/async";

@Injectable()
export class FeatureService extends TypeOrmCrudService<Feature>{
    constructor(
        @InjectRepository(Feature) private readonly feature: Repository<Feature>, //  moramo evidentirati u app module!!!!
        @InjectRepository(ArticleFeature) private readonly articleFeature: Repository<ArticleFeature> //  moramo evidentirati u app module!!!!
    ) {
        super(feature);
    }

    async getDistinctValuesByCategoryId(categoryId: number): Promise<DistinctFeaturesValuesDto> {
        const features = await this.feature.find({
            categoryId: categoryId,
            // Analogue to : SELECT * FROM feature WHERE category_id = categoryId;
        });

        const result: DistinctFeaturesValuesDto = {
            features: [],
        };

        if (!features || features.length === 0) {
            return result;
        }

        result.features = await Promise.all(features.map(async (feature) => {

            const values: string[] =
                (
                    await this.articleFeature.createQueryBuilder("af")
                        .select("DISTINCT af.value", 'value')
                        .where('af.feature = :featureId', { featureId: feature.featureId })
                        .orderBy('af.value', 'ASC')
                        .getRawMany()
                ).map((item) => item.value)


            return {
                featureId: feature.featureId,
                name: feature.name,
                values: values,
            }
        }));

        return result;



    }
}