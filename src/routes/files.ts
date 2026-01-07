import {type Context, Hono} from "hono";
import {findFileByUuid} from "../services/upload.service.ts";

export const files = new Hono()

files.get("/:uuid", async (c: Context) => {
    const uuid = c.req.param('uuid')

    const file = await findFileByUuid(uuid)

    if (!file) {
        return c.json({success: true, message: 'No file found'}, 404)
    }

    return c.body(new Uint8Array(file.buffer), {
        headers: {
            'Content-Type': 'image/jpeg',
            'Content-Disposition': `inline; filename="${file.original_name}"`
        }
    });
})