import type {Document} from "./agent.ts";

export interface Tool<T> {
    execute: (action: T, payload: Record<string, any>) => Promise<Document>;
}