import {toolRegistry} from "../config/tools.config.ts";

const prompt = (tool: string): string => {
    const tool_actions = toolRegistry.find(t => t.name === tool);

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
        ${tool_actions?.actions.map((action) => `
            <action_name>${action.name}</action_name>
            <description>${action.description}</description>
            <payload>${action.instructions}</payload>
        `)}
    </available_actions>
    
    Remember json and nothing else.
    `
}


export {
    prompt,
};
