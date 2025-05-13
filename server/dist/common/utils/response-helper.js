"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractResponseData = extractResponseData;
exports.isResponseSuccessful = isResponseSuccessful;
exports.getResponseMessage = getResponseMessage;
exports.isHybridResponse = isHybridResponse;
exports.createHybridResponse = createHybridResponse;
function extractResponseData(response) {
    if (response && typeof response === 'object' && 'data' in response && 'success' in response) {
        return response.data;
    }
    return response;
}
function isResponseSuccessful(response, successProp) {
    if (!response) {
        return false;
    }
    if (typeof response === 'object' && 'success' in response) {
        return response.success === true;
    }
    if (successProp && typeof response === 'object' && successProp in response) {
        return Boolean(response[successProp]);
    }
    if (typeof response === 'object') {
        if ('isCorrect' in response) {
            return Boolean(response.isCorrect);
        }
        if ('isValid' in response) {
            return Boolean(response.isValid);
        }
    }
    return true;
}
function getResponseMessage(response, fallbackMessage = 'Operation completed') {
    if (!response) {
        return fallbackMessage;
    }
    if (typeof response === 'object' && 'message' in response) {
        return response.message || fallbackMessage;
    }
    return fallbackMessage;
}
function isHybridResponse(obj) {
    return obj !== null
        && typeof obj === 'object'
        && 'success' in obj
        && typeof obj.success === 'boolean';
}
function createHybridResponse(data, messageOrSuccess = '', successOrProps = true) {
    let message = '';
    let success = typeof successOrProps === 'boolean' ? successOrProps : true;
    if (typeof messageOrSuccess === 'boolean') {
        success = messageOrSuccess;
    }
    else {
        message = messageOrSuccess;
    }
    const additionalProps = typeof successOrProps === 'object' ? successOrProps : {};
    if (data === null || data === undefined) {
        return {
            success,
            message,
            data: null,
            ...additionalProps
        };
    }
    if (data && typeof data === 'object' && 'success' in data) {
        return data;
    }
    if (typeof data !== 'object') {
        return {
            success,
            message,
            data,
            ...additionalProps
        };
    }
    const result = {
        ...data,
        success,
        message: message || '',
        data,
        ...additionalProps
    };
    return result;
}
//# sourceMappingURL=response-helper.js.map