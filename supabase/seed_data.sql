-- Seed Data for Princess Development
-- Version: 1.0.0
-- Date: December 2024

-- Create a default organization for development
INSERT INTO organizations (id, name, subdomain, logo_url, primary_color, secondary_color)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Deutsch & Co.',
    'deutsch',
    '/logo.png',
    '#2563eb',
    '#10b981'
) ON CONFLICT (id) DO NOTHING;

-- Create default playbook template
INSERT INTO playbook_templates (
    id,
    organization_id,
    name,
    description,
    category,
    stages_data,
    dependencies_data,
    version,
    is_active
) VALUES (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Standard Brand Development',
    'Complete 104-step brand development process',
    'Standard',
    '[]'::jsonb, -- Will be populated with actual stages
    '[]'::jsonb, -- Will be populated with actual dependencies
    '1.0.0',
    true
) ON CONFLICT (id) DO NOTHING;

-- Note: The actual 104 stages data should be imported from the existing initializeData.js
-- This can be done via a separate migration or through the application's initialization process