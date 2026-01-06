import {toolRegistry} from "../config/tools.config.ts";
import type {State} from "../types/agent.ts";

const prompt = (state: State): string => {
    const tool_actions = toolRegistry.find(t => t.name === state.tool);

    return `
    You decided to use ${state.tool}.
    Now it's time to choose the most fitting action and generate payload for it.
    You MUST choose only single action. Do it carefully based on your own thoughts. 
    You are working in the loop.
    
    Today is ${new Date().toISOString()}.
    Your thoughts ${state.next}.
    
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
    CRITICAL: The action must be choosen based on your thoughts.
    `
}


export {
    prompt,
};
