"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentimentAnalyzer = exports.PorterStemmer = exports.TfIdf = exports.WordTokenizer = void 0;
class WordTokenizer {
    tokenize(text) {
        return text.split(/\s+/);
    }
}
exports.WordTokenizer = WordTokenizer;
class TfIdf {
    constructor() {
        this.documents = [];
    }
    addDocument(doc) {
        this.documents.push(doc);
    }
    tfidfs(query) {
        return this.documents.map(() => 1);
    }
    reset() {
        this.documents = [];
    }
}
exports.TfIdf = TfIdf;
exports.PorterStemmer = {
    stem: (word) => word.toLowerCase()
};
class SentimentAnalyzer {
    constructor(language, stemmer, type) {
        this.type = type;
    }
    getSentiment(tokens) {
        return tokens.length > 0 ? 0.5 : 0;
    }
}
exports.SentimentAnalyzer = SentimentAnalyzer;
//# sourceMappingURL=natural-compat.js.map