import {type LogbookAction, logbookService} from "../services/tools/logbook.service.ts";

export const toolRegistry = [
    {
        name: "logbook",
        description: "Use whenever users wants to register, update or remove diving or climbing records.",
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
                                duration: number, //required
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
                `
            }
        ],
        executor: (action: string, payload: Record<string, any>) => {
            return logbookService.execute(action as LogbookAction, payload)
        }
    }
]