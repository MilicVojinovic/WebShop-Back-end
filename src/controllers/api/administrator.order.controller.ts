import { OrderService } from "src/services/order/order.service";
import { Get, Param, UseGuards, Patch, Body, Controller } from "@nestjs/common";
import { Order } from "src/entities/order.entity";
import { ApiResponse } from "src/misc/api.response.class";
import { RoleCheckerGuard } from "src/misc/role.checker.guard";
import { AllowToRoles } from "src/misc/allow.to.roles.descriptor";
import { ChangeOrderStatusDto } from "src/dtos/order/change.order.status.dto";

@Controller('api/order')
export class AdministratorOrderController {
    constructor(
        private orderService: OrderService,

    ) { }

    // GET http://localhost:3000/api/order/
    @Get()
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    async getAll(): Promise<Order[]>{
        return await this.orderService.getAll();
    }


    // GET http://localhost:3000/api/order/:id
    @Get(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    async get(@Param('id') id: number): Promise<Order | ApiResponse> {
        const order = await this.orderService.getById(id);

        if (!order) {
            return new ApiResponse("error", -9001, "No such order found");
        }

        return order;
    }

    // PATCH http://localhost:3000/api/order/:id
    @Patch(':id')
    @UseGuards(RoleCheckerGuard)
    @AllowToRoles('administrator')
    async changeStatus(@Param('id') id: number, @Body() data: ChangeOrderStatusDto) {

        return await this.orderService.changeStatus(id, data.newStatus);
    }







}
