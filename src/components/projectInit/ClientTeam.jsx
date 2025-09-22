import React, { useState } from 'react';
import { useProjectInit } from '@/pages/ProjectInitiation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  UserCheck, 
  Plus, 
  X, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ClientTeam() {
  const { projectData, updateProjectData } = useProjectInit();
  const [newContact, setNewContact] = useState({ name: '', email: '', phone: '', role: 'contact' });
  const [errors, setErrors] = useState({});
  
  const decisionMakers = projectData.decisionMakers || [];
  const clientContacts = projectData.clientContacts || [];
  
  // Validate email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  // Add decision maker
  const addDecisionMaker = () => {
    const validationErrors = {};
    
    if (!newContact.name) validationErrors.name = 'Name is required';
    if (!newContact.email) validationErrors.email = 'Email is required';
    else if (!validateEmail(newContact.email)) validationErrors.email = 'Invalid email format';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Check max 2 decision makers
    if (decisionMakers.length >= 2) {
      alert('Maximum 2 decision makers allowed');
      return;
    }
    
    const updatedDecisionMakers = [...decisionMakers, {
      ...newContact,
      id: Date.now().toString(),
      isDecisionMaker: true
    }];
    
    updateProjectData({ decisionMakers: updatedDecisionMakers });
    setNewContact({ name: '', email: '', phone: '', role: 'contact' });
    setErrors({});
  };
  
  // Add regular contact
  const addClientContact = () => {
    const validationErrors = {};
    
    if (!newContact.name) validationErrors.name = 'Name is required';
    if (!newContact.email) validationErrors.email = 'Email is required';
    else if (!validateEmail(newContact.email)) validationErrors.email = 'Invalid email format';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const updatedContacts = [...clientContacts, {
      ...newContact,
      id: Date.now().toString(),
      isDecisionMaker: false
    }];
    
    updateProjectData({ clientContacts: updatedContacts });
    setNewContact({ name: '', email: '', phone: '', role: 'contact' });
    setErrors({});
  };
  
  // Remove contact
  const removeDecisionMaker = (id) => {
    updateProjectData({ 
      decisionMakers: decisionMakers.filter(dm => dm.id !== id) 
    });
  };
  
  const removeClientContact = (id) => {
    updateProjectData({ 
      clientContacts: clientContacts.filter(c => c.id !== id) 
    });
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Client Team & Approvers</h2>
        <p className="mt-1 text-sm text-gray-600">
          Define who can approve deliverables and receive notifications
        </p>
      </div>
      
      {/* Decision Makers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Decision Makers
              <Badge variant="destructive" className="ml-2">Required</Badge>
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              These people can approve deliverables (max 2)
            </p>
          </div>
          <Badge variant="outline" className="gap-1">
            <UserCheck className="w-3 h-3" />
            {decisionMakers.length}/2
          </Badge>
        </div>
        
        {/* Decision Makers List */}
        {decisionMakers.length > 0 && (
          <div className="space-y-2">
            {decisionMakers.map((dm) => (
              <Card key={dm.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{dm.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {dm.email}
                        </span>
                        {dm.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {dm.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDecisionMaker(dm.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add Decision Maker Form */}
        {decisionMakers.length < 2 && (
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Input
                    placeholder="Full name *"
                    value={newContact.name}
                    onChange={(e) => {
                      setNewContact({ ...newContact, name: e.target.value });
                      setErrors({ ...errors, name: '' });
                    }}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <Input
                    placeholder="Email address *"
                    type="email"
                    value={newContact.email}
                    onChange={(e) => {
                      setNewContact({ ...newContact, email: e.target.value });
                      setErrors({ ...errors, email: '' });
                    }}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Phone (optional)"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="flex-1"
                  />
                  <Button onClick={addDecisionMaker}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {decisionMakers.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              At least one decision maker is required to approve deliverables
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      {/* Approval SLA Setting */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Approval Settings</h3>
          <p className="text-sm text-gray-500 mt-1">
            How long clients have to review and approve deliverables
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Label htmlFor="sla" className="whitespace-nowrap">
            Approval SLA:
          </Label>
          <Select
            value={projectData.approvalSLA?.toString() || '3'}
            onValueChange={(value) => updateProjectData({ approvalSLA: parseInt(value) })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 business day</SelectItem>
              <SelectItem value="2">2 business days</SelectItem>
              <SelectItem value="3">3 business days</SelectItem>
              <SelectItem value="5">5 business days</SelectItem>
              <SelectItem value="7">7 business days</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Clock className="w-3 h-3" />
            <span>Auto-escalates if no response</span>
          </div>
        </div>
      </div>
      
      {/* Additional Client Contacts (Optional) */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            Additional Contacts
            <span className="text-gray-400 text-sm ml-2">(Optional)</span>
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Other client team members who should receive updates
          </p>
        </div>
        
        {/* Client Contacts List */}
        {clientContacts.length > 0 && (
          <div className="space-y-2">
            {clientContacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-sm">{contact.name}</span>
                      <span className="text-sm text-gray-500 ml-2">{contact.email}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeClientContact(contact.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Add Contact Form (simplified for optional contacts) */}
        <Card>
          <CardContent className="p-3">
            <div className="flex gap-2">
              <Input
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="flex-1"
              />
              <Button 
                variant="outline" 
                onClick={addClientContact}
                disabled={!newContact.name || !newContact.email}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}