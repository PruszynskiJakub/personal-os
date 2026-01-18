import type {Document} from "../../types/agent.ts";
import {documentService} from "../document.service.ts";
import {z} from "zod";

export type WebAction = 'scrape_url'

const scrapeWebpageSchema = z.object({
    conversation_uuid: z.string(),
    url: z.string()
})

const webService = {

    execute: async (
        action: WebAction,
        payload: Record<string, unknown>,
    ): Promise<Document> => {
        switch (action) {
            case 'scrape_url': {
                const {conversation_uuid, url} = scrapeWebpageSchema.parse(payload)

                try {
                    const headers = new Headers();
                    headers.append("X-API-KEY", process.env.SERPER_API_KEY || '');
                    headers.append("Content-Type", "application/json");

                    const requestOptions = {
                        method: "POST",
                        headers,
                        body: JSON.stringify({url, "includeMarkdown": true}),
                        redirect: "follow" as RequestRedirect,
                    };

                    const response = await fetch("https://scrape.serper.dev", requestOptions);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const text = await response.text();

                    return await documentService.createDocument({
                        conversation_uuid: conversation_uuid,
                        text: text,
                        description: `The content of webpage ${url}`
                    })
                } catch (error) {
                    console.error(`Error scraping webpage ${url}:`, error);
                    return await documentService.createErrorDocument({
                        conversation_uuid: conversation_uuid,
                        error: error,
                        error_context: "Scraping web page"
                    })
                }
            }
        }
    }
}

export {
    webService
}