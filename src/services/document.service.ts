import {v4 as uuidv4} from 'uuid';
import type {Document} from "../types/agent.ts";


function createDocumentService() {
    return {
        async createDocument(params: {
            uuid?: string,
            conversation_uuid: string,
            text: string,
        }): Promise<Document> {
            const document_uuid = params.uuid ?? uuidv4();
            const now = new Date().toISOString()

            return {
                uuid: document_uuid,
                conversation_uuid: params.conversation_uuid,
                text: params.text,
                created_at: now,
                updated_at: now,
            }
        },

        async createErrorDocument(params: {
            conversation_uuid: string,
            error: any,
            error_context: string,
        }): Promise<Document> {
            const error_message = params.error instanceof Error ? params.error.message : "Unknown error"

            return documentService.createDocument({
                conversation_uuid: params.conversation_uuid,
                text: `Error ${error_message}.\nContext: ${params.error_context}`
            })
        }
    }
}

const documentService = createDocumentService();

export {
    documentService,
};