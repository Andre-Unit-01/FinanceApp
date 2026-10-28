import { sendApiRequest } from '../repositories/httpRepository.js';

// This service is the simple application-facing API.
// UI components call it instead of knowing how the HTTP repository works.
export const apiFetch = (path, token, options) => sendApiRequest(path, token, options);