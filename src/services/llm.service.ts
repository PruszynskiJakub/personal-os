import {generateObject, generateText, streamObject, streamText, tool} from "ai";
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
    },
    object: async <T = unknown>(config: CompletionConfig): Promise<T> => {
        try {
            const {object} = await generateObject({
                model: model,
                ...config,
                output: 'no-schema'
            });
            return object as T;
        } catch (error) {
            throw new Error(`Object completion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}

export {
    completion
}