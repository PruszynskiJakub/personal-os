import type {Context, Next} from "hono";
import {z} from "zod";
import type {CoreMessage, FilePart, ImagePart, TextPart} from "ai";

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

}

const processAttachments = async (message: any): Promise<CoreMessage> => {
    const hasMultipartContent = Array.isArray(message.content)
    const hasFileOrImageContent = hasMultipartContent && message.content.any((part: ImagePart | TextPart | FilePart) => {
        return part.type === "image" || part.type === "file"
    });

    if (!hasMultipartContent) {
        return message as CoreMessage
    }

    const processed_message = message.content.map(async (part: ImagePart | TextPart | FilePart) => {
        if (part.type === "image") {
            return part
        }

        return part
    })


    return processed_message
}

export const attachmentsMiddleware = async (c: Context, next: Next) => {
    const request = c.get('request') || {}
    const parsed_request = RequestSchema.parse(request)
    const non_system_messages = parsed_request.messages.filter(m => m.role !== 'system')

    let processed_messages = non_system_messages.map(processAttachments)

    c.set('request', {
        ...parsed_request,
        messages: processed_messages
    });

    return await next();
}