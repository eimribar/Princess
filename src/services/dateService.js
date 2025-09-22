/**
 * Centralized Date Service
 * Handles all date formatting and conversion consistently across the application
 */

import { format, parseISO, startOfDay, isValid, formatISO } from 'date-fns';

class DateService {
  /**
   * Convert any date to ISO string for database storage (with time)
   * @param {Date|string} date - Date object or string
   * @returns {string|null} - ISO string or null
   */
  toDatabase(date) {
    if (!date) return null;
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toDatabase:', date);
        return null;
      }
      return d.toISOString();
    } catch (error) {
      console.error('Error converting date to database format:', error);
      return null;
    }
  }
  
  /**
   * Convert date to YYYY-MM-DD format for DATE columns (no time)
   * @param {Date|string} date - Date object or string
   * @returns {string|null} - Date string or null
   */
  toDatabaseDate(date) {
    if (!date) return null;
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toDatabaseDate:', date);
        return null;
      }
      return format(d, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error converting date to database date format:', error);
      return null;
    }
  }
  
  /**
   * Convert date for display in UI (MM/DD/YYYY format)
   * @param {Date|string} date - Date object or string
   * @returns {string} - Formatted date string
   */
  toDisplay(date) {
    if (!date) return '';
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toDisplay:', date);
        return '';
      }
      return format(d, 'MM/dd/yyyy');
    } catch (error) {
      console.error('Error formatting date for display:', error);
      return '';
    }
  }
  
  /**
   * Convert date for display with time
   * @param {Date|string} date - Date object or string
   * @returns {string} - Formatted date-time string
   */
  toDisplayWithTime(date) {
    if (!date) return '';
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toDisplayWithTime:', date);
        return '';
      }
      return format(d, 'MM/dd/yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date-time for display:', error);
      return '';
    }
  }
  
  /**
   * Convert date for timeline display (short format)
   * @param {Date|string} date - Date object or string
   * @returns {string} - Short formatted date
   */
  toTimelineFormat(date) {
    if (!date) return '';
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toTimelineFormat:', date);
        return '';
      }
      return format(d, 'MMM d');
    } catch (error) {
      console.error('Error formatting date for timeline:', error);
      return '';
    }
  }
  
  /**
   * Get start of day for consistent date comparisons
   * @param {Date|string} date - Date object or string
   * @returns {Date|null} - Start of day or null
   */
  getStartOfDay(date) {
    if (!date) return null;
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to getStartOfDay:', date);
        return null;
      }
      return startOfDay(d);
    } catch (error) {
      console.error('Error getting start of day:', error);
      return null;
    }
  }
  
  /**
   * Parse any date string safely
   * @param {string} dateString - Date string
   * @returns {Date|null} - Parsed date or null
   */
  parse(dateString) {
    if (!dateString) return null;
    
    try {
      const d = parseISO(dateString);
      if (!isValid(d)) {
        console.warn('Invalid date string:', dateString);
        return null;
      }
      return d;
    } catch (error) {
      console.error('Error parsing date:', error);
      return null;
    }
  }
  
  /**
   * Check if date is valid
   * @param {Date|string} date - Date to check
   * @returns {boolean} - True if valid
   */
  isValid(date) {
    if (!date) return false;
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      return isValid(d);
    } catch {
      return false;
    }
  }
  
  /**
   * Format date for input fields (YYYY-MM-DD)
   * @param {Date|string} date - Date object or string
   * @returns {string} - Input formatted date
   */
  toInputFormat(date) {
    if (!date) return '';
    
    try {
      const d = typeof date === 'string' ? parseISO(date) : date;
      if (!isValid(d)) {
        console.warn('Invalid date provided to toInputFormat:', date);
        return '';
      }
      return format(d, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  }
  
  /**
   * Calculate days between two dates
   * @param {Date|string} startDate - Start date
   * @param {Date|string} endDate - End date
   * @returns {number} - Number of days
   */
  daysBetween(startDate, endDate) {
    if (!startDate || !endDate) return 0;
    
    try {
      const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
      const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
      
      if (!isValid(start) || !isValid(end)) {
        console.warn('Invalid dates provided to daysBetween');
        return 0;
      }
      
      const diffMs = end.getTime() - start.getTime();
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days between:', error);
      return 0;
    }
  }
}

// Export singleton instance
const dateService = new DateService();
export default dateService;

// Also export for named imports
export { dateService };