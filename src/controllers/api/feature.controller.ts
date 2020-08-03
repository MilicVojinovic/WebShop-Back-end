import { Controller, UseGuards } from "@nestjs/common";
import { Crud } from "@nestjsx/crud";
import { Feature } from "src/entities/feature.entity";
import { FeatureService } from "src/services/feature/feature.service";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";

@Controller('api/feature')
@Crud({
    model: {
        type: Feature
    },
    params: {
        id: {
            field: 'featureId', // kod milana taira je feature_id
            type: 'number',
            primary: true
        }
    },
    query: {
        join: {
            category: {
                eager: true
            },
            articleFeatures: {
                eager: false
            },
            articles: {
                eager: false
            }
        }

    },
    routes: {
        only: [
            "createOneBase",
            "createManyBase",
            "updateOneBase",
            "getOneBase",
            "getManyBase",
        ],
        createOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        createManyBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        updateOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator')
            ]
        },
        getOneBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
        getManyBase: {
            decorators: [
                UseGuards(RoleCheckerGuard),
                AllowToRoles('administrator', 'user')
            ]
        },
        



    }
})
export class FeatureController {
    constructor(public service: FeatureService) { }
}