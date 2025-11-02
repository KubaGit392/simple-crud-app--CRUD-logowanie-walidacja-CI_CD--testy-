// utils/validation.js
function errorResponse(status, fieldErrors = [], msg = null) {
  return {
    timestamp: new Date().toISOString(),
    status,
    error: httpErrorTitle(status),
    fieldErrors,
    message: msg
  };
}

function httpErrorTitle(code) {
  switch (code) {
    case 400: return 'Bad Request';
    case 401: return 'Unauthorized';
    case 403: return 'Forbidden';
    case 404: return 'Not Found';
    case 409: return 'Conflict';
    case 422: return 'Unprocessable Entity';
    default: return 'Error';
  }
}

module.exports = { errorResponse };