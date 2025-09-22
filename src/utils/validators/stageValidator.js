/**
 * Stage Data Validator
 * Ensures all required fields are present and valid before database operations
 */

// Valid enum values from database
const VALID_STATUSES = ['not_ready', 'in_progress', 'blocked', 'completed'];
const VALID_CATEGORIES = [
  'onboarding', 
  'research', 
  'strategy', 
  'brand_building', 
  'brand_collaterals', 
  'brand_activation',
  'employer_branding',
  'project_closure'
];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];
const VALID_DEPENDENCIES = ['none', 'client_materials', 'external_vendor'];

/**
 * Validate a single stage object
 * @param {Object} stage - The stage object to validate
 * @param {boolean} isUpdate - Whether this is an update operation (some fields optional)
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validateStage = (stage, isUpdate = false) => {
  const errors = [];
  
  // Required fields for new stages
  const requiredFields = isUpdate ? [] : [
    'project_id',
    'number_index', 
    'name',
    'category',
    'status'
  ];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!stage[field] && stage[field] !== 0) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate project_id format (UUID)
  if (stage.project_id && !isValidUUID(stage.project_id)) {
    errors.push(`Invalid project_id format: ${stage.project_id}`);
  }
  
  // Validate number_index
  if (stage.number_index !== undefined) {
    if (typeof stage.number_index !== 'number' || stage.number_index < 1) {
      errors.push(`Invalid number_index: must be a positive number`);
    }
  }
  
  // Validate status enum
  if (stage.status && !VALID_STATUSES.includes(stage.status)) {
    errors.push(`Invalid status: ${stage.status}. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  
  // Validate category enum
  if (stage.category && !VALID_CATEGORIES.includes(stage.category)) {
    errors.push(`Invalid category: ${stage.category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
  }
  
  // Validate blocking_priority enum
  if (stage.blocking_priority && !VALID_PRIORITIES.includes(stage.blocking_priority)) {
    errors.push(`Invalid blocking_priority: ${stage.blocking_priority}. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }
  
  // Validate resource_dependency enum
  if (stage.resource_dependency && !VALID_DEPENDENCIES.includes(stage.resource_dependency)) {
    errors.push(`Invalid resource_dependency: ${stage.resource_dependency}. Must be one of: ${VALID_DEPENDENCIES.join(', ')}`);
  }
  
  // Validate dates
  if (stage.start_date && stage.end_date) {
    const start = new Date(stage.start_date);
    const end = new Date(stage.end_date);
    
    if (isNaN(start.getTime())) {
      errors.push(`Invalid start_date format: ${stage.start_date}`);
    }
    if (isNaN(end.getTime())) {
      errors.push(`Invalid end_date format: ${stage.end_date}`);
    }
    if (start >= end) {
      errors.push(`End date must be after start date`);
    }
  }
  
  // Validate duration
  if (stage.estimated_duration !== undefined) {
    if (typeof stage.estimated_duration !== 'number' || stage.estimated_duration < 1) {
      errors.push(`Invalid estimated_duration: must be a positive number`);
    }
  }
  
  // Validate boolean fields
  const booleanFields = ['is_deliverable', 'client_facing'];
  booleanFields.forEach(field => {
    if (stage[field] !== undefined && typeof stage[field] !== 'boolean') {
      errors.push(`Invalid ${field}: must be a boolean`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate multiple stages
 * @param {Array} stages - Array of stage objects
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} - { valid: boolean, errors: Object[] }
 */
export const validateStages = (stages, isUpdate = false) => {
  const results = [];
  let allValid = true;
  
  stages.forEach((stage, index) => {
    const validation = validateStage(stage, isUpdate);
    if (!validation.valid) {
      allValid = false;
      results.push({
        index,
        stage: stage.name || `Stage ${index + 1}`,
        errors: validation.errors
      });
    }
  });
  
  return {
    valid: allValid,
    invalidStages: results
  };
};

/**
 * Clean and fix common stage data issues
 * @param {Object} stage - The stage object to clean
 * @returns {Object} - Cleaned stage object
 */
export const cleanStageData = (stage) => {
  const cleaned = { ...stage };
  
  // Fix common status typos
  if (cleaned.status === 'not_started') {
    cleaned.status = 'not_ready';
  }
  
  // Fix resource dependency variations
  if (cleaned.resource_dependency === 'client_input') {
    cleaned.resource_dependency = 'client_materials';
  } else if (cleaned.resource_dependency === 'roee_approval') {
    cleaned.resource_dependency = 'none';
  }
  
  // Ensure booleans are actual booleans
  if (cleaned.is_deliverable !== undefined) {
    cleaned.is_deliverable = Boolean(cleaned.is_deliverable);
  }
  if (cleaned.client_facing !== undefined) {
    cleaned.client_facing = Boolean(cleaned.client_facing);
  }
  
  // Set defaults for missing optional fields
  if (!cleaned.blocking_priority) {
    cleaned.blocking_priority = 'medium';
  }
  if (!cleaned.resource_dependency) {
    cleaned.resource_dependency = 'none';
  }
  if (cleaned.estimated_duration === undefined) {
    cleaned.estimated_duration = 3;
  }
  
  // Remove any undefined or null values
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined || cleaned[key] === null) {
      delete cleaned[key];
    }
  });
  
  return cleaned;
};

/**
 * Helper function to validate UUID format
 */
function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default {
  validateStage,
  validateStages,
  cleanStageData,
  VALID_STATUSES,
  VALID_CATEGORIES,
  VALID_PRIORITIES,
  VALID_DEPENDENCIES
};