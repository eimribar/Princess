import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";
import { differenceInDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NotificationBell from "@/components/notifications/NotificationBell";
import ProjectSelector from "./ProjectSelector";
import SlackIcon from "../icons/SlackIcon";
import GoogleDriveIcon from "../icons/GoogleDriveIcon";
import { useUser } from '@/contexts/SupabaseUserContext';

export default function ProjectHeader({ project, onOpenOutOfScopeForm }) {
  const { user } = useUser();
  const milestoneDays = project?.milestone_date
    ? differenceInDays(new Date(project.milestone_date), new Date())
    : 84;

  return (
    <div>
        {user?.role !== 'client' && (
            <div className="mb-4">
                <ProjectSelector />
            </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{project?.name || "Loading..."}</h1>
                <p className="text-gray-600 mt-2">
                    {milestoneDays > 0 ? `${milestoneDays} Days Until ${project?.milestone_name || 'Going out of stealth'}` : `Milestone Reached: ${project?.milestone_name || 'Going out of stealth'}`}
                </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 items-center">
                <NotificationBell />
                <Button variant="outline" asChild>
                  <a href="https://slack.com/app_redirect?channel=C123456789" target="_blank" rel="noopener noreferrer">
                    <SlackIcon className="w-4 h-4 mr-2" />
                    Slack
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://drive.google.com/drive/folders/your-project-folder-id" target="_blank" rel="noopener noreferrer">
                    <GoogleDriveIcon className="w-4 h-4 mr-2" />
                    Drive
                  </a>
                </Button>
                <Button variant="outline" onClick={onOpenOutOfScopeForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Out of Scope
                </Button>
                <Button variant="outline" asChild>
                  <Link to={createPageUrl('Timeline')}>Timeline View</Link>
                </Button>
            </div>
        </div>
    </div>
  );
}