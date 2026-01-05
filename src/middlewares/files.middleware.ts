import type {Context, Next} from "hono";
import {z} from "zod";

const BaseMessageContent = z.union([
    z.string(),
    z.array(
        z.object({
            type: z.string(),
            text: z.string().optional(),
            data: z.string().optional(),
            image: z.string().optional(),
        })
    )
]);

const RequestSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(['system', 'user', 'assistant', 'tool']),
            content: BaseMessageContent
        })
    ),
    stream: z.boolean().optional(),
})

export const filesMiddleware = async (c: Context, next: Next) => {
    const request = c.get('request') || {}
    const parsed_request = RequestSchema.parse(request)
    const non_system_messages = parsed_request.messages.filter(m => m.role !== 'system')

    c.set('request', {
        ...parsed_request,
        messages: non_system_messages
    });

    return await next();
}