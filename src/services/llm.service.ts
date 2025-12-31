import {type CoreMessage, generateText, streamText} from "ai";
import {google} from "@ai-sdk/google";


const completion = {
    text: async (config: { messages: CoreMessage[], temperature: number, maxTokens: number }): Promise<string> => {
        const result = await generateText({
                model: google('gemini-2.5-flash'),
                messages: config.messages,
                temperature: config.temperature,
                maxTokens: config.maxTokens
            }
        )

        return result.text
    },
    stream:  (config: { messages: CoreMessage[], temperature: number, maxTokens: number }): AsyncIterable<string> => {
        const result = streamText({
            model: google('gemini-2.5-flash'),
            messages: config.messages,
            temperature: config.temperature,
            maxTokens: config.maxTokens
        })

        return result.textStream
    }
}

export {
    completion
}