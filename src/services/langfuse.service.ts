import {Langfuse, type LangfuseTraceClient} from 'langfuse';
import {v4 as uuidv4} from 'uuid';
import type {CoreMessage} from "ai";

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
        initializeTrace: (body: {name: string, session_id: string}): LangfuseTraceClient => {
            return langfuse.trace({
                id: uuidv4(),
                sessionId: body.session_id,
                name: body.name,
                userId: process.env.USER_ID,
            })
        },
        finalizeTrace: (trace: LangfuseTraceClient, body: {messages: CoreMessage[], completion: string}) => {
            trace.update({
                input: body.messages,
                output: body.completion,
                metadata: {
                    completed_at: new Date().toISOString(),
                }
            })
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