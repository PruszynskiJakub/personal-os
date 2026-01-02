const prompt = (): string => {
    return `
    You decided to use logbook tool.
    Now it's time to choose the most fitting action and generate payload for it.
    
    Today is ${new Date().toISOString()}.
    
    Return JSON object:
    {
        "result": {
            "action": "[...exact name of picked action...]",
            "payload" : {...json object with all required fields...}
        }
    }
    
    <available_actions>
    <action>
        <name>add_dive</name>
        <description>Use this action whenever user wants to record one or more dives</description>
        <payload>
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
        </payload>
    </action>
    
    
    </available_actions>
    
    Remember json and nothing else.
    `
}


export {
    prompt,
};
