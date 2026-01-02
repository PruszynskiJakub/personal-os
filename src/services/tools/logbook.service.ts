import type {Result} from "../../types/agent.ts";

const logbookService = {

    execute: async (
        action: string,
        payload: Record<string, unknown>,
    ): Promise<string> => {
        return Promise.any("TODO")
    }
}

export {
    logbookService
}