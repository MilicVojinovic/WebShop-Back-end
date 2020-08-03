import { SetMetadata } from "@nestjs/common"

export const AllowToRoles = (...roles: ("administrator" | "user")[]) => {
    return SetMetadata('allow to roles', roles);
} 
