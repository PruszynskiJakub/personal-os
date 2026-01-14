import {type LogbookAction, logbookService} from "../services/tools/logbook.service.ts";
import {type DocumentAction, documentProcessorService} from "../services/tools/document.processor.service.ts";
import {type WebAction, webService} from "../services/tools/web.service.ts";

export const tool_registry = [
    {
        name: "logbook",
        description: "Use whenever users wants to register, update, read or remove diving or climbing records.",
        actions: [
            {
                name: "add_dive",
                description: "Use this action whenever user wants to record one or more dives",
                instructions: `
                    {
                        "dives" : [
                            {
                                spot: string, //required
                                max_depth: number, //required
                                duration: number, //required , this field might be called elapsed time
                                salty: boolean, //optional
                                weights: number, //optional
                                tank: number, //optional
                                tank_type: "alu" | "steel", //optional
                                start_air: number,
                                end_air: number,
                                date: string | date, //required,
                                dive_school: string,
                                score : number // optional
                            } 
                        ]
                    }
                    
                    IMPORTANT: You may add multiple dives at the same time.
                `
            },
            {
                name: "read_dives",
                description: "Use this action whenever user wants to read last N dives",
                instructions: `
                    {
                        "limit: number // the number of dives to fetch
                    }
                `
            }
        ],
        executor: (action: string, payload: Record<string, any>) => {
            return logbookService.execute(action as LogbookAction, payload)
        }
    }, {
        name: "document_processor",
        description: "Use it whenever user needs to process or transform text like summary, synthesis etc.",
        actions: [
            {
                name: "synthesize",
                description: "Use when a synthesis of a document in the context of user query is needed",
                instructions: `
                    {
                        "query:" : "User query related to synthesis",
                        "documents": [..documents' exact uuids..]
                    }
                    `,
            }
        ],
        executor: (action: string, payload: Record<string, any>) => {
            return documentProcessorService.execute(action as DocumentAction, payload)
        }
    },
    {
        name: "web",
        description: "Use it whenever user needs to scrape a webpage",
        actions: [
            {
                name: "scrape_url",
                description: "Use when a synthesis of a document in the context of user query is needed",
                instructions: `
                    {
                        "url:" : "url of the webpage to scrape"
                    }
                    `,
            }
        ],
        executor: (action: string, payload: Record<string, any>) => {
            return webService.execute(action as WebAction, payload)
        }
    }
]

export const formatted_tools =
    "- final_answer: Use whenever you are ready to respond directly to the user, ask auxiliary question or clarify sth that requires information from the user ',\n" +
    tool_registry.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')