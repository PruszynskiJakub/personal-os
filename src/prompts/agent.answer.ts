import type {State} from "../types/agent.ts";

const prompt = (state: State): string => {
    return `
    You are a personal assistant. Your main objective is to answer the user directly.
    Here are the results of actions taken by you :
    <documents>
    ${state.documents?.map(document => `
        <document uuid="${document.uuid}">
            ${document.text}
        </document>
    `) }
    </documents>
    `
}


export {
    prompt,
};
