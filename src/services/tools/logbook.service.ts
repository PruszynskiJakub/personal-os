import type {Document} from "../../types/agent.ts";
import type {Tool} from "../../types/tool.ts";
import {documentService} from "../document.service.ts";
import {z} from "zod";

type LogbookAction = 'add_dive'

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
    score : z.number().optional() // optional
})

const addDiveLogbookSchema = z.object({
    conversation_uuid: z.string(),
    dives: z.array(diveRecordSchema)
})

const logbookService = {

    execute: async (
        action: LogbookAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'add_dive': {
                const {conversation_uuid, dives} = addDiveLogbookSchema.parse(payload);

                const content = `
                Created ${dives.length} dives
                Dive details ${JSON.stringify(dives)}`.trim();

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