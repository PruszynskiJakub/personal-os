import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"

const aiService = {

    answer:  (messages: CoreMessage[], stream: boolean): Promise<string> | AsyncIterable<string> => {
        const completionConfig = {
            messages: [
                {role: "system", content: thinkPrompt()},
                ...messages
            ] as CoreMessage[],
            temperature: 0,
            maxTokens: 4000
        }

        if (stream){
            return completion.stream(completionConfig);
        }else {
            return completion.text(completionConfig)
        }
    }
}

export {
    aiService,
}