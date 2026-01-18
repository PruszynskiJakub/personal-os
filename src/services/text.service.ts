import type {Document, DocumentMetadata} from "../types/agent.ts";
import {v4 as uuidv4} from 'uuid';

const textService = {

    split: (text: string, limit: number, metadata?: DocumentMetadata): Document[] => {
        if (!text) {
            console.error("Text is mandatory");
        }

        const chunks: Document[] = []
        let currentChunk = ""
        let chunkIndex = 0;

        const words = text.split(' ');
        for (const word of words) {
            if ((currentChunk + word).length > limit) {
                if (currentChunk) {
                    const chunk_uuid = uuidv4()

                    chunks.push({
                        uuid: chunk_uuid,
                        source_uuid: metadata?.uuid || "",
                        conversation_uuid: metadata?.conversation_uuid || "",
                        text: currentChunk.trim(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                        metadata: {
                            uuid: chunk_uuid,
                            chunk_index: chunkIndex,
                            source_uuid: metadata?.uuid || "",
                            conversation_uuid: metadata?.conversation_uuid || "",
                            content_type: (metadata?.content_type || 'chunk') as 'chunk' | 'full',
                        }
                    })
                }
                currentChunk = word + " ";
                chunkIndex++;
            } else {
                currentChunk += word + " ";
            }
        }

        return chunks;
    }
}

export {textService};