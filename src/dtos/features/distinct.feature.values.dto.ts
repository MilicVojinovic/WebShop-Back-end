import * as Validator from "class-validator";

export class DistinctFeaturesValuesDto {

    features: {
        featureId : number;
        name : string;
        values : string[];
    }[];

}