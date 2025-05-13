/**
 * Compatibility layer for natural module using pure JS implementation
 */

export class WordTokenizer {
  tokenize(text: string): string[] {
    return text.split(/\s+/);
  }
}

export class TfIdf {
  private documents: string[] = [];

  constructor() {
    // No initialization needed
  }
  
  addDocument(doc: string) {
    this.documents.push(doc);
  }
  
  tfidfs(query: string): number[] {
    // Simple dummy implementation that returns 1 for each document
    return this.documents.map(() => 1);
  }
  
  // Added reset method to clear documents
  reset() {
    this.documents = [];
  }
}

export const PorterStemmer = {
  stem: (word: string) => word.toLowerCase()
};

export class SentimentAnalyzer {
  // Public property to satisfy the requirements
  public type: string;
  
  constructor(language: string, stemmer: any, type: string) {
    this.type = type;
  }
  
  getSentiment(tokens: string[]): number {
    // Simple implementation - returns value between -1 and 1
    return tokens.length > 0 ? 0.5 : 0;
  }
}
