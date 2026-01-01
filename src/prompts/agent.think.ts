const prompt = (): string => {
    return `
    Name user intention in 25 words.
    Return json object in the format:
    {
        "result": "[...user intentions...]",
    }
    `
}


export {
    prompt,
};
