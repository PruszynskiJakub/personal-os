import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import type {Result} from "../types/agent.ts";

const aiService = {

    answer:  (messages: CoreMessage[], stream: boolean): Promise<Result> | AsyncIterable<string> => {
        const completionConfig = {
            messages: [
                {role: "system", content: thinkPrompt()},
                ...messages
            ] as CoreMessage[],
            temperature: 0,
            maxTokens: 4000
        }

        const result = completion.object<Result>(completionConfig)

        return result

        // if (stream){
        //     return completion.stream();
        // }else {
        //     return completion.text(completionConfig)
        // }
    }
}

export {
    aiService,
}