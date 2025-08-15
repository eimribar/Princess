import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Deliverables from "./Deliverables";

import Team from "./Team";

import Brandbook from "./Brandbook";

import Admin from "./Admin";

import DeliverableDetail from "./DeliverableDetail";

import Timeline from "./Timeline";

import OutofScope from "./OutofScope";

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
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Deliverables" element={<Deliverables />} />
                
                <Route path="/Team" element={<Team />} />
                
                <Route path="/Brandbook" element={<Brandbook />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/DeliverableDetail" element={<DeliverableDetail />} />
                
                <Route path="/Timeline" element={<Timeline />} />
                
                <Route path="/OutofScope" element={<OutofScope />} />
                
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