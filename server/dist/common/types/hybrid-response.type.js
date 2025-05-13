"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHybridResponse = isHybridResponse;
function isHybridResponse(response) {
    if (typeof response !== 'object' || response === null) {
        return false;
    }
    if (!('success' in response && 'data' in response)) {
        return false;
    }
    const dataProperties = Object.keys(response.data || {});
    return dataProperties.some(key => key in response && key !== 'success' && key !== 'data' && key !== 'message');
}
//# sourceMappingURL=hybrid-response.type.js.map