export declare class WordTokenizer {
    tokenize(text: string): string[];
}
export declare class TfIdf {
    private documents;
    constructor();
    addDocument(doc: string): void;
    tfidfs(query: string): number[];
    reset(): void;
}
export declare const PorterStemmer: {
    stem: (word: string) => string;
};
export declare class SentimentAnalyzer {
    type: string;
    constructor(language: string, stemmer: any, type: string);
    getSentiment(tokens: string[]): number;
}
