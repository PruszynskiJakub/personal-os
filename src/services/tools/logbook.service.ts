import type {Document} from "../../types/agent.ts";
import type {Tool} from "../../types/tool.ts";
import {documentService} from "../document.service.ts";
import {z} from "zod";

type LogbookAction = 'add_dive'

const diveRecordSchema = z.object({})

const addDiveLogbookSchema = z.object({
    conversation_uuid: z.string(),
    dives: z.array(diveRecordSchema)
})

const logbookService: Tool<LogbookAction> = {

    execute: async (
        action: LogbookAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'add_dive': {
                const {conversation_uuid, dives} = addDiveLogbookSchema.parse(payload);

                const content = `Created ${dives.length} dives
                    Dive details ${JSON.stringify(dives)}`;

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