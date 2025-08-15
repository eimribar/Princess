import React, { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TeamMember } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Upload, Loader2, X } from "lucide-react";

export default function AddTeamMemberDialog({ open, onOpenChange, onMemberAdded }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    linkedin_url: "",
    is_decision_maker: false,
    notification_preferences: {
      email: true,
      sms: false,
      level: "actions_required"
    }
  });
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

    setIsUploadingImage(true);
    try {
      const result = await UploadFile({ file });
      setProfileImageUrl(result.file_url);
      setProfileImage(file);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
    setIsUploadingImage(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsSubmitting(true);
    try {
      const memberData = {
        ...formData,
        profile_image: profileImageUrl || null
      };

      await TeamMember.create(memberData);
      onMemberAdded();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "",
        linkedin_url: "",
        is_decision_maker: false,
        notification_preferences: {
          email: true,
          sms: false,
          level: "actions_required"
        }
      });
      setProfileImage(null);
      setProfileImageUrl("");
    } catch (error) {
      console.error("Error adding team member:", error);
    }
    setIsSubmitting(false);
  };

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member to the project with their role and permissions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-slate-100">
                <AvatarImage src={profileImageUrl} alt={formData.name} />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-semibold">
                  {formData.name ? getInitials(formData.name) : <Upload className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              {isUploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('profile-upload').click()}
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
                  onClick={() => {
                    setProfileImageUrl("");
                    setProfileImage(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            <input
              id="profile-upload"
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
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Job Title / Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              placeholder="e.g., Creative Director, Project Manager"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn Profile (Optional)</Label>
            <Input
              id="linkedin"
              value={formData.linkedin_url}
              onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </div>

          {/* Decision Maker Toggle */}
          <div className="flex items-center justify-between space-x-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="space-y-1">
              <Label htmlFor="decision-maker" className="text-sm font-medium text-amber-900">
                Decision Maker
              </Label>
              <p className="text-xs text-amber-700">
                Can approve deliverables and make final project decisions
              </p>
            </div>
            <Switch
              id="decision-maker"
              checked={formData.is_decision_maker}
              onCheckedChange={(checked) => handleInputChange('is_decision_maker', checked)}
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
                />
                <Label htmlFor="email-notifications" className="text-sm">Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sms-notifications"
                  checked={formData.notification_preferences.sms}
                  onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                />
                <Label htmlFor="sms-notifications" className="text-sm">SMS Notifications</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification-level">Notification Level</Label>
              <Select
                value={formData.notification_preferences.level}
                onValueChange={(value) => handleNotificationChange('level', value)}
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

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.email}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding Member...
              </>
            ) : (
              'Add Team Member'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}