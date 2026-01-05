import type { Context, Next } from "hono";
import { z } from "zod";
import type { CoreMessage, FilePart, ImagePart, TextPart } from "ai";

const BaseMessageContent = z.union([
    z.string(),
    z.array(
        z.object({
            type: z.enum(['text', 'image', 'file']),
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

const uploadAttachment = async (data: string) => {
    if (data.startsWith("http")) return data;

    console.log("Uploading attachment...")

    return data
}

const processMultipartMessage = async (message: any): Promise<CoreMessage> => {
    const hasMultipartContent = Array.isArray(message.content)
    const hasFileOrImageContent = hasMultipartContent && message.content.some((part: ImagePart | TextPart | FilePart) => {
        return part.type === "image" || part.type === "file"
    });

    if (!hasMultipartContent) {
        return message as CoreMessage
    }

    const processed_message = await Promise.all(
        message.content.map(async (part: ImagePart | TextPart | FilePart) => {
            if (part.type === "image") {
                return part as ImagePart
            }
            return part as TextPart | FilePart
        })
    );


    return {
        ...message,
        content: processed_message
    } as CoreMessage
}

export const attachmentsMiddleware = async (c: Context, next: Next) => {
    const body = await c.req.json()
    const parsed_request = RequestSchema.parse(body)
    const non_system_messages = parsed_request.messages.filter(m => m.role !== 'system')

    let processed_messages = await Promise.all(non_system_messages.map(processMultipartMessage))

    console.log(processed_messages)

    c.set('request', {
        ...parsed_request,
        messages: processed_messages
    });

    return await next();
}