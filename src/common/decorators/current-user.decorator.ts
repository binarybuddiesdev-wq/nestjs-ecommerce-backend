import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { IUserPayload } from '@/types/index.js';

export const CurrentUser = createParamDecorator((data: keyof IUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: IUserPayload }>();
    const user = request.user;
    return data ? user?.[data] : user;
});
