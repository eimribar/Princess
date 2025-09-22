/**
 * Input Sanitization Utility
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * HTML entities map for escaping
 */
const htmlEntities = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escape HTML entities to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/[&<>"'`=\/]/g, (char) => htmlEntities[char]);
}

/**
 * Sanitize user input for display
 * Allows basic formatting but removes dangerous content
 * @param {string} input - User input to sanitize
 * @param {object} options - Sanitization options
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input, options = {}) {
  if (!input || typeof input !== 'string') return '';
  
  const {
    allowLineBreaks = true,
    allowBasicFormatting = false,
    maxLength = 10000
  } = options;
  
  // Trim and limit length
  let sanitized = input.trim().substring(0, maxLength);
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Remove control characters except newlines and tabs
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Escape HTML entities
  sanitized = escapeHtml(sanitized);
  
  // Optionally preserve line breaks
  if (allowLineBreaks) {
    sanitized = sanitized.replace(/\n/g, '<br>');
  }
  
  // Optionally allow basic formatting (bold, italic)
  if (allowBasicFormatting) {
    // Convert **text** to <strong>text</strong>
    sanitized = sanitized.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Convert *text* to <em>text</em>
    sanitized = sanitized.replace(/\*(.+?)\*/g, '<em>$1</em>');
  }
  
  return sanitized;
}

/**
 * Sanitize data object recursively
 * @param {object} data - Data object to sanitize
 * @param {array} fieldsToSanitize - Specific fields to sanitize
 * @returns {object} Sanitized data object
 */
export function sanitizeData(data, fieldsToSanitize = []) {
  if (!data || typeof data !== 'object') return data;
  
  const defaultFields = ['name', 'title', 'description', 'content', 'feedback', 'comment', 'text', 'message'];
  const fields = fieldsToSanitize.length > 0 ? fieldsToSanitize : defaultFields;
  
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in sanitized) {
    if (sanitized.hasOwnProperty(key)) {
      const value = sanitized[key];
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeData(value, fieldsToSanitize);
      }
      // Sanitize string fields
      else if (typeof value === 'string' && fields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = sanitizeInput(value);
      }
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
export function sanitizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  
  // Basic email regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  // Trim and lowercase
  const sanitized = email.trim().toLowerCase();
  
  // Validate
  if (!emailRegex.test(sanitized)) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string|null} Sanitized URL or null if invalid
 */
export function sanitizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parsed = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.toString();
  } catch (error) {
    return null;
  }
}

/**
 * Sanitize file name
 * @param {string} filename - File name to sanitize
 * @returns {string} Sanitized file name
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'file';
  
  // Remove path components
  filename = filename.split(/[\/\\]/).pop();
  
  // Remove dangerous characters
  filename = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Limit length
  if (filename.length > 255) {
    const ext = filename.split('.').pop();
    const name = filename.substring(0, 250 - ext.length);
    filename = `${name}.${ext}`;
  }
  
  return filename || 'file';
}

/**
 * Create a safe HTML string from user content
 * Use this when you need to display user content as HTML
 * @param {string} content - Content to make safe
 * @returns {object} Safe HTML object for React dangerouslySetInnerHTML
 */
export function createSafeHtml(content) {
  const sanitized = sanitizeInput(content, {
    allowLineBreaks: true,
    allowBasicFormatting: true
  });
  
  return {
    __html: sanitized
  };
}

export default {
  escapeHtml,
  sanitizeInput,
  sanitizeData,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFilename,
  createSafeHtml
};