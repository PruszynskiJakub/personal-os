import {type Context, Hono} from "hono";
import * as fs from "node:fs";

export const files = new Hono()

files.get("/:uuid", async (c: Context) => {
    const uuid = c.req.param('uuid')
    if (uuid == '1b48fa81-72d7-49d1-afdc-4f5e603e2aa7') {
        const file = fs.readFileSync("./storage/1b48fa81-72d7-49d1-afdc-4f5e603e2aa7.png")

        console.log(file)

        return c.body(file.buffer, {
            headers: {
                'Content-Type': "image/png",
                'Content-Disposition': `inline; filename="dive_logo.png"`
            }
        });
    } else {
        return c.json({success: false, error: 'File not found'}, 404);
    }
})