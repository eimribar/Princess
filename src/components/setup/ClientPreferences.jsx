import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Shield,
  Palette,
  Upload,
  Link,
  Settings,
  Users,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Slack,
  FileText,
  Image,
  Zap,
  Calendar,
  Clock,
  Star,
  X,
  Plus
} from 'lucide-react';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';

// Notification levels
const NOTIFICATION_LEVELS = {
  all: {
    name: 'All Activity',
    description: 'Get notified about every change and update',
    icon: Bell,
    frequency: 'High'
  },
  important: {
    name: 'Important Only',
    description: 'Deliverables, approvals, and blockers',
    icon: Star,
    frequency: 'Medium'
  },
  critical: {
    name: 'Critical Only',
    description: 'Only urgent items requiring immediate action',
    icon: AlertTriangle,
    frequency: 'Low'
  }
};

// Access levels
const ACCESS_LEVELS = {
  full: {
    name: 'Full Access',
    description: 'View and edit all project content',
    permissions: ['View all', 'Edit stages', 'Approve deliverables', 'Manage team'],
    icon: Shield,
    color: 'text-green-600'
  },
  standard: {
    name: 'Standard Access',
    description: 'View project and provide feedback',
    permissions: ['View project', 'Comment', 'Review deliverables'],
    icon: Users,
    color: 'text-blue-600'
  },
  limited: {
    name: 'Limited Access',
    description: 'View-only access to key information',
    permissions: ['View timeline', 'View deliverables'],
    icon: Eye,
    color: 'text-gray-600'
  }
};

// Integration options
const INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Post updates to your Slack workspace',
    icon: MessageSquare,
    configured: false,
    fields: ['workspace', 'channel']
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Sync deliverables to Google Drive',
    icon: FileText,
    configured: false,
    fields: ['folder_id']
  },
  {
    id: 'calendar',
    name: 'Calendar Sync',
    description: 'Add milestones to your calendar',
    icon: Calendar,
    configured: false,
    fields: ['calendar_type']
  }
];

export default function ClientPreferences() {
  const { projectData, updateProjectData } = useWizard();
  const { toast } = useToast();
  
  // Notification preferences
  const [notificationLevel, setNotificationLevel] = useState(
    projectData.preferences?.notifications?.level || 'important'
  );
  const [emailNotifications, setEmailNotifications] = useState(
    projectData.preferences?.notifications?.email !== false
  );
  const [smsNotifications, setSmsNotifications] = useState(
    projectData.preferences?.notifications?.sms || false
  );
  const [inAppNotifications, setInAppNotifications] = useState(
    projectData.preferences?.notifications?.inApp !== false
  );
  const [notificationSchedule, setNotificationSchedule] = useState(
    projectData.preferences?.notifications?.schedule || 'realtime'
  );
  const [dailyDigestTime, setDailyDigestTime] = useState(
    projectData.preferences?.notifications?.digestTime || '09:00'
  );
  
  // Access control
  const [defaultAccessLevel, setDefaultAccessLevel] = useState(
    projectData.preferences?.access?.defaultLevel || 'standard'
  );
  const [requireApproval, setRequireApproval] = useState(
    projectData.preferences?.access?.requireApproval || false
  );
  const [allowGuestAccess, setAllowGuestAccess] = useState(
    projectData.preferences?.access?.allowGuests || false
  );
  
  // Branding
  const [projectName, setProjectName] = useState(
    projectData.name || ''
  );
  const [projectDescription, setProjectDescription] = useState(
    projectData.description || ''
  );
  const [brandLogo, setBrandLogo] = useState(
    projectData.preferences?.branding?.logo || null
  );
  const [primaryColor, setPrimaryColor] = useState(
    projectData.preferences?.branding?.primaryColor || '#3B82F6'
  );
  const [coverImage, setCoverImage] = useState(
    projectData.preferences?.branding?.coverImage || null
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    projectData.preferences?.branding?.welcomeMessage || ''
  );
  
  // Integrations
  const [activeIntegrations, setActiveIntegrations] = useState(
    projectData.preferences?.integrations || []
  );
  const [showIntegrationDialog, setShowIntegrationDialog] = useState(false);
  const [configuringIntegration, setConfiguringIntegration] = useState(null);
  const [integrationConfig, setIntegrationConfig] = useState({});
  
  // Tab state
  const [activeTab, setActiveTab] = useState('notifications');
  
  // Update project data
  useEffect(() => {
    updateProjectData({
      name: projectName,
      description: projectDescription,
      preferences: {
        notifications: {
          level: notificationLevel,
          email: emailNotifications,
          sms: smsNotifications,
          inApp: inAppNotifications,
          schedule: notificationSchedule,
          digestTime: dailyDigestTime
        },
        access: {
          defaultLevel: defaultAccessLevel,
          requireApproval,
          allowGuests: allowGuestAccess
        },
        branding: {
          logo: brandLogo,
          primaryColor,
          coverImage,
          welcomeMessage
        },
        integrations: activeIntegrations
      }
    });
  }, [
    projectName,
    projectDescription,
    notificationLevel,
    emailNotifications,
    smsNotifications,
    inAppNotifications,
    notificationSchedule,
    dailyDigestTime,
    defaultAccessLevel,
    requireApproval,
    allowGuestAccess,
    brandLogo,
    primaryColor,
    coverImage,
    welcomeMessage,
    activeIntegrations
  ]);
  
  // Handle file upload
  const handleFileUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    
    if (type === 'logo') {
      setBrandLogo(url);
    } else if (type === 'cover') {
      setCoverImage(url);
    }
    
    toast({
      title: "Image Uploaded",
      description: `Your ${type} image has been uploaded successfully.`,
    });
  };
  
  // Configure integration
  const handleConfigureIntegration = (integration) => {
    setConfiguringIntegration(integration);
    setShowIntegrationDialog(true);
  };
  
  // Save integration configuration
  const handleSaveIntegration = () => {
    const updatedIntegration = {
      ...configuringIntegration,
      configured: true,
      config: integrationConfig
    };
    
    setActiveIntegrations([
      ...activeIntegrations.filter(i => i.id !== updatedIntegration.id),
      updatedIntegration
    ]);
    
    setShowIntegrationDialog(false);
    setConfiguringIntegration(null);
    setIntegrationConfig({});
    
    toast({
      title: "Integration Configured",
      description: `${configuringIntegration.name} has been connected successfully.`,
    });
  };
  
  // Remove integration
  const handleRemoveIntegration = (integrationId) => {
    setActiveIntegrations(activeIntegrations.filter(i => i.id !== integrationId));
    
    toast({
      title: "Integration Removed",
      description: "The integration has been disconnected.",
    });
  };
  
  // Test notification
  const handleTestNotification = () => {
    toast({
      title: "Test Notification",
      description: "This is how notifications will appear to your team.",
    });
  };
  
  // Preview branding
  const renderBrandingPreview = () => (
    <Card className="overflow-hidden">
      {/* Cover Image */}
      {coverImage ? (
        <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />
      ) : (
        <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600" />
      )}
      
      {/* Logo and Project Info */}
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {brandLogo ? (
            <img src={brandLogo} alt="Logo" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: primaryColor }}
            >
              {projectName ? projectName[0] : 'P'}
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold" style={{ color: primaryColor }}>
              {projectName || 'Your Project Name'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {projectDescription || 'Your project description will appear here'}
            </p>
            
            {welcomeMessage && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{welcomeMessage}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <div className="space-y-6">
      {/* Project Basics */}
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Basic information about your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project Name</Label>
              <Input
                placeholder="e.g., Brand Refresh 2024"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
              />
            </div>
            <div>
              <Label>Project Code (Optional)</Label>
              <Input
                placeholder="e.g., BR-2024"
                defaultValue=""
              />
            </div>
            <div className="md:col-span-2">
              <Label>Project Description</Label>
              <Textarea
                placeholder="Brief description of the project goals and scope..."
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Main Settings */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="access">Access Control</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
            </TabsList>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6 mt-6">
              {/* Notification Level */}
              <div>
                <Label className="mb-3 block">Notification Level</Label>
                <RadioGroup value={notificationLevel} onValueChange={setNotificationLevel}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {Object.entries(NOTIFICATION_LEVELS).map(([key, level]) => {
                      const Icon = level.icon;
                      return (
                        <Card
                          key={key}
                          className={`cursor-pointer transition-all ${
                            notificationLevel === key ? 'ring-2 ring-blue-500' : ''
                          }`}
                          onClick={() => setNotificationLevel(key)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={key} id={key} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-gray-600" />
                                  <Label htmlFor={key} className="font-medium cursor-pointer">
                                    {level.name}
                                  </Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                                <Badge variant="outline" className="mt-2">
                                  {level.frequency} frequency
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
              
              {/* Notification Channels */}
              <div>
                <Label className="mb-3 block">Notification Channels</Label>
                <div className="space-y-3">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-gray-600">
                              Receive updates via email
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Smartphone className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">SMS Notifications</div>
                            <div className="text-sm text-gray-600">
                              Get critical alerts via text message
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={smsNotifications}
                          onCheckedChange={setSmsNotifications}
                        />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <div className="font-medium">In-App Notifications</div>
                            <div className="text-sm text-gray-600">
                              See notifications within the platform
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={inAppNotifications}
                          onCheckedChange={setInAppNotifications}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Notification Schedule */}
              <div>
                <Label className="mb-3 block">Notification Schedule</Label>
                <RadioGroup value={notificationSchedule} onValueChange={setNotificationSchedule}>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="realtime" id="realtime" />
                      <Label htmlFor="realtime">Real-time (immediate notifications)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily">Daily digest</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="weekly" id="weekly" />
                      <Label htmlFor="weekly">Weekly summary</Label>
                    </div>
                  </div>
                </RadioGroup>
                
                {notificationSchedule === 'daily' && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <Label>Daily Digest Time</Label>
                    <Input
                      type="time"
                      value={dailyDigestTime}
                      onChange={(e) => setDailyDigestTime(e.target.value)}
                      className="mt-1 w-32"
                    />
                  </div>
                )}
              </div>
              
              {/* Test Notification */}
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleTestNotification}>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            </TabsContent>
            
            {/* Access Control Tab */}
            <TabsContent value="access" className="space-y-6 mt-6">
              {/* Default Access Level */}
              <div>
                <Label className="mb-3 block">Default Client Access Level</Label>
                <RadioGroup value={defaultAccessLevel} onValueChange={setDefaultAccessLevel}>
                  <div className="space-y-3">
                    {Object.entries(ACCESS_LEVELS).map(([key, level]) => {
                      const Icon = level.icon;
                      return (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <RadioGroupItem value={key} id={`access-${key}`} className="mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${level.color}`} />
                                  <Label htmlFor={`access-${key}`} className="font-medium cursor-pointer">
                                    {level.name}
                                  </Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{level.description}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {level.permissions.map((perm, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {perm}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
              
              {/* Additional Settings */}
              <div className="space-y-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Require Approval</div>
                        <div className="text-sm text-gray-600">
                          New team members need approval to join
                        </div>
                      </div>
                      <Switch
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Allow Guest Access</div>
                        <div className="text-sm text-gray-600">
                          Enable temporary access for external stakeholders
                        </div>
                      </div>
                      <Switch
                        checked={allowGuestAccess}
                        onCheckedChange={setAllowGuestAccess}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Security Note */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Note</AlertTitle>
                <AlertDescription>
                  Access permissions can be customized per team member after project creation.
                  These settings define the default for new members.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6 mt-6">
              {/* Logo and Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Brand Logo</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
                        <CardContent className="p-8 text-center">
                          {brandLogo ? (
                            <img src={brandLogo} alt="Logo" className="w-24 h-24 mx-auto rounded-lg object-cover" />
                          ) : (
                            <>
                              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">Click to upload logo</p>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </label>
                  </div>
                </div>
                
                <div>
                  <Label>Primary Brand Color</Label>
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-20 h-12"
                      />
                      <Input
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      {['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B'].map(color => (
                        <button
                          key={color}
                          className="w-10 h-10 rounded-lg border-2 border-gray-200"
                          style={{ backgroundColor: color }}
                          onClick={() => setPrimaryColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Cover Image */}
              <div>
                <Label>Cover Image</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'cover')}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label htmlFor="cover-upload">
                    <Card className="cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden">
                      <CardContent className="p-0">
                        {coverImage ? (
                          <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url(${coverImage})` }} />
                        ) : (
                          <div className="h-32 flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                              <Image className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Click to upload cover image</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </label>
                </div>
              </div>
              
              {/* Welcome Message */}
              <div>
                <Label>Welcome Message</Label>
                <Textarea
                  placeholder="Welcome to your brand development project! We're excited to work with you..."
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-sm text-gray-600 mt-1">
                  This message will be displayed to clients when they first access the project.
                </p>
              </div>
              
              {/* Preview */}
              <div>
                <Label className="mb-3 block">Preview</Label>
                {renderBrandingPreview()}
              </div>
            </TabsContent>
            
            {/* Integrations Tab */}
            <TabsContent value="integrations" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {INTEGRATIONS.map(integration => {
                  const Icon = integration.icon;
                  const isActive = activeIntegrations.find(i => i.id === integration.id);
                  
                  return (
                    <Card key={integration.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              isActive ? 'bg-green-100' : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                isActive ? 'text-green-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                {integration.description}
                              </div>
                              {isActive && (
                                <Badge className="mt-2 bg-green-100 text-green-700">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Connected
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant={isActive ? "outline" : "default"}
                            size="sm"
                            onClick={() => isActive ? handleRemoveIntegration(integration.id) : handleConfigureIntegration(integration)}
                          >
                            {isActive ? 'Disconnect' : 'Connect'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>More Integrations Coming Soon</AlertTitle>
                <AlertDescription>
                  We're working on adding more integrations including Microsoft Teams, 
                  Asana, Trello, and more. Stay tuned!
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Integration Configuration Dialog */}
      <Dialog open={showIntegrationDialog} onOpenChange={setShowIntegrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {configuringIntegration?.name}</DialogTitle>
            <DialogDescription>
              Connect your {configuringIntegration?.name} account to enable automatic updates.
            </DialogDescription>
          </DialogHeader>
          
          {configuringIntegration && (
            <div className="space-y-4">
              {configuringIntegration.id === 'slack' && (
                <>
                  <div>
                    <Label>Workspace URL</Label>
                    <Input
                      placeholder="your-workspace.slack.com"
                      onChange={(e) => setIntegrationConfig({ ...integrationConfig, workspace: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Channel</Label>
                    <Input
                      placeholder="#project-updates"
                      onChange={(e) => setIntegrationConfig({ ...integrationConfig, channel: e.target.value })}
                    />
                  </div>
                </>
              )}
              
              {configuringIntegration.id === 'google-drive' && (
                <div>
                  <Label>Folder ID</Label>
                  <Input
                    placeholder="Enter Google Drive folder ID"
                    onChange={(e) => setIntegrationConfig({ ...integrationConfig, folder_id: e.target.value })}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    You can find this in the folder's URL after /folders/
                  </p>
                </div>
              )}
              
              {configuringIntegration.id === 'calendar' && (
                <div>
                  <Label>Calendar Type</Label>
                  <Select
                    onValueChange={(value) => setIntegrationConfig({ ...integrationConfig, calendar_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select calendar type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">Google Calendar</SelectItem>
                      <SelectItem value="outlook">Outlook Calendar</SelectItem>
                      <SelectItem value="apple">Apple Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntegrationDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveIntegration}>
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}