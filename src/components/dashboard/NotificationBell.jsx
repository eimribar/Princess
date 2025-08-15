import React, { useState, useEffect, useCallback } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { Deliverable, OutOfScopeRequest } from "@/api/entities";
import { NotificationItem } from './NotificationItem';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
    const [attentionItems, setAttentionItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadAttentionItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const [deliverablesData, outOfScopeData] = await Promise.all([
                Deliverable.list(),
                OutOfScopeRequest.list()
            ]);

            const attentionDeliverables = (deliverablesData || [])
                .filter(d => d.versions?.length > 0 && d.versions[d.versions.length - 1].status === 'submitted')
                .map(d => ({ ...d, type: 'deliverable' }));

            const attentionOutOfScope = (outOfScopeData || [])
                .filter(r => r.status === 'pending_review' || r.status === 'pending_approval')
                .map(r => ({ ...r, type: 'out_of_scope' }));

            setAttentionItems([...attentionDeliverables, ...attentionOutOfScope]);
        } catch (error) {
            console.error("Error loading attention items:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAttentionItems();
    }, [loadAttentionItems]);

    const handleAction = () => {
        // Reload items after an action is taken
        loadAttentionItems();
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="relative flex-shrink-0">
                    <Bell className="w-5 h-5" />
                    {attentionItems.length > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold flex items-center justify-center rounded-full animate-pulse">
                            {attentionItems.length}
                        </div>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl rounded-xl border border-slate-200/60">
                <div className="p-4 border-b">
                    <h3 className="font-semibold text-slate-800">Notifications</h3>
                    <p className="text-sm text-slate-500">You have {attentionItems.length} items requiring attention.</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 flex justify-center">
                            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        </div>
                    ) : attentionItems.length === 0 ? (
                        <div className="text-center py-8">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-medium text-slate-700">All caught up!</p>
                            <p className="text-sm text-slate-500">No new notifications.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {attentionItems.map(item => (
                                <NotificationItem key={`${item.type}-${item.id}`} item={item} onAction={handleAction} />
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}