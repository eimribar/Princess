import React from 'react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Lock, 
  CheckCircle2, 
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  Info
} from 'lucide-react';

export default function ApprovalFinality({ 
  isApproved = false,
  isPendingApproval = false,
  approvalDate = null,
  approvedBy = null,
  onApprove = null,
  showWarning = true,
  className = ''
}) {
  // If already approved and final
  if (isApproved) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <ShieldCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-green-900 flex items-center gap-2">
                    Final Approval Granted
                    <Badge variant="success" className="ml-2">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    This deliverable has been permanently approved and cannot be modified.
                  </p>
                </div>
                
                {approvalDate && (
                  <div className="pt-2 border-t border-green-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">Approved on:</span>
                      <span className="font-medium text-green-900">
                        {new Date(approvalDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {approvedBy && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-green-600">Approved by:</span>
                        <span className="font-medium text-green-900">{approvedBy}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <Alert className="border-green-300 bg-green-100/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>No further changes possible.</strong> This approval represents 
                    the final decision and the deliverable is now locked for production use.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // If pending approval with warning
  if (isPendingApproval && showWarning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Alert className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <AlertTriangle className="h-5 w-5 text-blue-600" />
          <AlertTitle className="text-blue-900">Important: Approval is Final</AlertTitle>
          <AlertDescription className="text-blue-800 space-y-3">
            <p>
              Please review this deliverable carefully before approving. Once approved:
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>The deliverable will be <strong>permanently locked</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <FileCheck className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>No further revisions or feedback will be possible</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span>The project will proceed based on this approved version</span>
              </li>
            </ul>
            
            {onApprove && (
              <div className="pt-3 mt-3 border-t border-blue-200">
                <p className="text-sm mb-3">
                  By clicking approve, you acknowledge this is a final decision.
                </p>
                <Button 
                  onClick={onApprove}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I Understand - Approve as Final
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  // Informational state about approval process
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">About Approval Process</h4>
              <p className="text-sm text-gray-600">
                When you approve this deliverable, it will be marked as final and locked. 
                This is a one-way process designed to ensure project progress and prevent 
                scope creep.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Badge variant="outline" className="text-xs">
                  <Lock className="w-3 h-3 mr-1" />
                  Irreversible
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Audit Trail
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <FileCheck className="w-3 h-3 mr-1" />
                  Production Ready
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}