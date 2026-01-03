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
        }
    }
}

const documentService = createDocumentService();

export {
    documentService,
};