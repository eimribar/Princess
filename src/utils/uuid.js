/**
 * UUID Generation Utility
 * Provides secure UUID v4 generation
 */

/**
 * Generate a UUID v4
 * @returns {string} A UUID v4 string
 */
export function generateUUID() {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback to manual UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generate a short ID (8 characters)
 * Less collision-resistant than UUID but more readable
 * @returns {string} A short unique ID
 */
export function generateShortId() {
  // Use timestamp + random for better uniqueness
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 6);
  const counterPart = (idCounter++).toString(36).padStart(2, '0');
  return `${timestamp}-${randomPart}${counterPart}`;
}

// Counter for short IDs to prevent collisions
let idCounter = 0;

/**
 * Validate if a string is a valid UUID
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if valid UUID
 */
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a prefixed ID
 * Useful for entity-specific IDs
 * @param {string} prefix - The prefix for the ID
 * @returns {string} A prefixed unique ID
 */
export function generatePrefixedId(prefix) {
  const uuid = generateUUID();
  return `${prefix}_${uuid}`;
}

/**
 * Generate a time-sortable ID
 * IDs generated close in time will sort together
 * @returns {string} A time-sortable unique ID
 */
export function generateTimeSortableId() {
  const timestamp = Date.now().toString(36).padStart(11, '0');
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

export default {
  generateUUID,
  generateShortId,
  isValidUUID,
  generatePrefixedId,
  generateTimeSortableId
};