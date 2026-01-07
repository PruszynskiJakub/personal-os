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
    //
    // if (uuid == '1b48fa81-72d7-49d1-afdc-4f5e603e2aa7') {
    //     const file = fs.readFileSync("./storage/1b48fa81-72d7-49d1-afdc-4f5e603e2aa7.png")
    //
    //     console.log(file)
    //
    //     return c.body(file.buffer, {
    //         headers: {
    //             'Content-Type': "image/png",
    //             'Content-Disposition': `inline; filename="dive_logo.png"`
    //         }
    //     });
    // } else {
    //     return c.json({success: false, error: 'File not found'}, 404);
    // }
})