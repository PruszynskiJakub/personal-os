import {type LogbookAction, logbookService} from "../services/tools/logbook.service.ts";

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
    }
]

export const formatted_tools = tool_registry.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')