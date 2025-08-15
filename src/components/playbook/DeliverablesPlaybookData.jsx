export const deliverablesByPhase = [
  {
    phase: "Phase 1: Project Initiation & Setup",
    total: 6,
    deliverables: [
      { name: "Price Quote", step: 1, tags: ["Business", "Internal", "Contract", "Financial"], axis: "Business & Internal", priority: "Critical", note: "Blocks entire project" },
      { name: "Signed Contract from Both Parties", step: 2, tags: ["Business", "Internal", "Contract", "Legal"], axis: "Business & Internal", priority: "Critical", note: "Master dependency" },
      { name: "Kickoff Email", step: 7, tags: ["Communication", "External", "Project Setup"], axis: "Client Management", priority: "High" },
      { name: "Email + Ask List PDF", step: 8, tags: ["Communication", "External", "Information Gathering"], axis: "Client Management", priority: "High", note: "Blocks research phase" },
      { name: "Gantt Chart", step: 10, tags: ["Planning", "Timeline", "External"], axis: "Client Management", priority: "Medium" },
      { name: "Weekly Summary Email", step: 15, tags: ["Communication", "Recurring", "External"], axis: "Client Management", priority: "Medium" },
    ],
  },
  {
    phase: "Phase 2: Research & Discovery",
    total: 8,
    deliverables: [
      { name: "Client Kickoff Summary Email", step: 17, tags: ["Communication", "Meeting Summary", "External"], axis: "Client Management", priority: "Medium" },
      { name: "Brand V0 Action Plan and Deliverables", step: 18, tags: ["Planning", "Strategy", "Conditional"], axis: "Client Management", priority: "Low", note: "Optional - Only if decided to proceed" },
      { name: "Initial Deliverables Table", step: 19, tags: ["Planning", "Quick Wins", "Conditional"], axis: "Client Management", priority: "Low", note: "Optional - Only if decided to proceed" },
      { name: "SOW Details Table", step: 23, tags: ["Documentation", "Process", "External"], axis: "Client Management", priority: "High" },
      { name: "Introductory Memo", step: 28, tags: ["Research", "Strategy", "External"], axis: "Client Management", priority: "High" },
      { name: "Competitive Analysis", step: 31, tags: ["Research", "Strategy", "Market Analysis"], axis: "Strategy & Research", priority: "High" },
      { name: "Naming Deck", step: 35, tags: ["Creative", "Strategy", "Branding"], axis: "Creative", priority: "Medium", note: "Delivered only after naming session" },
      { name: "Pre-USP Workshop Summary + First Act Presentation", step: 48, tags: ["Strategy", "Workshop Prep", "Internal Review"], axis: "Strategy & Research", priority: "Critical", note: "USP dependency" },
    ],
  },
  {
    phase: "Phase 3: Strategy & USP Development",
    total: 6,
    deliverables: [
      { name: "USP Workshop Deck (Part 1)", step: 49, tags: ["Strategy", "Workshop", "Core Deliverable"], axis: "Strategy & Research", priority: "Critical", note: "Send only after workshop" },
      { name: "USP Workshop Deck (Part 2)", step: 50, tags: ["Strategy", "Workshop", "Core Deliverable"], axis: "Strategy & Research", priority: "Critical" },
      { name: "USP MEMO", step: 51, tags: ["Strategy", "Core Document", "Master Dependency"], axis: "Strategy & Research", priority: "Critical", note: "Unlocks all creative work" },
      { name: "Brand Initiatives Presentation", step: 57, tags: ["Strategy", "Creative Direction", "Planning"], axis: "Creative", priority: "High" },
      { name: "Naming Memo", step: 63, tags: ["Strategy", "Product", "Nomenclature"], axis: "Strategy & Research", priority: "Medium" },
      { name: "Tone And Voice Guide", step: 67, tags: ["Creative", "Writing Guidelines", "Brand Voice"], axis: "Creative/Client Management", priority: "Critical", note: "Blocks all copy" },
    ],
  },
  {
    phase: "Phase 4: Creative Execution & Brand Activation",
    total: 23,
    deliverables: [
        { name: "Out of Stealth Plan", step: 71, tags: ["Strategy", "Launch Planning", "Marketing"], axis: "Creative/Client Management", priority: "High" },
        { name: "Branded Gifts (Mid-Project)", step: 73, tags: ["Physical Items", "Client Relations", "Morale"], axis: "Client Management", priority: "Low" },
        { name: "Animation Video Script", step: 74, tags: ["Creative", "Video", "Content"], axis: "Client Management/Business", priority: "Medium", note: "Conditional" },
        { name: "Demo Video Script", step: 77, tags: ["Creative", "Video", "Product Demo"], axis: "Strategy & Research", priority: "High" },
        { name: "Merchandise Deck", step: 78, tags: ["Creative", "Physical Items", "Brand Application"], axis: "Creative", priority: "Medium" },
        { name: "Swag Sourcing Selection", step: 80, tags: ["Physical Items", "Vendors", "Production"], axis: "Business & Internal", priority: "Low" },
        { name: "Homepage Copy", step: 81, tags: ["Creative", "Website", "Content", "Copy"], axis: "Creative", priority: "High" },
        { name: "Sales Deck", step: 82, tags: ["Creative", "Sales Tool", "Presentation"], axis: "Creative", priority: "High" },
        { name: "Sales Brochure", step: 83, tags: ["Creative", "Sales Tool", "Print/Digital"], axis: "Creative", priority: "High" },
        { name: "Solution Pages Copy", step: 84, tags: ["Creative", "Website", "Content", "Copy"], axis: "Creative", priority: "High" },
        { name: "Homepage Design", step: 85, tags: ["Creative", "Website", "Visual Design"], axis: "Creative", priority: "High" },
        { name: "Demo Video (Produced)", step: 86, tags: ["Creative", "Video", "Final Asset"], axis: "Creative", priority: "High" },
        { name: "Visual Identity / Brandbook", step: 87, tags: ["Creative", "Core Asset", "Brand Guidelines"], axis: "Creative", priority: "Critical", note: "Master creative dependency" },
        { name: "Video Testimonials", step: 89, tags: ["Creative", "Video", "Social Proof"], axis: "Creative", priority: "Medium" },
        { name: "Brand Initiatives Deck", step: 91, tags: ["Creative", "Strategy Implementation", "Planning"], axis: "Client Management", priority: "Medium" },
        { name: "Solution Pages Design", step: 93, tags: ["Creative", "Website", "Visual Design"], axis: "Creative", priority: "High" },
        { name: "Full Asset Folder Figma + Updated Brandbook", step: 96, tags: ["Creative", "Final Assets", "Complete Package"], axis: "Creative", priority: "Critical" },
        { name: "External Drive Folder", step: 96, tags: ["Organization", "Final Delivery", "Access"], axis: "Client Management", priority: "Critical" },
        { name: "SOW Summary Presentation", step: 97, tags: ["Documentation", "Project Wrap-up", "Review"], axis: "Client Management", priority: "High", note: "Requires Roee's approval before sending" },
        { name: "LinkedIn Post", step: 99, tags: ["Creative", "Social Media", "Launch Content"], axis: "Creative", priority: "Medium" },
    ]
  },
  {
    phase: "Phase 5: Project Closure",
    total: 1,
    deliverables: [
        { name: "Celebration Cake", step: 100, tags: ["Physical Item", "Celebration", "Client Relations"], axis: "Client Management", priority: "Low" }
    ]
  }
];

export const summaries = {
  byCategory: [
    { category: "📄 Documentation & Communication", count: 11, items: ["Price Quote", "Signed Contract", "Kickoff Email", "Email + Ask List PDF", "Weekly Summary Email", "Client Kickoff Summary Email", "SOW Details Table", "Introductory Memo", "SOW Summary Presentation", "External Drive Folder", "Gantt Chart"] },
    { category: "🎯 Strategy & Research", count: 9, items: ["Competitive Analysis", "Pre-USP Workshop Summary", "USP Workshop Deck (Part 1)", "USP Workshop Deck (Part 2)", "USP MEMO", "Brand Initiatives Presentation", "Naming Memo", "Out of Stealth Plan", "Brand V0 Action Plan (conditional)"] },
    { category: "🎨 Creative Assets", count: 19, items: ["Naming Deck", "Tone And Voice Guide", "Homepage Copy", "Solution Pages Copy", "Homepage Design", "Solution Pages Design", "Visual Identity / Brandbook", "Full Asset Folder Figma + Updated Brandbook", "Sales Deck", "Sales Brochure", "Demo Video Script", "Animation Video Script", "Demo Video (Produced)", "Video Testimonials", "LinkedIn Post", "Merchandise Deck", "Brand Initiatives Deck", "Initial Deliverables Table (conditional)", "Swag Sourcing Selection"] },
    { category: "🎁 Physical Items", count: 2, items: ["Branded Gifts (Mid-Project)", "Celebration Cake"] }
  ],
  criticalPath: [
    { name: "Signed Contract", step: 2, reason: "Nothing starts without this" },
    { name: "Email + Ask List PDF", step: 8, reason: "Blocks all research" },
    { name: "USP MEMO", step: 51, reason: "Unlocks all creative work" },
    { name: "Tone And Voice Guide", step: 67, reason: "Blocks all copywriting" },
    { name: "Visual Identity / Brandbook", step: 87, reason: "Blocks final production" }
  ],
  specialApproval: {
    roee: [
        { name: "Pre-USP Workshop Summary", step: 48 },
        { name: "USP Workshop Decks", step: "49-50" },
        { name: "USP MEMO", step: 51 },
        { name: "SOW Summary Presentation", step: 97 }
    ],
    conditional: [
        { name: "Brand V0 Action Plan", step: 18, reason: "Only if V0 is pursued" },
        { name: "Initial Deliverables Table", step: 19, reason: "Only if immediate needs exist" },
        { name: "Animation Video Script", step: 74, reason: "Based on client decision" }
    ]
  }
};