import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Project, Stage, Deliverable } from "@/api/entities";
import { playbookData } from "./PlaybookData";
import { CheckCircle, AlertCircle, Loader2, Link2 } from "lucide-react";

// Helper function to add a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function PlaybookSeeder() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [isSeeded, setIsSeeded] = useState(false);

    useEffect(() => {
        checkIfSeeded();
    }, []);

    const checkIfSeeded = async () => {
        const stages = await Stage.list();
        if (stages.length > 0) {
            setIsSeeded(true);
            setStatus({ type: 'info', message: `${stages.length} stages already exist in the database. Seeding is disabled to prevent duplicates. Please clear the Stage data to re-seed.` });
        }
    };

    const handleSeedData = async () => {
        setIsLoading(true);
        setStatus({ type: 'info', message: 'Starting the seeding process...' });

        try {
            const projects = await Project.list();
            if (projects.length === 0) throw new Error("No project found. Please create a project first.");
            const projectId = projects[0].id;

            setStatus({ type: 'info', message: 'Creating 104 project stages...' });
            const stagesToCreate = playbookData.map(item => ({
                project_id: projectId,
                name: item.name,
                number_index: item.number_index,
                order_index: item.number_index,
                category: item.category,
                is_deliverable: item.is_deliverable,
                description: item.description || `Step ${item.number_index}: ${item.name}`,
                formal_name: item.formal_name || null,
                is_optional: false,
                status: 'not_started',
                dependencies: [],
                dependency_type: item.dependency_type || 'sequential',
                blocking_priority: item.blocking_priority || 'low',
                resource_dependency: item.resource_dependency || 'none',
                parallel_tracks: [],
            }));
            await Stage.bulkCreate(stagesToCreate);
            
            setStatus({ type: 'info', message: 'Resolving stage dependencies... This will take a few moments.' });
            const createdStages = await Stage.list();
            const numberIndexToIdMap = new Map(createdStages.map(s => [s.number_index, s.id]));

            const stagesToUpdate = createdStages.map(stage => {
                const playbookItem = playbookData.find(item => item.number_index === stage.number_index);
                if (!playbookItem) return null;

                const resolvedDependencyIds = (playbookItem.dependencies || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);
                const resolvedParallelTrackIds = (playbookItem.parallel_tracks || []).map(index => numberIndexToIdMap.get(index)).filter(Boolean);

                return {
                    id: stage.id,
                    dependencies: resolvedDependencyIds,
                    parallel_tracks: resolvedParallelTrackIds
                };
            }).filter(Boolean);

            // Process updates sequentially to avoid rate limiting
            let processedCount = 0;
            for (const updateItem of stagesToUpdate) {
                await Stage.update(updateItem.id, { 
                    dependencies: updateItem.dependencies, 
                    parallel_tracks: updateItem.parallel_tracks 
                });
                
                processedCount++;
                setStatus({
                    type: 'info',
                    message: `Linking dependencies... ${processedCount}/${stagesToUpdate.length} complete`
                });

                await delay(100); // Wait 100ms between each API call
            }
            
            setStatus({ type: 'info', message: 'Creating associated deliverables...' });
            const deliverableStages = createdStages.filter(stage => stage.is_deliverable);
            const deliverablesToCreate = deliverableStages.map(stage => ({
                project_id: projectId,
                stage_id: stage.id,
                name: stage.name,
                type: stage.category === 'research' ? 'research' : stage.category === 'strategy' ? 'strategy' : 'creative',
                include_in_brandbook: stage.category === 'brand_building' || stage.name.toLowerCase().includes('brandbook'),
                max_revisions: 2,
                status: 'not_started'
            }));
            if(deliverablesToCreate.length > 0) {
                await Deliverable.bulkCreate(deliverablesToCreate);
            }

            setStatus({ type: 'success', message: `Successfully seeded the playbook! ${stagesToCreate.length} stages and ${deliverablesToCreate.length} deliverables created with full dependency mapping.` });
            setIsSeeded(true);
        } catch (error) {
            console.error("Seeding error:", error);
            setStatus({ type: 'error', message: `${error.message}. Please try clearing Stage data and seeding again.` });
        } finally {
            setIsLoading(false);
        }
    };

    const deliverableCount = playbookData.filter(item => item.is_deliverable).length;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-slate-800 text-lg">Complete 104-Step SOW Playbook</h3>
                <p className="text-sm text-slate-600 mt-2">
                    This will seed the database with the complete Deutsch & Co. brand development process, including all stage dependencies and relationships:
                </p>
                <ul className="text-sm text-slate-600 mt-2 space-y-1 ml-4 list-disc list-inside">
                    <li><strong>104 Total Steps</strong> across 5 major phases</li>
                    <li><strong>{deliverableCount} Client Deliverables</strong></li>
                    <li><strong>Smart Dependencies:</strong> Critical path analysis and blocking logic</li>
                </ul>
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg mt-4">
                    <strong>Note:</strong> This seeding process will take about a minute. The system processes dependencies sequentially to ensure reliability. Please ensure you have cleared old stage data before running.
                </p>
            </div>

            {status.message && (
                <Alert variant={status.type === 'error' ? 'destructive' : 'default'} className={
                    status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                    status.type === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800' : ''
                }>
                    {status.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {status.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    {status.type === 'info' && <Loader2 className="h-4 w-4 animate-spin text-blue-600" />}
                    <AlertTitle>{
                        status.type === 'success' ? 'Success' :
                        status.type === 'error' ? 'Error' : 'In Progress'
                    }</AlertTitle>
                    <AlertDescription>
                        {status.message}
                    </AlertDescription>
                </Alert>
            )}

            <Button onClick={handleSeedData} disabled={isLoading || isSeeded} size="lg" className="w-full">
                {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Seeding Playbook...</>
                ) : (
                    <><Link2 className="mr-2 h-4 w-4" /> Seed Playbook with Dependencies</>
                )}
            </Button>
        </div>
    );
}