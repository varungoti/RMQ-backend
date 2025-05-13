/**
 * Mock implementation for source-map module
 */

module.exports = {
  SourceMapGenerator: class SourceMapGenerator {
    constructor() {
      this.sourcesContent = [];
    }
    
    addMapping() {}
    
    setSourceContent() {}
    
    toString() {
      return '';
    }
  },
  
  SourceMapConsumer: class SourceMapConsumer {
    static initialize() {
      return Promise.resolve();
    }
    
    static with() {
      return Promise.resolve();
    }
  },
  
  SourceNode: class SourceNode {
    constructor() {}
    
    add() {}
    
    prepend() {}
    
    toString() {
      return '';
    }
    
    toStringWithSourceMap() {
      return { code: '', map: new this.SourceMapGenerator() };
    }
  }
}; 