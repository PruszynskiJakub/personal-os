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

                const response = await fetch("https://marcin318-20318.wykr.es/webhook/d0881779-afed-4dd2-85ad-713d9b67b4e3", {
                    method: "POST",
                    body: JSON.stringify({dives: dives}),
                    headers: {
                        "Content-Type": "application/json",
                    }
                })

                if (response.ok) {
                    const document_text = `Recorded ${dives.length} new dives.
                        Their details:
                        ${dives.map((dive, index) => {
                        return `${index}. On ${dive.date} at ${dive.spot} on max depth: ${dive.max_depth}m and duration: ${dive.duration}min`.trim()
                    }).join('\n')}
                `

                    return documentService.createDocument({
                        conversation_uuid: conversation_uuid,
                        text: document_text,
                        description: 'List of dives added to the logbook'
                    })
                } else {
                    return documentService.createErrorDocument({
                        conversation_uuid: conversation_uuid,
                        error: response.statusText,
                        error_context: "Failed to add new dives to the logbook.",
                    })
                }
            }
            case 'read_dives': {
                const {conversation_uuid, limit} = readDivesLogbookSchema.parse(payload);

                const response = await fetch("https://marcin318-20318.wykr.es/webhook/7d179e22-792f-49f2-bc48-573493256291", {
                    method: "POST",
                    body: JSON.stringify({limit: limit}),
                    headers: {
                        "Content-Type": "application/json",
                    }
                })
                if (response.ok) {
                    const result = await response.json()
                    const dives = result['result'] as [{
                        spot: string,
                        max_depth: number,
                        duration: number,
                        date: string
                    }]

                    const document_text = `Your last ${limit} dives are:
                   ${dives.map((dive, index) => {
                        return `${index}. On ${dive.date} at ${dive.spot} on max depth: ${dive.max_depth}m and duration: ${dive.duration} min`.trim()
                    }).join("\n")}`

                    return documentService.createDocument({
                        conversation_uuid: conversation_uuid,
                        text: document_text,
                        description: 'The last ${limit} dives fetched from the logbook',
                    })
                } else {
                    return documentService.createErrorDocument({
                        conversation_uuid: conversation_uuid,
                        error: response.statusText,
                        error_context: `Failed to read last ${limit} dives from the logbook.`,
                    })
                }
            }
        }
    }
}

export {
    logbookService
}