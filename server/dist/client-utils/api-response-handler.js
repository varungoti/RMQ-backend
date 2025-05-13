"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWrappedResponse = isWrappedResponse;
exports.extractData = extractData;
exports.isSuccessful = isSuccessful;
exports.getMessage = getMessage;
exports.processResponse = processResponse;
function isWrappedResponse(response) {
    return Boolean(response &&
        typeof response === 'object' &&
        'success' in response &&
        'data' in response);
}
function extractData(response) {
    return isWrappedResponse(response) ? response.data : response;
}
function isSuccessful(response, legacySuccessProperty = 'isCorrect') {
    if (!response) {
        return false;
    }
    if (isWrappedResponse(response)) {
        return response.success === true;
    }
    return typeof response === 'object' && response[legacySuccessProperty] === true;
}
function getMessage(response, fallbackMessage = 'Operation completed') {
    if (response &&
        typeof response === 'object' &&
        'message' in response &&
        typeof response.message === 'string') {
        return response.message;
    }
    return fallbackMessage;
}
function processResponse(response, options = {}) {
    const { legacySuccessProperty = 'isCorrect', fallbackMessage = 'Operation completed', onSuccess, onError } = options;
    const isWrappedFormat = isWrappedResponse(response);
    const data = extractData(response);
    const success = isSuccessful(response, legacySuccessProperty);
    const message = getMessage(response, fallbackMessage);
    if (success && onSuccess) {
        onSuccess(data);
    }
    else if (!success && onError) {
        onError(message);
    }
    return {
        data,
        success,
        message,
        isWrappedFormat
    };
}
//# sourceMappingURL=api-response-handler.js.map