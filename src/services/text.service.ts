import type {Document} from "../types/agent.ts";
import {v4 as uuidv4} from 'uuid';

const textService = {

    split: (text: string, limit: number, metadata?: {
        uuid: string,
        conversation_uuid: string,
        source_uuid?: string | null,
    }): Document[] => {
        if (!text) {
            console.error("Text is mandatory");
        }

        const chunks: Document[] = []
        let currentChunk = ""

        const words = text.split(' ');
        for (const word of words) {
            if ((currentChunk + word).length > limit) {
                if (currentChunk) chunks.push({
                    uuid: uuidv4(),
                    source_uuid: metadata?.uuid || "",
                    conversation_uuid: metadata?.conversation_uuid || "",
                    text: currentChunk.trim(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                currentChunk = word + " ";
            } else {
                currentChunk += word + " ";
            }
        }

        return chunks;
    }
}

export {textService};