import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import {prompt as usePrompt} from "../prompts/agent.use.ts"
import {logbookService} from "./tools/logbook.service.ts";

const aiService = {

    think: (messages: CoreMessage[]): Promise<string> => {
        const completionConfig = {
            messages: [
                {role: "system", content: thinkPrompt()},
                ...messages
            ] as CoreMessage[],
            temperature: 0,
            max_tokens: 4000
        }

        return completion.text(completionConfig)
    },

    use: async (messages: CoreMessage[]): Promise<Record<string, any>> => {
        const completionConfig = {
            messages: [
                {role: "system", content: usePrompt()},
                ...messages
            ] as CoreMessage[],
            temperature: 0,
            max_tokens: 4000
        }

        const result = await completion.object<{"result": Record<string, any>}>(completionConfig)

        return result.result
    },


    process: async (messages: CoreMessage[], stream: boolean): Promise<string> => {

        const thinkingResult = await aiService.think(messages)

        console.log("Thinking result is ...: ", thinkingResult)

        if (thinkingResult == 'logbook') {

            const useResult = await aiService.use(messages)

            console.log("Use result: ", useResult)

            if (useResult['action'] == 'add_dive') {

                const document = await logbookService.execute('add_dive', {conversation_uuid: "123", ...useResult['payload']})
                console.log("Logbook execution result: ", document)
                return document.text
            }
        }

        return thinkingResult
    }
}

export {
    aiService,
}