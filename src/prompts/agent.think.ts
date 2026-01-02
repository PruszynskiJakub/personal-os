const prompt = (): string => {
    return `
    Identify user intention.
    You may return 'answer' or 'logbook'.
    Return 'logbook' whenever the user desire to log a dive.
    Return 'answer' otherwise.
    Return only single word and nothing else.
    `
}


export {
    prompt,
};
