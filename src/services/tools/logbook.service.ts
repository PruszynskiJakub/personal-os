import type {Document} from "../../types/agent.ts";
import {documentService} from "../document.service.ts";
import {z} from "zod";

export type LogbookAction = 'add_dive' | 'read_dives'

const diveRecordSchema = z.object({
    spot: z.string(), //required
    max_depth: z.number(), //required
    duration: z.number(), //required
    salty: z.boolean().optional(), //optional
    weights: z.number().optional(), //optional
    tank: z.number().optional(), //optional
    tank_type: z.string().optional(), //optional
    start_air: z.number().optional(),
    end_air: z.number().optional(),
    date: z.string(), //required,
    dive_school: z.string().optional(),
    score: z.number().optional() // optional
})

const addDiveLogbookSchema = z.object({
    conversation_uuid: z.string(),
    dives: z.array(diveRecordSchema)
})

const readDivesLogbookSchema = z.object({
    conversation_uuid: z.string(),
    limit: z.number()
})

const logbookService = {

    execute: async (
        action: LogbookAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'add_dive': {
                const {conversation_uuid, dives} = addDiveLogbookSchema.parse(payload);

                const result = await fetch("https://marcin318-20318.wykr.es/webhook/d0881779-afed-4dd2-85ad-713d9b67b4e3", {
                    method: "POST",
                    body: JSON.stringify({dives: dives}),
                    headers: {
                        "Content-Type": "application/json",
                    }
                })

                console.log(result)

                const content = `
                Created ${dives.length} dives
                Dive details ${JSON.stringify(dives)}
                `.trim();

                return documentService.createDocument({
                    conversation_uuid: conversation_uuid,
                    text: content
                })
            }
            case 'read_dives': {
                const {conversation_uuid, limit} = readDivesLogbookSchema.parse(payload);

                const result = await fetch("https://marcin318-20318.wykr.es/webhook/7d179e22-792f-49f2-bc48-573493256291", {
                    method: "POST",
                    body: JSON.stringify({limit: limit}),
                    headers: {
                        "Content-Type": "application/json",
                    }
                })

                console.log(result)

                const content = `The last ${limit} dives are:
                   ${await result.text()}
                `.trim();

                return documentService.createDocument({
                    conversation_uuid: conversation_uuid,
                    text: content
                })
            }
        }
    }
}

export {
    logbookService
}