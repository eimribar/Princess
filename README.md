# Princess - Brand Development Process Management System

Princess is a sophisticated project management platform designed specifically for brand development agencies. It manages complex branding workflows, providing transparency and structured communication between agencies and their clients throughout the entire brand development process.

## 🎯 Project Overview

Princess transforms the traditional agency-client relationship by providing:
- **Visual process transparency** - Clients can see exactly where they are in the branding journey
- **Structured feedback workflows** - Organized approval processes with version control
- **Dependency management** - Clear understanding of how deliverables relate to each other
- **Real-time collaboration** - Integrated communication and notification systems

## 🏗️ Architecture

### Frontend Stack
- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe development (gradual migration)
- **TailwindCSS** - Utility-first styling framework
- **shadcn/ui** - High-quality component library built on Radix UI
- **Framer Motion** - Smooth animations and transitions
- **React Router v7** - Client-side routing

### Backend Architecture
- **Custom Data Layer** - localStorage-based persistence with API-ready architecture
- **Real-time data** - Live updates with React state management
- **Authentication** - Simple session-based authentication
- **Future-ready** - Easy migration to Supabase, custom API, or other backends

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^7.2.0",
  "framer-motion": "^12.4.7",
  "tailwindcss": "^3.4.17",
  "@radix-ui/*": "Latest versions"
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git for version control

### Installation

```bash
# Clone the repository
git clone https://github.com/eimribar/Princess.git
cd Princess

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## 📱 Core Features

### 1. Visual Process Dashboard
- **Interactive timeline** - Circles for steps, stars for deliverables
- **Status indicators** - Color-coded progress (Gray/Yellow/Red/Green)
- **Dependency visualization** - Hover to highlight prerequisite steps
- **Progress tracking** - Overall project completion percentage

### 2. Deliverables Management
- **Version control** - V0 → Feedback → V1 → Feedback → V2 workflow
- **Approval system** - Email-based approve/decline functionality
- **Feedback loops** - Structured client feedback with iteration limits
- **Asset organization** - Categorized by Research/Strategy/Creative

### 3. Team Collaboration
- **Project teams** - Client and agency team member management
- **Decision makers** - Highlighted key stakeholders (max 2)
- **Communication** - Integrated commenting and notification systems
- **Access control** - Role-based permissions

### 4. Admin Panel
- **Playbook templates** - Configurable workflow templates
- **Project setup** - Custom project initialization
- **Timeline management** - Dynamic deadline adjustments
- **Team administration** - User and permission management

### 5. Client Experience
- **Custom branding** - Personalized dashboard appearance
- **Attention management** - Clear indication of required actions
- **Process understanding** - Educational content and examples
- **Final brandbook** - Public-facing asset collection

## 🎨 UI Components

### Core Components
- **Dashboard** - Main project overview and progress
- **Timeline** - Sequential step visualization
- **Deliverables** - Asset management and versioning
- **Team** - Member directory and collaboration
- **Admin** - System configuration and management
- **Brandbook** - Final asset presentation

### Reusable UI Elements
- **Cards** - Information containers with consistent styling
- **Badges** - Status and category indicators
- **Buttons** - Action triggers with proper states
- **Modals/Dialogs** - Contextual interactions
- **Forms** - Data input with validation
- **Navigation** - Consistent user flow

## 📊 Data Models

### Core Entities
- **Project** - Main project container
- **Stage** - Individual workflow steps
- **Deliverable** - Client-facing outputs
- **TeamMember** - Project participants
- **Comment** - Communication logs
- **Notification** - System alerts
- **OutOfScopeRequest** - Additional work requests

### Relationships
```
Project (1) → (n) Stages
Project (1) → (n) Deliverables  
Project (1) → (n) TeamMembers
Stage (1) → (n) Comments
Deliverable (1) → (n) Versions
```

## 🔧 Development Guidelines

### Code Organization
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (shadcn)
│   ├── dashboard/      # Dashboard-specific components
│   ├── admin/          # Administration components
│   └── team/           # Team management components
├── pages/              # Route components
├── api/                # API integration
├── hooks/              # Custom React hooks
├── lib/                # Utilities and configurations
└── utils/              # Helper functions
```

### Styling Conventions
- Use Tailwind utility classes
- Implement responsive design (mobile-first)
- Maintain consistent color palette
- Follow shadcn/ui design patterns

### State Management
- React hooks for component state
- Custom entity classes for data persistence
- localStorage for client-side data storage
- Context API for shared application state

## 🌟 Enhanced Features Roadmap

### Phase 1: Foundation (Completed)
- ✅ Basic dashboard and navigation
- ✅ Simple deliverables management
- ✅ Team member directory
- ✅ Admin panel structure
- ✅ Local storage data persistence
- ✅ Automatic data initialization (104 stages)

### Phase 2: Core Functionality (In Progress)
- ✅ Visual timeline with 5 phases
- ✅ Circle/star visualization system
- ✅ Dependency highlighting on hover
- ✅ Interactive sidebar with tabs
- ✅ Mini dependency map
- ✅ Professional management section
- 🔄 Enhanced version control (V0→V1→V2)
- 🔄 Real-time notification system

### Phase 3: Advanced Features
- 📋 Email approval workflows
- 📋 Out-of-scope request management
- 📋 Custom playbook configuration
- 📋 Progress tracking and analytics

### Phase 4: Client Experience
- 📋 Public brandbook pages
- 📋 Custom client branding
- 📋 Mobile-responsive optimizations
- 📋 Performance optimizations

### Phase 5: Future Enhancements
- 📋 Native mobile application
- 📋 Gamification elements
- 📋 Advanced analytics dashboard
- 📋 Third-party integrations

## 🚀 Deployment

### Vercel Deployment
```bash
# Connect to Vercel
vercel --prod

# Automatic deployment on push to main branch
```

### Environment Variables
```env
VITE_BASE44_APP_ID=your_app_id_here
VITE_API_URL=your_api_url_here
```

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Submit pull request with description
4. Code review and approval
5. Merge to main and deploy

### Code Standards
- Use TypeScript for new components
- Write unit tests for complex logic
- Follow ESLint configuration
- Maintain component documentation

## 📄 License

Private project - All rights reserved.

## 📞 Support

For questions and support, contact the development team or check the project documentation in CLAUDE.md for AI-specific development guidelines.

---

*Princess - Transforming brand development through transparent process management*