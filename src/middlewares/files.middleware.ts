import type {Context, Next} from "hono";

export const filesMiddleware = async (c: Context, next: Next) => {
    return await next();
}