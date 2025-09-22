/**
 * Princess Real Data
 * Uses actual playbook data from the original Base44 project
 * All 104 steps and deliverables from the real branding process
 */

import { dataStore } from './entities';
import { playbookData } from '../components/admin/PlaybookData';
import { deliverablesByPhase } from '../components/playbook/DeliverablesPlaybookData';

// Calculate realistic project timeline
const getProjectDates = () => {
  const startDate = new Date();
  // A 104-step branding project typically takes 6-9 months with proper dependencies
  const estimatedEndDate = new Date();
  estimatedEndDate.setMonth(estimatedEndDate.getMonth() + 8); // 8 months from now
  
  return {
    start_date: startDate.toISOString(),
    estimated_completion: estimatedEndDate.toISOString(),
    created_date: startDate.toISOString()
  };
};

// Real project data based on the original
const realProject = {
  id: "proj_princess_001",
  name: "Deutsch & Co. Princess",
  client_name: "Deutsch & Co.",
  description: "Brand development process management system - Complete workflow automation for client transparency and project management.",
  status: "in_progress",
  ...getProjectDates(),
  progress_percentage: calculateInitialProgress(),
  updated_date: new Date().toISOString()
};

function calculateInitialProgress() {
  const completedSteps = 6; // First 6 steps completed for demo
  const totalSteps = playbookData.length;
  return Math.round((completedSteps / totalSteps) * 100);
}

// Helper function to calculate start date based on dependencies
function calculateStageStartDate(step, allSteps, stageDateMap) {
  const projectStartDate = new Date();
  
  // If no dependencies, start at project start or with phase offset
  if (!step.dependencies || step.dependencies.length === 0) {
    // Add phase-based offsets for better visualization
    let phaseOffset = 0;
    if (step.category === 'research') phaseOffset = 7;
    else if (step.category === 'strategy') phaseOffset = 21;
    else if (step.category === 'brand_building') phaseOffset = 45;
    else if (step.category === 'brand_collaterals') phaseOffset = 90;
    else if (step.category === 'brand_activation') phaseOffset = 135;
    else if (step.category === 'employer_branding') phaseOffset = 180;
    else if (step.category === 'project_closure') phaseOffset = 210;
    
    const startDate = new Date(projectStartDate);
    startDate.setDate(startDate.getDate() + phaseOffset);
    return startDate;
  }
  
  // Find the latest end date from all dependencies
  let latestDependencyEnd = projectStartDate;
  
  for (const depNum of step.dependencies) {
    const depStageId = `stage_${String(depNum).padStart(3, '0')}`;
    if (stageDateMap[depStageId] && stageDateMap[depStageId].end_date) {
      const depEndDate = new Date(stageDateMap[depStageId].end_date);
      if (depEndDate > latestDependencyEnd) {
        latestDependencyEnd = depEndDate;
      }
    }
  }
  
  // Start 1 day after the latest dependency ends
  const startDate = new Date(latestDependencyEnd);
  startDate.setDate(startDate.getDate() + 1);
  return startDate;
}

// Convert playbook data to Stage entities
function generateStagesFromPlaybook() {
  const stageDateMap = {}; // Track calculated dates for dependencies
  
  // First pass: sort stages by dependencies (topological sort)
  const sortedSteps = [...playbookData].sort((a, b) => {
    // Stages without dependencies come first
    if (!a.dependencies?.length && b.dependencies?.length) return -1;
    if (a.dependencies?.length && !b.dependencies?.length) return 1;
    // Then by number index
    return a.number_index - b.number_index;
  });
  
  // Second pass: calculate dates and create stage objects
  const stages = sortedSteps.map((step, index) => {
    // Set realistic status based on position
    let status;
    if (step.number_index <= 6) {
      status = 'completed';
    } else if (step.number_index === 7) {
      status = 'in_progress';
    } else {
      status = 'not_started';
    }

    // Generate stage ID based on number index
    const stageId = `stage_${String(step.number_index).padStart(3, '0')}`;

    // Convert dependency numbers to stage IDs
    const dependencies = (step.dependencies || []).map(depNum => 
      `stage_${String(depNum).padStart(3, '0')}`
    );

    // Convert parallel tracks if they exist
    const parallelTracks = (step.parallel_tracks || []).map(trackNum =>
      `stage_${String(trackNum).padStart(3, '0')}`
    );
    
    // Calculate dates
    const estimatedDuration = getEstimatedDuration(step);
    const startDate = calculateStageStartDate(step, sortedSteps, stageDateMap);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + estimatedDuration);
    
    // Store dates for dependency calculation
    stageDateMap[stageId] = {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };

    return {
      id: stageId,
      number_index: step.number_index,
      name: step.name,
      formal_name: step.formal_name || step.name,
      is_deliverable: step.is_deliverable,
      category: step.category,
      status: status,
      description: step.description || `Step ${step.number_index}: ${step.name}`,
      type: step.type || "Internal",
      axis: step.axis || "General",
      dependencies: dependencies,
      parallel_tracks: parallelTracks,
      blocking_priority: step.blocking_priority || "medium",
      resource_dependency: step.resource_dependency || "none",
      project_id: realProject.id,
      assigned_to: getAssignedTeamMember(step),
      estimated_duration: estimatedDuration,
      start_date: stageDateMap[stageId].start_date,
      end_date: stageDateMap[stageId].end_date,
      created_date: "2024-01-15T09:00:00Z",
      updated_date: new Date().toISOString()
    };
  });
  
  // Sort back by number_index for display
  return stages.sort((a, b) => a.number_index - b.number_index);
}

function getAssignedTeamMember(step) {
  // Assign based on category and type
  if (step.category === 'onboarding' || step.axis?.includes('Business')) {
    return "sarah.johnson@deutschco.com";
  } else if (step.axis?.includes('Creative') || step.category === 'brand_building') {
    return "michael.chen@deutschco.com";
  } else if (step.axis?.includes('Strategy') || step.category === 'strategy') {
    return "emily.rodriguez@agency.com";
  } else if (step.category === 'research') {
    return "emily.rodriguez@agency.com";
  } else {
    return "david.kim@agency.com";
  }
}

function getEstimatedDuration(step) {
  // Estimate duration based on complexity and type
  if (step.blocking_priority === 'critical') return 5;
  if (step.is_deliverable) return 3;
  if (step.blocking_priority === 'high') return 2;
  return 1;
}

// Generate deliverables from the phase data
function generateDeliverablesFromPhases() {
  const deliverables = [];
  let deliverableId = 1;

  deliverablesByPhase.forEach(phase => {
    phase.deliverables.forEach(deliv => {
      // Find the corresponding stage
      const stageId = `stage_${String(deliv.step).padStart(3, '0')}`;
      
      // Determine status based on step number
      let status = 'not_started';
      let versions = [];
      
      if (deliv.step <= 6) {
        status = 'completed';
        versions = [{
          version_number: "V1",
          status: "approved",
          submitted_date: "2024-01-18T10:00:00Z",
          approval_date: "2024-01-19T14:00:00Z",
          approved_by: "michael.chen@deutschco.com",
          feedback: ""
        }];
      } else if (deliv.step === 7) {
        status = 'wip';
        versions = [{
          version_number: "V0",
          status: "submitted",
          submitted_date: "2024-01-30T16:00:00Z",
          feedback: ""
        }];
      }

      const deliverableEntity = {
        id: `deliv_${String(deliverableId).padStart(3, '0')}`,
        name: deliv.name,
        description: deliv.note || `${deliv.name} - ${phase.phase}`,
        type: getDeliverableType(deliv.axis, deliv.tags),
        status: status,
        include_in_brandbook: shouldIncludeInBrandbook(deliv),
        stage_id: stageId,
        project_id: realProject.id,
        target_date: getTargetDate(deliv.step),
        priority: deliv.priority?.toLowerCase() || 'medium',
        axis: deliv.axis || 'General',
        tags: deliv.tags || [],
        versions: versions,
        max_revisions: getMaxRevisions(deliv.priority),
        created_date: "2024-01-15T09:00:00Z",
        updated_date: new Date().toISOString()
      };

      deliverables.push(deliverableEntity);
      deliverableId++;
    });
  });

  return deliverables;
}

function getDeliverableType(axis, tags) {
  if (tags?.includes('Research') || axis?.includes('Research')) return 'research';
  if (tags?.includes('Strategy') || axis?.includes('Strategy')) return 'strategy';
  if (tags?.includes('Creative') || axis?.includes('Creative')) return 'creative';
  return 'strategy'; // default
}

function shouldIncludeInBrandbook(deliv) {
  return deliv.tags?.includes('Creative') || 
         deliv.tags?.includes('Brand') ||
         deliv.name.toLowerCase().includes('brandbook') ||
         deliv.name.toLowerCase().includes('visual') ||
         deliv.name.toLowerCase().includes('logo') ||
         deliv.name.toLowerCase().includes('design');
}

function getTargetDate(stepNumber) {
  // Estimate target dates based on step progression
  const startDate = new Date('2024-01-15');
  const daysPerStep = 2; // Average 2 days per step
  const targetDate = new Date(startDate);
  targetDate.setDate(startDate.getDate() + (stepNumber * daysPerStep));
  return targetDate.toISOString().split('T')[0];
}

function getMaxRevisions(priority) {
  switch(priority?.toLowerCase()) {
    case 'critical': return 3;
    case 'high': return 2;
    default: return 1;
  }
}

// Real team members based on typical agency structure
const realTeamMembers = [
  {
    id: "team_001",
    name: "Sarah Johnson",
    email: "sarah.johnson@deutschco.com",
    role: "Project Manager",
    is_decision_maker: true,
    phone: "+1-555-0123",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    profile_image: "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "team_002",
    name: "Michael Chen",
    email: "michael.chen@deutschco.com",
    role: "Creative Director",
    is_decision_maker: true,
    phone: "+1-555-0124",
    linkedin: "https://linkedin.com/in/michaelchen",
    profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "team_003",
    name: "Emily Rodriguez",
    email: "emily.rodriguez@agency.com",
    role: "Brand Strategist",
    is_decision_maker: false,
    phone: "+1-555-0125",
    linkedin: "https://linkedin.com/in/emilyrodriguez",
    profile_image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "team_004",
    name: "David Kim",
    email: "david.kim@agency.com",
    role: "Design Lead",
    is_decision_maker: false,
    phone: "+1-555-0126",
    linkedin: "https://linkedin.com/in/davidkim",
    profile_image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "team_005",
    name: "Lisa Park",
    email: "lisa.park@agency.com",
    role: "Senior Copywriter",
    is_decision_maker: false,
    phone: "+1-555-0127",
    linkedin: "https://linkedin.com/in/lisapark",
    profile_image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    created_date: "2024-01-15T09:00:00Z"
  }
];

// Generate comments for completed stages
function generateCommentsForCompletedStages(stages) {
  const comments = [];
  const completedStages = stages.filter(s => s.status === 'completed');
  
  completedStages.forEach((stage, index) => {
    comments.push({
      id: `comment_${String(index + 1).padStart(3, '0')}`,
      content: getStageComment(stage),
      author_name: getCommentAuthor(stage.assigned_to).name,
      author_email: stage.assigned_to,
      stage_id: stage.id,
      project_id: realProject.id,
      created_date: getCommentDate(stage.number_index)
    });
  });

  // Add comment for in-progress stage
  const inProgressStage = stages.find(s => s.status === 'in_progress');
  if (inProgressStage) {
    comments.push({
      id: `comment_${String(comments.length + 1).padStart(3, '0')}`,
      content: "Working on the kickoff email draft. Will have initial version ready for review by tomorrow.",
      author_name: "Emily Rodriguez",
      author_email: "emily.rodriguez@agency.com",
      stage_id: inProgressStage.id,
      project_id: realProject.id,
      created_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
    });
  }

  return comments;
}

function getStageComment(stage) {
  const comments = [
    `${stage.name} completed successfully. Moving to next phase.`,
    `Deliverable approved by client. Great work team!`,
    `Stage milestone reached. Dependencies cleared for next steps.`,
    `Client feedback incorporated. Final version approved.`,
    `Process step completed on schedule. Quality standards met.`
  ];
  return comments[stage.number_index % comments.length];
}

function getCommentAuthor(email) {
  return realTeamMembers.find(member => member.email === email) || realTeamMembers[0];
}

function getCommentDate(stepNumber) {
  const baseDate = new Date('2024-01-15');
  baseDate.setDate(baseDate.getDate() + stepNumber * 2);
  return baseDate.toISOString();
}

// Generate notifications for current activity
function generateCurrentNotifications(stages, deliverables) {
  const notifications = [];
  
  // Notification for submitted deliverable awaiting approval
  const submittedDeliverable = deliverables.find(d => 
    d.versions.some(v => v.status === 'submitted')
  );
  
  if (submittedDeliverable) {
    notifications.push({
      id: "notif_001",
      title: "New deliverable submitted",
      message: `${submittedDeliverable.name} (V0) submitted for review`,
      type: "deliverable_submitted",
      read: false,
      recipient_email: "michael.chen@deutschco.com",
      related_id: submittedDeliverable.id,
      created_date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    });
  }

  // Notification for completed stage
  notifications.push({
    id: "notif_002",
    title: "Stage completed",
    message: "Setup Slack Channel stage has been completed",
    type: "stage_completed",
    read: true,
    recipient_email: "sarah.johnson@deutschco.com",
    related_id: "stage_006",
    created_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  });

  return notifications;
}

// Sample out-of-scope request
const realOutOfScopeRequests = [
  {
    id: "oos_001",
    title: "Additional logo variations requested",
    description: "Client has requested 5 additional logo variations in different color schemes beyond the 3 included in the original scope. This includes variations for dark backgrounds, single-color applications, and seasonal themes.",
    status: "pending",
    priority: "medium",
    estimated_hours: 12,
    estimated_cost: 1200,
    requested_by: "sarah.johnson@deutschco.com",
    requested_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    project_id: realProject.id,
    justification: "Client saw competitor with multiple logo variations and wants to match their brand flexibility.",
    created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// User accounts for authentication
const realUsers = [
  {
    id: "user_001",
    email: "admin@agency.com",
    password: "admin123", // In production, this would be hashed
    name: "System Admin",
    role: "admin",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "user_002",
    email: "sarah.johnson@deutschco.com",
    password: "client123",
    name: "Sarah Johnson",
    role: "client",
    created_date: "2024-01-15T09:00:00Z"
  },
  {
    id: "user_003",
    email: "michael.chen@deutschco.com",
    password: "client123",
    name: "Michael Chen",
    role: "client",
    created_date: "2024-01-15T09:00:00Z"
  }
];

// Function to seed the database with real data
export function seedRealData() {
  console.log('🏗️ Generating real data from playbook...');
  
  const stages = generateStagesFromPlaybook();
  const deliverables = generateDeliverablesFromPhases();
  const comments = generateCommentsForCompletedStages(stages);
  const notifications = generateCurrentNotifications(stages, deliverables);

  const realData = {
    projects: [realProject],
    stages: stages,
    deliverables: deliverables,
    teamMembers: realTeamMembers,
    comments: comments,
    notifications: notifications,
    outOfScopeRequests: realOutOfScopeRequests,
    users: realUsers
  };

  dataStore.importData(realData);
  
  console.log(`✅ Real data seeded successfully!`);
  console.log(`📊 Data Summary:`);
  console.log(`   • ${stages.length} stages from complete playbook`);
  console.log(`   • ${deliverables.length} deliverables from phase data`);
  console.log(`   • ${realTeamMembers.length} team members`);
  console.log(`   • ${comments.length} stage comments`);
  console.log(`   • ${notifications.length} notifications`);
  
  return realData;
}

// Function to clear all data
export function clearData() {
  dataStore.clear();
  console.log('🗑️ All data cleared!');
}

// Auto-seed if no data exists
export function initializeRealData() {
  const existingData = dataStore.exportData();
  const hasData = existingData.projects?.length > 0 || 
                  existingData.stages?.length > 0 ||
                  existingData.deliverables?.length > 0;
  
  // Check if existing data has invalid dates (temporary fix to force regeneration)
  let needsRegeneration = false;
  if (hasData && existingData.stages?.length > 0) {
    const firstStage = existingData.stages[0];
    if (!firstStage.start_date || !firstStage.end_date) {
      console.log('⚠️ Existing stages missing date fields. Regenerating...');
      needsRegeneration = true;
    }
  }
                  
  if (!hasData || needsRegeneration) {
    console.log('📋 Seeding with real playbook data...');
    return seedRealData();
  } else {
    console.log('✅ Existing data found. Skipping data seeding.');
    console.log(`📊 Current data: ${existingData.stages?.length || 0} stages, ${existingData.deliverables?.length || 0} deliverables`);
    // Log a sample stage to verify dates
    if (existingData.stages?.length > 0) {
      console.log('Sample stage dates:', {
        name: existingData.stages[0].name,
        start_date: existingData.stages[0].start_date,
        end_date: existingData.stages[0].end_date
      });
    }
    return existingData;
  }
}

export {
  realProject,
  generateStagesFromPlaybook,
  generateDeliverablesFromPhases,
  realTeamMembers,
  realUsers,
  realOutOfScopeRequests
};