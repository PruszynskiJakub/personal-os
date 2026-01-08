import {Langfuse, type LangfuseGenerationClient, type LangfuseSpanClient, type LangfuseTraceClient} from 'langfuse';
import {v4 as uuidv4} from 'uuid';
import type {CoreMessage} from "ai";
import {ChatPromptClient, TextPromptClient} from "langfuse-core";

const langfuse = new Langfuse({
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
});

langfuse.on('error', (error: Error) => {
    console.error('Langfuse error:', error);
});

function createLangfuseService(langfuse: Langfuse) {

    return {
        getTextPrompt: async (name: string, label: string = 'production', version?: number): Promise<TextPromptClient> => {
            return langfuse.getPrompt(name, version, {type: 'text', label: label});
        },

        getChatPrompt: async (name: string, label: string = 'production', version?: number): Promise<ChatPromptClient> => {
            return langfuse.getPrompt(name, version, {type: 'chat', label: label})
        },

        initializeTrace: (body: { name: string, session_id: string }): LangfuseTraceClient => {
            return langfuse.trace({
                id: uuidv4(),
                sessionId: body.session_id,
                name: body.name,
                userId: process.env.USER_ID,
            })
        },

        startSpan: (observation: LangfuseSpanClient | LangfuseTraceClient, body: {
            name: string
        }): LangfuseSpanClient => {
            return observation.span({
                name: body.name,
            })
        },

        endSpan: (span: LangfuseSpanClient, body: { output: unknown }) => {
            span.end({
                output: body.output
            })
        },

        startGeneration: (observation: LangfuseSpanClient | LangfuseTraceClient, body: {
            name: string,
            model: string,
            input: unknown
        }): LangfuseGenerationClient => {
            return observation.generation({
                name: body.name,
                model: body.model,
                input: body.input
            })
        },

        endGeneration: (generation: LangfuseGenerationClient, body: { output: unknown }) => {
            generation.end({
                output: body.output
            })
        },

        finalizeTrace: (trace: LangfuseTraceClient, body: { messages: CoreMessage[], completion: string }) => {
            trace.update({
                input: body.messages,
                output: body.completion,
                metadata: {
                    completed_at: new Date().toISOString(),
                }
            })
        },

        async flush()  {
            await langfuse.flushAsync()
        },

        async shutdown() {
            await langfuse.shutdownAsync();
        }
    }
}

const langfuseService = createLangfuseService(langfuse)

export {
    langfuseService
}