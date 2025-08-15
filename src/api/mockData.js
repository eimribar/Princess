/**
 * Princess Mock Data
 * Sample data for development and demo purposes
 * Based on the 100-step branding playbook
 */

import { dataStore } from './entities';

// Sample project data
const sampleProject = {
  id: "proj_001",
  name: "Deutsch & Co. Princess",
  client_name: "Deutsch & Co.",
  description: "Brand development process management system",
  status: "in_progress",
  start_date: "2024-01-15",
  estimated_completion: "2024-06-30",
  progress_percentage: 35
};

// Sample team members
const sampleTeamMembers = [
  {
    id: "team_001",
    name: "Sarah Johnson",
    email: "sarah@deutschco.com", 
    role: "Project Manager",
    is_decision_maker: true,
    phone: "+1-555-0123",
    linkedin: "https://linkedin.com/in/sarahjohnson",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5e5?w=150"
  },
  {
    id: "team_002", 
    name: "Michael Chen",
    email: "michael@deutschco.com",
    role: "Creative Director", 
    is_decision_maker: true,
    phone: "+1-555-0124",
    linkedin: "https://linkedin.com/in/michaelchen",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
  },
  {
    id: "team_003",
    name: "Emily Rodriguez", 
    email: "emily@agency.com",
    role: "Brand Strategist",
    is_decision_maker: false,
    phone: "+1-555-0125",
    linkedin: "https://linkedin.com/in/emilyrodriguez",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  },
  {
    id: "team_004",
    name: "David Kim",
    email: "david@agency.com", 
    role: "Design Lead",
    is_decision_maker: false,
    phone: "+1-555-0126",
    linkedin: "https://linkedin.com/in/davidkim",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"
  }
];

// Sample stages based on the playbook (first 20 stages for demo)
const sampleStages = [
  {
    id: "stage_001",
    number_index: 1,
    name: "Price Quote", 
    formal_name: "Project Proposal and Cost Estimate",
    is_deliverable: true,
    category: "onboarding",
    status: "completed",
    description: "Initial price quote sent to the client.",
    dependencies: [],
    blocking_priority: "critical",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_002",
    number_index: 2,
    name: "Signed Contract from Both Parties",
    formal_name: "Master Services Agreement (MSA) Execution", 
    is_deliverable: true,
    category: "onboarding",
    status: "completed",
    description: "Legal contract signed by both the client and the company.",
    dependencies: ["stage_001"],
    blocking_priority: "critical",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_003",
    number_index: 3,
    name: "Initial Invoice Planning",
    formal_name: "Invoice and Payment Schedule Setup",
    is_deliverable: false,
    category: "onboarding", 
    status: "completed",
    description: "Plan the invoicing schedule based on the contract.",
    dependencies: ["stage_002"],
    blocking_priority: "high",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_004",
    number_index: 4,
    name: "PM Joins the Project",
    formal_name: "Project Manager Assignment",
    is_deliverable: false,
    category: "onboarding",
    status: "completed", 
    description: "The Project Manager is officially assigned to the project.",
    dependencies: ["stage_002"],
    blocking_priority: "high",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_005",
    number_index: 5,
    name: "Setup Drive Folder & Initial Docs",
    formal_name: "Project Directory and Documentation Initialization",
    is_deliverable: false,
    category: "onboarding",
    status: "completed",
    description: "Create the shared Google Drive folder and populate initial templates.",
    dependencies: ["stage_004"],
    blocking_priority: "medium",
    project_id: "proj_001", 
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_006",
    number_index: 6,
    name: "Setup Slack Channel",
    formal_name: "Communication Channel Setup (Slack)",
    is_deliverable: false,
    category: "onboarding",
    status: "completed",
    description: "Create the dedicated Slack channel for project communication.",
    dependencies: ["stage_004"],
    blocking_priority: "medium",
    project_id: "proj_001",
    assigned_to: "emily@agency.com"
  },
  {
    id: "stage_007",
    number_index: 7,
    name: "Send Kickoff Email",
    formal_name: "Official Project Commencement Communication",
    is_deliverable: true,
    category: "onboarding", 
    status: "in_progress",
    description: "Official project kickoff email sent to the client.",
    dependencies: ["stage_005", "stage_006"],
    blocking_priority: "high",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  },
  {
    id: "stage_008",
    number_index: 8,
    name: "Send Email + Ask List PDF",
    formal_name: "Client Materials and Information Request",
    is_deliverable: true,
    category: "onboarding",
    status: "not_ready",
    description: "Send an email to the client with a detailed list of required materials.",
    dependencies: ["stage_007"],
    blocking_priority: "critical",
    project_id: "proj_001",
    assigned_to: "emily@agency.com"
  },
  {
    id: "stage_009",
    number_index: 9,
    name: "Informal Client Visit", 
    formal_name: "Staff Visit",
    is_deliverable: false,
    category: "onboarding",
    status: "not_ready",
    description: "An informal visit to the client's staff to build rapport.",
    dependencies: [],
    blocking_priority: "low",
    project_id: "proj_001",
    assigned_to: "michael@deutschco.com"
  },
  {
    id: "stage_010", 
    number_index: 10,
    name: "Gantt Chart Update",
    formal_name: "Gantt",
    is_deliverable: true,
    category: "onboarding",
    status: "not_ready", 
    description: "👑 Send Gantt Chart to Client 👑",
    dependencies: [],
    blocking_priority: "medium",
    project_id: "proj_001",
    assigned_to: "sarah@deutschco.com"
  }
];

// Sample deliverables
const sampleDeliverables = [
  {
    id: "deliv_001",
    name: "Price Quote",
    description: "Initial project proposal and cost estimate",
    type: "research",
    status: "completed", 
    include_in_brandbook: false,
    stage_id: "stage_001",
    project_id: "proj_001",
    target_date: "2024-01-20",
    versions: [
      {
        version_number: "V1",
        status: "approved", 
        submitted_date: "2024-01-18",
        approval_date: "2024-01-19",
        approved_by: "sarah@deutschco.com"
      }
    ]
  },
  {
    id: "deliv_002",
    name: "Master Services Agreement",
    description: "Signed contract between both parties",
    type: "strategy",
    status: "completed",
    include_in_brandbook: false,
    stage_id: "stage_002", 
    project_id: "proj_001",
    target_date: "2024-01-25",
    versions: [
      {
        version_number: "V1",
        status: "approved",
        submitted_date: "2024-01-24",
        approval_date: "2024-01-25", 
        approved_by: "michael@deutschco.com"
      }
    ]
  },
  {
    id: "deliv_003",
    name: "Kickoff Email",
    description: "Official project commencement communication",
    type: "strategy", 
    status: "wip",
    include_in_brandbook: false,
    stage_id: "stage_007",
    project_id: "proj_001",
    target_date: "2024-02-01",
    versions: [
      {
        version_number: "V0",
        status: "submitted",
        submitted_date: "2024-01-30"
      }
    ]
  }
];

// Sample comments
const sampleComments = [
  {
    id: "comment_001",
    content: "Price quote approved by client. Moving to contract phase.",
    author_name: "Sarah Johnson",
    author_email: "sarah@deutschco.com",
    stage_id: "stage_001",
    project_id: "proj_001"
  },
  {
    id: "comment_002",
    content: "Contract signed successfully. Kickoff scheduled for next week.",
    author_name: "Michael Chen", 
    author_email: "michael@deutschco.com",
    stage_id: "stage_002",
    project_id: "proj_001"
  },
  {
    id: "comment_003",
    content: "Working on kickoff email draft. Will send for review by EOD.",
    author_name: "Emily Rodriguez",
    author_email: "emily@agency.com",
    stage_id: "stage_007", 
    project_id: "proj_001"
  }
];

// Sample notifications
const sampleNotifications = [
  {
    id: "notif_001",
    title: "New deliverable submitted",
    message: "Kickoff Email (V0) submitted for review",
    type: "deliverable_submitted",
    read: false,
    recipient_email: "sarah@deutschco.com",
    related_id: "deliv_003"
  },
  {
    id: "notif_002",
    title: "Stage completed",
    message: "Contract signing stage has been completed",
    type: "stage_completed",
    read: true,
    recipient_email: "michael@deutschco.com",
    related_id: "stage_002"
  }
];

// Sample out-of-scope requests
const sampleOutOfScopeRequests = [
  {
    id: "oos_001",
    title: "Additional logo variations",
    description: "Client requested 5 additional logo variations in different color schemes",
    status: "pending",
    priority: "medium",
    estimated_hours: 8,
    estimated_cost: 800,
    requested_by: "sarah@deutschco.com",
    project_id: "proj_001"
  }
];

// Sample users
const sampleUsers = [
  {
    id: "user_001",
    email: "admin@agency.com",
    password: "admin123", // In production, this would be hashed
    name: "Admin User",
    role: "admin"
  },
  {
    id: "user_002", 
    email: "sarah@deutschco.com",
    password: "client123",
    name: "Sarah Johnson", 
    role: "client"
  }
];

// Function to seed the database with mock data
export function seedMockData() {
  const mockData = {
    projects: [sampleProject],
    stages: sampleStages,
    deliverables: sampleDeliverables, 
    teamMembers: sampleTeamMembers,
    comments: sampleComments,
    notifications: sampleNotifications,
    outOfScopeRequests: sampleOutOfScopeRequests,
    users: sampleUsers
  };

  dataStore.importData(mockData);
  console.log('Mock data seeded successfully!');
  return mockData;
}

// Function to clear all data
export function clearData() {
  dataStore.clear();
  console.log('All data cleared!');
}

// Auto-seed if no data exists
export function initializeData() {
  const existingData = dataStore.exportData();
  const hasData = existingData.projects?.length > 0 || 
                  existingData.stages?.length > 0 ||
                  existingData.deliverables?.length > 0;
                  
  if (!hasData) {
    console.log('No existing data found. Seeding with mock data...');
    return seedMockData();
  } else {
    console.log('Existing data found. Skipping mock data seeding.');
    return existingData;
  }
}

export {
  sampleProject,
  sampleStages,
  sampleDeliverables,
  sampleTeamMembers,
  sampleComments,
  sampleNotifications,
  sampleOutOfScopeRequests,
  sampleUsers
};