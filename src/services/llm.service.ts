import {embed, generateObject, generateText, streamObject, streamText, tool} from "ai";
import {google} from "@ai-sdk/google";
import {openai} from '@ai-sdk/openai';
import type {CompletionConfig} from "../types/llm.ts";

export const modelId = "gemini-2.5-flash"
const model = google(modelId)

const completion = {
    text: async ({max_tokens = 16384, ...config}: CompletionConfig): Promise<string> => {
        const result = await generateText({
                model: model,
                ...config,
                maxTokens: max_tokens,
            }
        )

        return result.text
    },
    stream: ({max_tokens = 16384, ...config}: CompletionConfig): AsyncIterable<string> => {
        const result = streamText({
            model: model,
            ...config,
            maxTokens: max_tokens,
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
    },
    streamObject: <T = unknown>({max_tokens = 16384, ...config}: CompletionConfig): {
        textStream: AsyncIterable<string>;
        object: Promise<T>;
    } => {
        const result = streamObject({
            model: model,
            ...config,
            maxTokens: max_tokens,
            output: 'no-schema'
        });

        return {
            textStream: result.textStream,
            object: result.object as Promise<T>
        };
    }
}

const embedding = async (text: string): Promise<number[]> => {
    const {embedding} = await embed({
        model: openai.textEmbeddingModel('text-embedding-3-large'),
        value: text
    });

    return embedding;
};

export {
    completion,
    embedding
}