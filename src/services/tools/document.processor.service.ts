import type {Document} from "../../types/agent.ts";
import {z} from "zod";
import {documentService} from "../document.service.ts";
import {completion} from "../llm.service.ts";
import type {CompletionConfig} from "../../types/llm.ts";
import {prompt as synthetizePrompt} from '../../prompts/synthetize.ts'

export type DocumentAction = 'synthesize'

const synthetizeDocumentsSchema = z.object({
    conversation_uuid: z.string(),
    uuids: z.array(z.string()),
    query: z.string()
})

const documentProcessorService = {

    execute: async (
        action: DocumentAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'synthesize':
                const {conversation_uuid, uuids, query} = synthetizeDocumentsSchema.parse(payload);
                const documents = await Promise.all(
                    uuids.map(async uuid => {
                        const doc = await documentService.getDocumentByUuid(uuid)
                        if (!doc) {
                            return documentService.createErrorDocument({
                                conversation_uuid: conversation_uuid,
                                error: `The document with uuid: ${uuid} not found`,
                                error_context: `Fetching document for synthesize`
                            })
                        } else {
                            return doc
                        }
                    })
                )

                const answer = ""

                for(const doc of documents) {
                    const completion_config: CompletionConfig = {
                        messages: [
                            {role: 'system', content: synthetizePrompt(query, answer)},
                            {role: 'user', content: '...' }, //TODO('Improve it !!!')

                        ],
                        temperature: 0,
                        max_tokens: 4000
                    }

                    const result = completion.text(completion_config)
                    //TODO('Improve it !!!')
                }

                return documentService.createDocument({
                    conversation_uuid: conversation_uuid,
                    text: answer || 'No synthesis generated',
                })
        }
    }
}

export {documentProcessorService}