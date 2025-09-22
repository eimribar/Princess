import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  Linkedin,
  Crown,
  Save,
  Loader2,
  Camera,
  Trash2
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { TeamMember } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function TeamMemberModal({
  open,
  onOpenChange,
  member = null, // null for new member, object for existing
  onSave,
  onDelete,
  canEdit = true
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Add refs to manage timeouts and prevent race conditions
  const timeoutRef = useRef(null);
  const isOperationPendingRef = useRef(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    team_type: "agency",
    is_decision_maker: false,
    linkedin_url: "",
    bio: "",
    department: "",
    location: "",
    profile_image: null
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isOperationPendingRef.current = false;
    };
  }, []);
  
  // Initialize form when member changes or modal opens
  useEffect(() => {
    if (open) {
      // Reset loading states when modal opens
      setIsSaving(false);
      setIsDeleting(false);
      setIsLoading(false);
      isOperationPendingRef.current = false;
      
      if (member && member.id) {
        // Existing member - load all data
        setFormData({
          name: member.name || "",
          email: member.email || "",
          phone: member.phone || "",
          role: member.role || "",
          team_type: member.team_type || "agency",
          is_decision_maker: member.is_decision_maker || false,
          linkedin_url: member.linkedin_url || "",
          bio: member.bio || "",
          department: member.department || "",
          location: member.location || "",
          profile_image: member.profile_image || null
        });
        setPreviewUrl(member.profile_image);
      } else {
        // New member - check for pre-populated fields (like team_type)
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          team_type: member?.team_type || "agency", // Preserve pre-populated team_type
          is_decision_maker: false,
          linkedin_url: "",
          bio: "",
          department: "",
          location: "",
          profile_image: null
        });
        setPreviewUrl(null);
      }
      setProfileImageFile(null);
    } else {
      // Clean up when modal closes
      setIsSaving(false);
      setIsDeleting(false);
      setIsLoading(false);
      setProfileImageFile(null);
      
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isOperationPendingRef.current = false;
    }
  }, [member, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setProfileImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImageFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, profile_image: null }));
  };

  const handleSave = async () => {
    // Prevent duplicate saves and race conditions
    if (isSaving || isOperationPendingRef.current) {
      console.log('Save already in progress, ignoring duplicate request');
      return;
    }
    
    isOperationPendingRef.current = true;
    
    // Validation
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Missing required fields",
        description: "Please fill in name, email, and role",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Add timeout protection
    timeoutRef.current = setTimeout(() => {
      console.error('Operation timed out after 30 seconds');
      setIsSaving(false);
      isOperationPendingRef.current = false;
      toast({
        title: "Operation timed out",
        description: "The operation took too long. Please try again.",
        variant: "destructive"
      });
    }, 30000); // 30 second timeout

    try {
      let imageUrl = formData.profile_image;

      // Upload new image if selected
      if (profileImageFile) {
        try {
          const uploadResult = await UploadFile.upload(profileImageFile);
          imageUrl = uploadResult.file_url;
        } catch (error) {
          console.error("Image upload failed:", error);
          // Continue without image
        }
      }

      const dataToSave = {
        ...formData,
        profile_image: imageUrl,
        team_type: formData.team_type || 'agency' // Ensure team_type is always set
      };

      console.log('Saving team member:', dataToSave);

      let result;
      if (member && member.id) {
        // Update existing member (only if member has an ID)
        result = await TeamMember.update(member.id, dataToSave);
        console.log('Update result:', result);
        toast({
          title: "Team member updated",
          description: `${formData.name} has been updated successfully`
        });
      } else {
        // Create new member
        console.log('Starting team member creation...');
        result = await TeamMember.create(dataToSave);
        console.log('Create result:', result);
        
        if (!result) {
          throw new Error('Failed to create team member - no result returned');
        }
        
        toast({
          title: "Team member added",
          description: `${formData.name} has been added to the team`
        });
      }

      // Clear timeout AFTER operation completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Clear loading state
      setIsSaving(false);
      isOperationPendingRef.current = false;
      
      // Close modal after everything is done
      onOpenChange(false);
      
      // Refresh the list in the background (non-blocking)
      if (onSave) {
        // Don't await - let it run in background
        setTimeout(() => {
          onSave(dataToSave).catch(err => {
            console.error('Error refreshing team list:', err);
          });
        }, 100); // Small delay to ensure modal closes first
      }
    } catch (error) {
      console.error("Error saving team member:", error);
      
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // More specific error message
      let errorMessage = "Failed to save team member.";
      if (error.message) {
        errorMessage += ` Error: ${error.message}`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Ensure all states are cleared
      setIsSaving(false);
      isOperationPendingRef.current = false;
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    
    // Prevent duplicate deletes and race conditions
    if (isDeleting || isOperationPendingRef.current) {
      console.log('Delete already in progress, ignoring duplicate request');
      return;
    }
    
    isOperationPendingRef.current = true;

    const confirmed = window.confirm(`Are you sure you want to remove ${member.name} from the team?`);
    if (!confirmed) return;

    setIsDeleting(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Add timeout protection for delete
    timeoutRef.current = setTimeout(() => {
      console.error('Delete operation timed out after 15 seconds');
      setIsDeleting(false);
      isOperationPendingRef.current = false;
      toast({
        title: "Operation timed out",
        description: "The delete operation took too long. Please try again.",
        variant: "destructive"
      });
    }, 15000); // 15 second timeout for delete

    try {
      await TeamMember.delete(member.id);
      
      // Clear timeout after operation completes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Clear loading state
      setIsDeleting(false);
      isOperationPendingRef.current = false;
      
      toast({
        title: "Team member removed",
        description: `${member.name} has been removed from the team`
      });
      
      // Close modal after everything is done
      onOpenChange(false);
      
      // Refresh list in background
      if (onDelete) {
        setTimeout(() => {
          onDelete().catch(err => {
            console.error('Error refreshing after delete:', err);
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error deleting team member:", error);
      
      // Clear timeout on error
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      toast({
        title: "Error",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
      
      // Ensure all states are cleared
      setIsDeleting(false);
      isOperationPendingRef.current = false;
    }
  };

  const isViewMode = member && !canEdit;
  const modalTitle = member 
    ? (isViewMode ? "Team Member Details" : "Edit Team Member")
    : "Add New Team Member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{modalTitle}</DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Profile Image Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                  {formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="w-10 h-10" />}
                </div>
              )}
              {!isViewMode && (
                <label className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isSaving}
                  />
                </label>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {formData.name || "New Team Member"}
              </h3>
              <p className="text-sm text-gray-500">{formData.role || "No role assigned"}</p>
              {!isViewMode && previewUrl && (
                <button
                  onClick={handleRemoveImage}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isViewMode || isSaving}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="john@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={isViewMode || isSaving}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={isViewMode || isSaving}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label htmlFor="role">Role/Position *</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                  disabled={isViewMode || isSaving}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Creative Director">Creative Director</SelectItem>
                    <SelectItem value="Project Manager">Project Manager</SelectItem>
                    <SelectItem value="UX Designer">UX Designer</SelectItem>
                    <SelectItem value="UI Designer">UI Designer</SelectItem>
                    <SelectItem value="Design Lead">Design Lead</SelectItem>
                    <SelectItem value="Frontend Developer">Frontend Developer</SelectItem>
                    <SelectItem value="Backend Developer">Backend Developer</SelectItem>
                    <SelectItem value="Full Stack Developer">Full Stack Developer</SelectItem>
                    <SelectItem value="QA Engineer">QA Engineer</SelectItem>
                    <SelectItem value="Brand Strategist">Brand Strategist</SelectItem>
                    <SelectItem value="Senior Copywriter">Senior Copywriter</SelectItem>
                    <SelectItem value="Marketing Director">Marketing Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Engineering, Design"
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
                disabled={isViewMode || isSaving}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., New York, Remote"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                disabled={isViewMode || isSaving}
              />
            </div>

            {/* Team Type */}
            <div className="space-y-2">
              <Label htmlFor="team_type">Team Type</Label>
              <Select
                value={formData.team_type}
                onValueChange={(value) => handleInputChange("team_type", value)}
                disabled={isViewMode || isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                  disabled={isViewMode || isSaving}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              placeholder="Brief description about the team member..."
              value={formData.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              disabled={isViewMode || isSaving}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Decision Maker Toggle */}
          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <Crown className="w-5 h-5 text-yellow-600" />
              <div>
                <Label htmlFor="decision_maker" className="text-base font-medium">
                  Decision Maker
                </Label>
                <p className="text-sm text-gray-600">
                  Can approve deliverables and make key project decisions
                </p>
              </div>
            </div>
            <Switch
              id="decision_maker"
              checked={formData.is_decision_maker}
              onCheckedChange={(checked) => handleInputChange("is_decision_maker", checked)}
              disabled={isViewMode || isSaving}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            {member && canEdit && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Remove Member
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isDeleting}
            >
              {isViewMode ? "Close" : "Cancel"}
            </Button>
            {!isViewMode && (
              <Button
                onClick={handleSave}
                disabled={isSaving || isDeleting}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {member ? "Save Changes" : "Add Team Member"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}