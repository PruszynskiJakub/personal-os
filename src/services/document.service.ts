import {v4 as uuidv4} from 'uuid';
import type {Document} from "../types/agent.ts";


function createDocumentService() {

    const documents:Map<string, Document> = new Map<string, Document>();

    return {
        async createDocument(params: {
            uuid?: string,
            conversation_uuid: string,
            text: string,
            source_uuid?: string,
        }): Promise<Document> {
            const document_uuid = params.uuid ?? uuidv4();
            const now = new Date().toISOString()

            const document: Document = {
                uuid: document_uuid,
                conversation_uuid: params.conversation_uuid,
                source_uuid: params.source_uuid || '',
                text: params.text,
                created_at: now,
                updated_at: now,
                metadata: {
                    uuid: document_uuid,
                    conversation_uuid: params.conversation_uuid,
                    source_uuid: params.source_uuid || '',
                    content_type: 'full',
                }
            }

            documents.set(document_uuid, document)

            return document
        },

        async getDocumentByUuid(uuid: string): Promise<Document | null> {
            try {
                return documents.get(uuid) ?? null;
            } catch (error) {
                console.error(`Failed to fetch document with UUID ${uuid}:`, error);
                return null
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