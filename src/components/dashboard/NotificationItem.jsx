import React, { useState } from 'react';
import { Deliverable, OutOfScopeRequest, Comment } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, Check, X, Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export function NotificationItem({ item, onAction }) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleApprove = async (e) => {
        e.stopPropagation();
        setIsProcessing(true);
        try {
            const latestVersionIndex = item.versions.length - 1;
            const updatedVersions = [...item.versions];
            updatedVersions[latestVersionIndex].status = 'approved';

            await Deliverable.update(item.id, {
                status: 'completed',
                versions: updatedVersions,
            });

            await Comment.create({
                deliverable_id: item.id,
                project_id: item.project_id,
                content: `Version "${item.versions[latestVersionIndex].version_name}" was approved.`,
                author_name: "System",
                author_email: "system@deutschco.com",
                log_type: "approval"
            });
            
            toast({ title: "Approved!", description: `${item.name} has been marked as complete.`, className: "bg-green-500 text-white" });
            onAction();
        } catch (error) {
            console.error("Failed to approve:", error);
            toast({ title: "Error", description: "Could not approve the deliverable.", variant: "destructive" });
        }
        setIsProcessing(false);
    };

    const handleDecline = (e) => {
        e.stopPropagation();
        navigate(createPageUrl(`DeliverableDetail?id=${item.id}`));
    };

    const handleOutOfScopeClick = () => {
        navigate(createPageUrl('OutofScope'));
    }
    
    const Icon = item.type === 'deliverable' ? FileText : AlertTriangle;
    const title = item.type === 'deliverable' ? item.name : item.title;
    const date = item.versions?.[item.versions.length - 1]?.submission_date || item.created_date;

    return (
        <div className="p-4 hover:bg-slate-50 transition-colors">
            <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-sm text-slate-800 font-medium">{title}</p>
                    <p className="text-xs text-slate-500">
                        {item.type === 'deliverable' ? 'Deliverable needs review' : 'Out of scope request'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(date), { addSuffix: true })}</p>
                </div>
            </div>
            {item.type === 'deliverable' && (
                <div className="mt-3 flex gap-2">
                    <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-8" onClick={handleApprove} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" />Approve</>}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={handleDecline}>
                        <X className="w-4 h-4 mr-2" />
                        Decline
                    </Button>
                </div>
            )}
             {item.type === 'out_of_scope' && (
                <div className="mt-3">
                    <Button size="sm" variant="outline" className="w-full" onClick={handleOutOfScopeClick}>
                        <Eye className="w-4 h-4 mr-2" />
                        Review Request
                    </Button>
                </div>
            )}
        </div>
    );
}