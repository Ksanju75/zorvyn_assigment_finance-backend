export const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  console.error(`Stack: ${err.stack}`);
  
  // Custom API errors
  if (err.type === 'validation_error') {
    return res.status(400).json({
      success: false,
      error: err.message,
      details: err.details || []
    });
  }
  
  if (err.type === 'not_found') {
    return res.status(404).json({
      success: false,
      error: err.message
    });
  }
  
  if (err.type === 'unauthorized') {
    return res.status(401).json({
      success: false,
      error: err.message
    });
  }
  
  if (err.type === 'forbidden') {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }
  
  // Database errors
  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation',
      details: err.message
    });
  }
  
  // Default error
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const createError = (message, type = 'api_error', statusCode = 500, details = []) => {
  const error = new Error(message);
  error.type = type;
  error.statusCode = statusCode;
  error.details = details;
  return error;
};

export default { errorHandler, createError };
