import {generateText, streamText} from "ai";
import {google} from "@ai-sdk/google";
import type {CompletionConfig} from "../types/llm.ts";

const model = google('gemini-2.5-flash')

const completion = {
    text: async ({maxTokens = 16384, ...config}: CompletionConfig): Promise<string> => {
        const result = await generateText({
                model: model,
                ...config,
                maxTokens: maxTokens,
            }
        )

        return result.text
    },
    stream: ({maxTokens = 16384, ...config}: CompletionConfig): AsyncIterable<string> => {
        const result = streamText({
            model: model,
            ...config,
            maxTokens: maxTokens,
        })

        return result.textStream
    }
}

export {
    completion
}