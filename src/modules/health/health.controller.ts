import { ApiOperation } from "@nestjs/swagger";
import { Controller, Get, HttpCode } from "@nestjs/common";

import { ApiRoutes, APIOperation } from "@/common/index.js";

@Controller()
export class HealthController {

    constructor() { }

    @Get(ApiRoutes.HEALTH)
    @HttpCode(200)
    @ApiOperation({ summary: APIOperation.HEALTH_CHECK })
    healthCheck() {
        return { status: 'ok' };
    }

};
