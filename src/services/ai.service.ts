import type {CoreMessage} from "ai";
import {completion} from "./llm.service.ts";
import {prompt as thinkPrompt} from "../prompts/agent.think.ts"
import {prompt as usePrompt} from "../prompts/agent.use.ts"
import type {ToolUsePayload, ToolUseResponse} from "../types/agent.ts";
import {toolRegistry} from "../config/tools.config.ts";

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

    use: async (params: { messages: CoreMessage[], tool: string }): Promise<ToolUsePayload> => {
        const completionConfig = {
            messages: [
                {role: "system", content: usePrompt(params.tool)},
                ...params.messages
            ] as CoreMessage[],
            temperature: 0,
            max_tokens: 4000
        }

        const result = await completion.object<ToolUseResponse>(completionConfig)
        return result.result
    },

    act: async (params: { messages: CoreMessage[], use_payload: ToolUsePayload, tool: string }): Promise<string> => {
        const executor = toolRegistry.find(t => t.name == params.tool)?.executor!!

        const document = await executor(params.use_payload.action, {conversation_uuid: "123", ...params.use_payload.payload})
        console.log(`${params.tool} execution result...\n ${document.text}`)

        return document.text
    },

    process: async (messages: CoreMessage[]): Promise<string> => {

        const thinkingResult = await aiService.think(messages)

        console.log("Thinking result is ...: ", thinkingResult)

        if (thinkingResult == 'logbook') {

            const useResult = await aiService.use({messages, tool: 'logbook'})

            console.log("Use result: ", useResult)

            if (useResult.payload) {
                return await aiService.act({messages, use_payload: useResult, tool: "logbook"})
            }
        }

        return thinkingResult
    }
}

export {
    aiService,
}