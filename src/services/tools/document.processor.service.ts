import type {Document} from "../../types/agent.ts";

export type DocumentAction = 'synthesize'


const documentProcessorService = {

    execute: async (
        action: DocumentAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'synthesize':
                throw Error(`Synthesize action 'synthesize' must be defined`);
        }
    }
}

export {documentProcessorService}