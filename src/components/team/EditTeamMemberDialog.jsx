import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamMember } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Upload, Loader2, X, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUser } from '@/contexts/ClerkUserContext';
import { canManageTeamMember } from '@/lib/permissions';
import { useToast } from "@/components/ui/use-toast";

export default function EditTeamMemberDialog({ member, open, onOpenChange, onMemberUpdated, onMemberDeleted }) {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    linkedin_url: "",
    is_decision_maker: false,
    team_type: "agency",
    notification_preferences: {
      email: true,
      sms: false,
      level: "actions_required"
    }
  });
  
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load member data when dialog opens
  useEffect(() => {
    if (member && open) {
      setFormData({
        name: member.name || "",
        email: member.email || "",
        role: member.role || "",
        linkedin_url: member.linkedin_url || "",
        is_decision_maker: member.is_decision_maker || false,
        team_type: member.team_type || "agency",
        notification_preferences: member.notification_preferences || {
          email: true,
          sms: false,
          level: "actions_required"
        }
      });
      setProfileImageUrl(member.profile_image || "");
    }
  }, [member, open]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [field]: value
      }
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);
    try {
      const result = await UploadFile.upload({ file });
      if (result && result.file_url) {
        setProfileImageUrl(result.file_url);
        toast({
          title: "Upload Successful",
          description: "Profile image uploaded successfully.",
          className: "bg-green-500 text-white"
        });
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload profile image. Please try again.",
        variant: "destructive"
      });
    }
    setIsUploadingImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !member?.id) return;

    setIsSubmitting(true);
    try {
      const memberData = {
        ...formData,
        profile_image: profileImageUrl || null
      };

      await TeamMember.update(member.id, memberData);
      onMemberUpdated();
      onOpenChange(false);
      
      toast({
        title: "Member Updated",
        description: `${formData.name} has been updated successfully.`,
        className: "bg-green-500 text-white"
      });
    } catch (error) {
      console.error("Error updating team member:", error);
      toast({
        title: "Update Failed",
        description: "Could not update team member. Please try again.",
        variant: "destructive"
      });
    }
    setIsSubmitting(false);
  };

  const handleDelete = async () => {
    if (!member?.id) return;
    
    setIsDeleting(true);
    try {
      await TeamMember.delete(member.id);
      onMemberDeleted();
      onOpenChange(false);
      setShowDeleteDialog(false);
      
      toast({
        title: "Member Removed",
        description: `${member.name} has been removed from the team.`,
        className: "bg-red-500 text-white"
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        title: "Delete Failed",
        description: "Could not remove team member. Please try again.",
        variant: "destructive"
      });
    }
    setIsDeleting(false);
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';
  
  const canEdit = canManageTeamMember(user, member);

  if (!member) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {canEdit ? 'Edit Team Member' : 'View Team Member'}
            </DialogTitle>
            <DialogDescription>
              {canEdit 
                ? "Update team member information and permissions."
                : "View team member details."
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-slate-100">
                  <AvatarImage src={profileImageUrl} alt={formData.name} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-semibold">
                    {getInitials(formData.name) || 'TM'}
                  </AvatarFallback>
                </Avatar>
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              
              {canEdit && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('profile-upload-edit').click()}
                    disabled={isUploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {profileImageUrl ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {profileImageUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setProfileImageUrl("")}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}
              <input
                id="profile-upload-edit"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., John Smith"
                  disabled={!canEdit}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="john@company.com"
                  disabled={!canEdit}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Job Title / Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  placeholder="e.g., Creative Director"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-type">Team Type</Label>
                <Select
                  value={formData.team_type}
                  onValueChange={(value) => handleInputChange('team_type', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agency">Agency Team</SelectItem>
                    <SelectItem value="client">Client Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
              <Input
                id="linkedin"
                value={formData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                placeholder="https://linkedin.com/in/username"
                disabled={!canEdit}
              />
            </div>

            {/* Decision Maker Toggle */}
            <div className={`flex items-center justify-between space-x-2 p-4 rounded-lg border ${
              formData.is_decision_maker 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="space-y-1">
                <Label htmlFor="decision-maker" className={`text-sm font-medium ${
                  formData.is_decision_maker ? 'text-amber-900' : 'text-gray-700'
                }`}>
                  Decision Maker
                </Label>
                <p className={`text-xs ${
                  formData.is_decision_maker ? 'text-amber-700' : 'text-gray-600'
                }`}>
                  Can approve deliverables and make final project decisions
                </p>
              </div>
              <Switch
                id="decision-maker"
                checked={formData.is_decision_maker}
                onCheckedChange={(checked) => handleInputChange('is_decision_maker', checked)}
                disabled={!canEdit}
              />
            </div>

            {/* Notification Preferences */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h4 className="font-semibold text-slate-900">Notification Preferences</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={formData.notification_preferences.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="email-notifications" className="text-sm">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="sms-notifications"
                    checked={formData.notification_preferences.sms}
                    onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    disabled={!canEdit}
                  />
                  <Label htmlFor="sms-notifications" className="text-sm">SMS Notifications</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-level">Notification Level</Label>
                <Select
                  value={formData.notification_preferences.level}
                  onValueChange={(value) => handleNotificationChange('level', value)}
                  disabled={!canEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Updates</SelectItem>
                    <SelectItem value="deliverables_only">Deliverables Only</SelectItem>
                    <SelectItem value="actions_required">Actions Required Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          <DialogFooter className="flex justify-between">
            <div>
              {canEdit && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove Member
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {canEdit ? 'Cancel' : 'Close'}
              </Button>
              {canEdit && (
                <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.email}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Member'
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{member?.name}</strong> from the team? 
              This action cannot be undone and they will lose access to the project.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}