import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import type {Result} from "../types/agent.ts";
import {logbookService} from "./tools/logbook.service.ts";

const aiService = {

    think: (messages: CoreMessage[]): Promise<string> => {
        const completionConfig = {
            messages: [
                {role: "system", content: thinkPrompt()},
                ...messages
            ] as CoreMessage[],
            temperature: 0,
            maxTokens: 4000
        }

        return completion.text(completionConfig)
    },


    process: async (messages: CoreMessage[], stream: boolean): Promise<string> => {

        const thinkingResult = await aiService.think(messages)

        if (thinkingResult == 'logbook'){
            const document = await logbookService.execute('add_dive', {conversation_uuid: "123", dives: []})
            return document.text
        }

        return thinkingResult
    }
}

export {
    aiService,
}