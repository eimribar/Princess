import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Plus, 
  Copy, 
  Edit2, 
  Trash2, 
  Download, 
  Upload,
  BookOpen,
  FileText,
  Clock,
  Users,
  CheckCircle2,
  Settings,
  Save,
  FolderOpen,
  Grid3x3,
  Search
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import StageBuilder from './StageBuilder';
import DependencyBuilder from './DependencyBuilder';
import TemplateVersioning from './TemplateVersioning';
import TemplateLibrary from './TemplateLibrary';

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Load templates from localStorage
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const storedTemplates = localStorage.getItem('playbook_templates');
    if (storedTemplates) {
      setTemplates(JSON.parse(storedTemplates));
    } else {
      // Initialize with default templates
      const defaultTemplates = [
        {
          id: 'default-brand',
          name: 'Complete Brand Development',
          description: 'Full 104-step brand development process',
          category: 'Standard',
          stageCount: 104,
          phases: ['Onboarding', 'Research', 'Strategy', 'Brand Building', 'Brand Collaterals', 'Brand Activation'],
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          createdBy: 'System',
          isDefault: true,
          stages: [] // Will be populated from current stages
        },
        {
          id: 'rapid-brand',
          name: 'Rapid Brand Sprint',
          description: 'Accelerated 45-step process for quick turnaround',
          category: 'Express',
          stageCount: 45,
          phases: ['Onboarding', 'Research', 'Strategy', 'Brand Building'],
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          createdBy: 'System',
          isDefault: true,
          stages: []
        },
        {
          id: 'rebrand',
          name: 'Rebrand & Refresh',
          description: 'Specialized template for rebranding projects',
          category: 'Specialized',
          stageCount: 72,
          phases: ['Audit', 'Research', 'Strategy', 'Brand Evolution', 'Implementation'],
          version: '1.0.0',
          lastModified: new Date().toISOString(),
          createdBy: 'System',
          isDefault: true,
          stages: []
        }
      ];
      
      setTemplates(defaultTemplates);
      localStorage.setItem('playbook_templates', JSON.stringify(defaultTemplates));
    }
  };

  const saveTemplates = (updatedTemplates) => {
    localStorage.setItem('playbook_templates', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
  };

  const createTemplate = () => {
    if (!newTemplateName.trim()) {
      toast({
        title: "Template name required",
        description: "Please enter a name for the new template.",
        variant: "destructive"
      });
      return;
    }

    const newTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      description: newTemplateDescription,
      category: 'Custom',
      stageCount: 0,
      phases: [],
      version: '1.0.0',
      lastModified: new Date().toISOString(),
      createdBy: 'Admin',
      isDefault: false,
      stages: []
    };

    const updatedTemplates = [...templates, newTemplate];
    saveTemplates(updatedTemplates);
    setSelectedTemplate(newTemplate);
    setShowCreateDialog(false);
    setNewTemplateName('');
    setNewTemplateDescription('');
    setActiveTab('builder');

    toast({
      title: "Template created",
      description: `"${newTemplate.name}" has been created successfully.`
    });
  };

  const duplicateTemplate = (template) => {
    const duplicated = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      isDefault: false,
      lastModified: new Date().toISOString(),
      version: '1.0.0'
    };

    const updatedTemplates = [...templates, duplicated];
    saveTemplates(updatedTemplates);

    toast({
      title: "Template duplicated",
      description: `"${duplicated.name}" has been created.`
    });
  };

  const deleteTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    if (template?.isDefault) {
      toast({
        title: "Cannot delete default template",
        description: "Default templates cannot be deleted.",
        variant: "destructive"
      });
      return;
    }

    const updatedTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(updatedTemplates);
    
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate(null);
    }

    toast({
      title: "Template deleted",
      description: "Template has been removed successfully."
    });
  };

  const updateTemplate = (templateId, updates) => {
    const updatedTemplates = templates.map(t => 
      t.id === templateId 
        ? { ...t, ...updates, lastModified: new Date().toISOString() }
        : t
    );
    saveTemplates(updatedTemplates);
    
    if (selectedTemplate?.id === templateId) {
      setSelectedTemplate({ ...selectedTemplate, ...updates });
    }
  };

  const exportTemplate = (template) => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_template.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Template exported",
      description: `"${template.name}" has been exported.`
    });
  };

  const importTemplate = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        imported.id = `template-${Date.now()}`;
        imported.isDefault = false;
        imported.lastModified = new Date().toISOString();
        
        const updatedTemplates = [...templates, imported];
        saveTemplates(updatedTemplates);
        
        toast({
          title: "Template imported",
          description: `"${imported.name}" has been imported successfully.`
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid template file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Playbook Templates</h2>
          <p className="text-gray-600 mt-1">Manage and customize workflow templates</p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importTemplate}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import
              </span>
            </Button>
          </label>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="builder" disabled={!selectedTemplate}>
            Stage Builder
          </TabsTrigger>
          <TabsTrigger value="dependencies" disabled={!selectedTemplate}>
            Dependencies
          </TabsTrigger>
          <TabsTrigger value="versions" disabled={!selectedTemplate}>
            Versions
          </TabsTrigger>
        </TabsList>

        {/* Library Tab */}
        <TabsContent value="library" className="mt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Template Grid */}
            <TemplateLibrary
              templates={filteredTemplates}
              onSelect={setSelectedTemplate}
              onDuplicate={duplicateTemplate}
              onDelete={deleteTemplate}
              onExport={exportTemplate}
              onEdit={(template) => {
                setSelectedTemplate(template);
                setActiveTab('builder');
              }}
            />
          </div>
        </TabsContent>

        {/* Stage Builder Tab */}
        <TabsContent value="builder" className="mt-6">
          {selectedTemplate && (
            <StageBuilder
              template={selectedTemplate}
              onUpdate={(updates) => updateTemplate(selectedTemplate.id, updates)}
              onSave={() => {
                toast({
                  title: "Template saved",
                  description: "Changes have been saved successfully."
                });
              }}
            />
          )}
        </TabsContent>

        {/* Dependencies Tab */}
        <TabsContent value="dependencies" className="mt-6">
          {selectedTemplate && (
            <DependencyBuilder
              template={selectedTemplate}
              onUpdate={(updates) => updateTemplate(selectedTemplate.id, updates)}
            />
          )}
        </TabsContent>

        {/* Versions Tab */}
        <TabsContent value="versions" className="mt-6">
          {selectedTemplate && (
            <TemplateVersioning
              template={selectedTemplate}
              onUpdate={(updates) => updateTemplate(selectedTemplate.id, updates)}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Start with a blank template or copy from an existing project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Template Name</label>
              <Input
                placeholder="e.g., Quick Brand Sprint"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="Brief description of this template"
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTemplate}>
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}