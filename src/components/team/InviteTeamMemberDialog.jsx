import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  X, 
  Users, 
  Mail, 
  UserPlus,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import { useUser } from '../../contexts/SupabaseUserContext';
import { supabase } from '../../lib/supabase';

export default function InviteTeamMemberDialog({ open, onOpenChange, projectId = null }) {
  const { user, isSupabaseMode } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [formData, setFormData] = useState({
    emails: '',
    role: projectId ? 'client' : 'agency',
    message: ''
  });

  // Determine available roles based on user permissions
  const getAvailableRoles = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return projectId 
        ? ['client'] 
        : ['agency', 'viewer'];
    } else if (user.role === 'agency') {
      return ['client'];
    }
    
    return [];
  };

  const availableRoles = getAvailableRoles();

  const handleInvite = async () => {
    const emailList = formData.emails
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email);

    if (emailList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one email address",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emailList.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      toast({
        title: "Invalid emails",
        description: `Please check: ${invalidEmails.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isSupabaseMode) {
        // Send invitations via Supabase
        const results = await Promise.all(
          emailList.map(async (email) => {
            const { data, error } = await supabase.rpc('create_invitation', {
              p_email: email,
              p_role: formData.role,
              p_organization_id: user.organization_id,
              p_project_id: projectId,
              p_metadata: { message: formData.message }
            });

            return { email, data, error };
          })
        );

        const successful = results.filter(r => !r.error);
        const failed = results.filter(r => r.error);

        if (successful.length > 0) {
          // Generate invitation link for the first successful invitation
          const firstInvitation = successful[0].data;
          const link = `${window.location.origin}/invitation?token=${firstInvitation.token}`;
          setInvitationLink(link);

          toast({
            title: "Invitations sent!",
            description: `Successfully invited ${successful.length} team member(s)`,
          });

          // TODO: In production, send actual emails via Supabase Edge Functions
          // For now, show the link to copy
        }

        if (failed.length > 0) {
          toast({
            title: "Some invitations failed",
            description: `Failed to invite: ${failed.map(f => f.email).join(', ')}`,
            variant: "destructive"
          });
        }
      } else {
        // Demo mode - just show success
        const demoLink = `${window.location.origin}/invitation?token=demo-token-${Date.now()}`;
        setInvitationLink(demoLink);
        
        toast({
          title: "Demo Mode",
          description: "In production, invitations would be sent via email",
        });
      }

      // Clear form on success
      if (!invitationLink) {
        setFormData({ emails: '', role: projectId ? 'client' : 'agency', message: '' });
      }
    } catch (error) {
      console.error('Invitation error:', error);
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(invitationLink);
    toast({
      title: "Copied!",
      description: "Invitation link copied to clipboard",
    });
  };

  const resetDialog = () => {
    setFormData({ emails: '', role: projectId ? 'client' : 'agency', message: '' });
    setInvitationLink('');
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            {projectId 
              ? "Invite clients to collaborate on this project"
              : "Invite team members to your organization"
            }
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!invitationLink ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="emails">Email Addresses</Label>
                <Textarea
                  id="emails"
                  placeholder="Enter email addresses (comma or line separated)&#10;e.g., john@example.com, jane@example.com"
                  value={formData.emails}
                  onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                  className="min-h-[80px]"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500">
                  You can invite multiple people at once
                </p>
              </div>

              {availableRoles.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map(role => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a personal message to the invitation email..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[60px]"
                  disabled={isLoading}
                />
              </div>

              {!isSupabaseMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Demo mode: Invitations won't send real emails
                  </AlertDescription>
                </Alert>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Invitations created successfully!
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>Invitation Link</Label>
                <div className="flex gap-2">
                  <Input
                    value={invitationLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Share this link with invitees or wait for email delivery
                </p>
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  {isSupabaseMode 
                    ? "Email invitations will be sent automatically (when configured)"
                    : "In production, invitations would be sent via email"
                  }
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <DialogFooter>
          {!invitationLink ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={isLoading || !formData.emails}
              >
                {isLoading ? (
                  <>
                    <Send className="mr-2 h-4 w-4 animate-pulse" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invitations
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setInvitationLink('')}
              >
                Invite More
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}