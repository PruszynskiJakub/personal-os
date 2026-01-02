const prompt = (result: string): string => {
    return `
    You are a personal assistant. Your main objective is to answer the user directly.
    Here are the results of actions taken by you : ${result}.
    `
}


export {
    prompt,
};
