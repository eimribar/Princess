import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Deliverables from "./Deliverables";

import Team from "./Team";

import Brandbook from "./Brandbook";

import Admin from "./Admin";

import DeliverableDetail from "./DeliverableDetail";

import Timeline from "./Timeline";

import OutofScope from "./OutofScope";

import ProjectSetup from "./ProjectSetup";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Deliverables: Deliverables,
    
    Team: Team,
    
    Brandbook: Brandbook,
    
    Admin: Admin,
    
    DeliverableDetail: DeliverableDetail,
    
    Timeline: Timeline,
    
    OutofScope: OutofScope,
    
    ProjectSetup: ProjectSetup,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/dashboard" element={<Dashboard />} />
                
                <Route path="/deliverables" element={<Deliverables />} />
                
                <Route path="/team" element={<Team />} />
                
                <Route path="/brandbook" element={<Brandbook />} />
                
                <Route path="/admin" element={<Admin />} />
                
                <Route path="/deliverabledetail" element={<DeliverableDetail />} />
                
                <Route path="/timeline" element={<Timeline />} />
                
                <Route path="/outofscope" element={<OutofScope />} />
                
                <Route path="/projectsetup" element={<ProjectSetup />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}