import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Save,
  GitBranch,
  Clock,
  RotateCcw,
  Info,
  Tag,
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';

export default function TemplateVersioning({ template, onUpdate }) {
  const [versions, setVersions] = useState([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [versionTag, setVersionTag] = useState('');
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const { toast } = useToast();

  // Load versions from localStorage
  useEffect(() => {
    loadVersions();
  }, [template]);

  const loadVersions = () => {
    const versionKey = `template_versions_${template.id}`;
    const storedVersions = localStorage.getItem(versionKey);
    
    if (storedVersions) {
      setVersions(JSON.parse(storedVersions));
    } else {
      // Initialize with current version
      const initialVersion = {
        id: `v-${Date.now()}`,
        version: template.version || '1.0.0',
        tag: 'Initial',
        notes: 'Initial template version',
        timestamp: template.lastModified || new Date().toISOString(),
        snapshot: {
          stages: template.stages || [],
          stageCount: template.stageCount || 0,
          phases: template.phases || []
        },
        author: template.createdBy || 'System'
      };
      setVersions([initialVersion]);
      saveVersionsToStorage([initialVersion]);
    }
  };

  const saveVersionsToStorage = (versionList) => {
    const versionKey = `template_versions_${template.id}`;
    localStorage.setItem(versionKey, JSON.stringify(versionList));
  };

  const saveNewVersion = () => {
    if (!versionTag.trim()) {
      toast({
        title: "Version tag required",
        description: "Please enter a version tag (e.g., 2.0.0)",
        variant: "destructive"
      });
      return;
    }

    const newVersion = {
      id: `v-${Date.now()}`,
      version: versionTag,
      tag: versionTag,
      notes: versionNotes || 'No notes provided',
      timestamp: new Date().toISOString(),
      snapshot: {
        stages: template.stages || [],
        stageCount: template.stageCount || 0,
        phases: template.phases || []
      },
      author: 'Admin'
    };

    const updatedVersions = [newVersion, ...versions];
    setVersions(updatedVersions);
    saveVersionsToStorage(updatedVersions);

    // Update template version
    onUpdate({ version: versionTag });

    toast({
      title: "Version saved",
      description: `Version ${versionTag} has been saved successfully.`
    });

    // Reset form
    setShowSaveDialog(false);
    setVersionTag('');
    setVersionNotes('');
  };

  const restoreVersion = (version) => {
    // Restore the template to this version
    onUpdate({
      stages: version.snapshot.stages,
      stageCount: version.snapshot.stageCount,
      phases: version.snapshot.phases,
      version: version.version
    });

    toast({
      title: "Version restored",
      description: `Template has been restored to version ${version.version}.`
    });
  };

  const exportVersion = (version) => {
    const exportData = {
      ...template,
      ...version.snapshot,
      version: version.version,
      exportedAt: new Date().toISOString(),
      versionNotes: version.notes
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${template.name.replace(/\s+/g, '_')}_v${version.version}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Version exported",
      description: `Version ${version.version} has been exported.`
    });
  };

  const toggleVersion = (versionId) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const getVersionChanges = (version, previousVersion) => {
    if (!previousVersion) return null;

    const changes = {
      stages: version.snapshot.stageCount - previousVersion.snapshot.stageCount,
      phases: version.snapshot.phases.length - previousVersion.snapshot.phases.length
    };

    return changes;
  };

  const getNextVersion = () => {
    if (versions.length === 0) return '1.0.0';
    
    const latestVersion = versions[0].version;
    const parts = latestVersion.split('.').map(Number);
    
    // Increment patch version by default
    parts[2] = (parts[2] || 0) + 1;
    
    return parts.join('.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Version Control</h3>
          <p className="text-sm text-gray-600">
            Track changes and manage template versions
          </p>
        </div>
        <Button onClick={() => {
          setVersionTag(getNextVersion());
          setShowSaveDialog(true);
        }}>
          <Save className="w-4 h-4 mr-2" />
          Save Version
        </Button>
      </div>

      {/* Current Version Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Current Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Version</div>
              <div className="font-semibold">{template.version || '1.0.0'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Stages</div>
              <div className="font-semibold">{template.stageCount || 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Modified</div>
              <div className="font-semibold">
                {format(new Date(template.lastModified || Date.now()), 'MMM dd, yyyy HH:mm')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="w-4 h-4" />
            Version History
          </CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {versions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No version history yet</p>
              <p className="text-sm mt-1">Save your first version to start tracking changes</p>
            </div>
          ) : (
            versions.map((version, index) => {
              const previousVersion = versions[index + 1];
              const changes = getVersionChanges(version, previousVersion);
              const isExpanded = expandedVersions.has(version.id);
              
              return (
                <motion.div
                  key={version.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border rounded-lg"
                >
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleVersion(version.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant={index === 0 ? "default" : "secondary"}>
                              v{version.version}
                            </Badge>
                            {index === 0 && (
                              <Badge variant="outline" className="text-green-600">
                                Current
                              </Badge>
                            )}
                            <span className="text-sm font-medium">
                              {version.tag !== version.version && version.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(version.timestamp), 'MMM dd, yyyy HH:mm')}
                            </span>
                            <span>by {version.author}</span>
                            {changes && (
                              <>
                                {changes.stages !== 0 && (
                                  <span className={changes.stages > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {changes.stages > 0 ? '+' : ''}{changes.stages} stages
                                  </span>
                                )}
                                {changes.phases !== 0 && (
                                  <span className={changes.phases > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {changes.phases > 0 ? '+' : ''}{changes.phases} phases
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            exportVersion(version);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {index !== 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              restoreVersion(version);
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 pb-4 border-t"
                      >
                        <div className="pt-3 space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Notes</div>
                            <p className="text-sm text-gray-600 mt-1">
                              {version.notes}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 pt-2">
                            <div>
                              <div className="text-xs text-gray-500">Stages</div>
                              <div className="text-sm font-medium">
                                {version.snapshot.stageCount}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Phases</div>
                              <div className="text-sm font-medium">
                                {version.snapshot.phases.length}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Dependencies</div>
                              <div className="text-sm font-medium">
                                {version.snapshot.stages.reduce((sum, s) => 
                                  sum + (s.dependencies?.length || 0), 0
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {version.snapshot.phases.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">Phases</div>
                              <div className="flex flex-wrap gap-1">
                                {version.snapshot.phases.map((phase, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {phase}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Save Version Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Template Version</DialogTitle>
            <DialogDescription>
              Create a snapshot of the current template configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Version Tag</label>
              <Input
                placeholder="e.g., 2.0.0"
                value={versionTag}
                onChange={(e) => setVersionTag(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Version Notes</label>
              <Textarea
                placeholder="Describe the changes in this version..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={4}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This will create a snapshot of the current template with {template.stageCount || 0} stages 
                across {template.phases?.length || 0} phases.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewVersion}>
              Save Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}