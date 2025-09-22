import React from 'react';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Building2, FileText, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ProjectBasics() {
  const { projectData, updateProjectData } = useProjectInit();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Project Basics</h2>
        <p className="mt-1 text-sm text-gray-600">
          Set up the foundational details for your brand development project
        </p>
      </div>
      
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This project will use the standard 104-step brand development playbook. 
          The timeline will be calculated based on your start date and dependencies.
        </AlertDescription>
      </Alert>
      
      {/* Form Fields */}
      <div className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName" className="required">
            Project Name
          </Label>
          <Input
            id="projectName"
            placeholder="e.g., Acme Corp Brand Development"
            value={projectData.projectName || ''}
            onChange={(e) => updateProjectData({ projectName: e.target.value })}
            className="max-w-md"
          />
          <p className="text-xs text-gray-500">
            Choose a clear, memorable name for this project
          </p>
        </div>
        
        {/* Client Organization */}
        <div className="space-y-2">
          <Label htmlFor="clientOrg" className="required">
            Client Organization
          </Label>
          <div className="relative max-w-md">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="clientOrg"
              placeholder="e.g., Acme Corporation"
              value={projectData.clientOrganization || ''}
              onChange={(e) => updateProjectData({ clientOrganization: e.target.value })}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-gray-500">
            The company or organization you're developing the brand for
          </p>
        </div>
        
        {/* Start Date */}
        <div className="space-y-2">
          <Label className="required">Project Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full max-w-md justify-start text-left font-normal",
                  !projectData.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {projectData.startDate ? (
                  format(new Date(projectData.startDate), "PPP")
                ) : (
                  <span>Select start date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={projectData.startDate ? new Date(projectData.startDate) : undefined}
                onSelect={(date) => updateProjectData({ startDate: date?.toISOString() })}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-500">
            This anchors your entire timeline. All 104 stages will be scheduled from this date.
          </p>
        </div>
        
        {/* Project Description */}
        <div className="space-y-2">
          <Label htmlFor="description">
            Project Description
            <span className="text-gray-400 text-xs ml-2">(Optional)</span>
          </Label>
          <Textarea
            id="description"
            placeholder="Brief description of the project scope and objectives..."
            value={projectData.projectDescription || ''}
            onChange={(e) => updateProjectData({ projectDescription: e.target.value })}
            className="max-w-2xl min-h-[100px]"
          />
          <p className="text-xs text-gray-500">
            Add any context or special notes about this project
          </p>
        </div>
      </div>
      
      {/* Summary Box */}
      {projectData.projectName && projectData.clientOrganization && projectData.startDate && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Project Summary</h3>
          <div className="space-y-1 text-sm text-blue-800">
            <div>
              <span className="font-medium">Project:</span> {projectData.projectName}
            </div>
            <div>
              <span className="font-medium">Client:</span> {projectData.clientOrganization}
            </div>
            <div>
              <span className="font-medium">Start Date:</span> {format(new Date(projectData.startDate), "MMMM d, yyyy")}
            </div>
            <div>
              <span className="font-medium">Expected Duration:</span> ~6-8 months (based on standard playbook)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}