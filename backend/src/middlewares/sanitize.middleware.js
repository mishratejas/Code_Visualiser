import sanitizeHtml from 'sanitize-html';

const sanitizeMiddleware = (req, res, next) => {
  // Helper function to sanitize recursively
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any $ or . characters that could be used for NoSQL injection
        obj[key] = obj[key].replace(/[$]/g, '_');
        
        // Sanitize HTML
        obj[key] = sanitizeHtml(obj[key], {
          allowedTags: [],
          allowedAttributes: {}
        }).trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  // Sanitize query parameters by creating new object
  if (req.query && typeof req.query === 'object') {
    const sanitizedQuery = {};
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        sanitizedQuery[key] = req.query[key]
          .replace(/[$]/g, '_')
          .trim();
      } else {
        sanitizedQuery[key] = req.query[key];
      }
    }
    req.query = sanitizedQuery;
  }

  // Sanitize route parameters
  if (req.params && typeof req.params === 'object') {
    const sanitizedParams = {};
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        sanitizedParams[key] = req.params[key]
          .replace(/[$]/g, '_')
          .trim();
      } else {
        sanitizedParams[key] = req.params[key];
      }
    }
    req.params = sanitizedParams;
  }

  next();
};

export default sanitizeMiddleware;