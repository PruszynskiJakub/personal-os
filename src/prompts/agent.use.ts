import {tool_registry} from "../config/tools.config.ts";
import type {State} from "../types/agent.ts";
import {currentCall} from "../utils/agent.ts";

const prompt = (state: State): string => {
    const current_call = currentCall(state)!!
    const tool_actions = tool_registry.find(t => t.name === current_call.tool);

    return `
    You decided to use ${current_call.tool}.
    Now it's time to choose the most fitting action and generate payload for it.
    You MUST choose only single action. Do it carefully based on your own thoughts. 
    You are working in the loop.
    
    Today is ${new Date().toISOString()}.
    Your thoughts ${state.thoughts?.next_action}.
    
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
    
    <documents>
    ${state.documents?.map(document => `
        <document uuid="${document.uuid}" description="${document.metadata.description}">
            ${document.text}
        </document>
    `) }
    </documents>
    
    Remember json and nothing else.
    CRITICAL: The action must be choosen based on your thoughts.
    `
}


export {
    prompt,
};
