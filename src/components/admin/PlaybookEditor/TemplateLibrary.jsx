import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical,
  Edit2,
  Copy,
  Download,
  Trash2,
  FileText,
  Clock,
  Users,
  Layers,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';

export default function TemplateLibrary({ 
  templates, 
  onSelect, 
  onEdit, 
  onDuplicate, 
  onDelete, 
  onExport 
}) {
  const getCategoryColor = (category) => {
    switch (category) {
      case 'Standard':
        return 'bg-blue-100 text-blue-700';
      case 'Express':
        return 'bg-green-100 text-green-700';
      case 'Specialized':
        return 'bg-purple-100 text-purple-700';
      case 'Custom':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new template.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {templates.map((template, index) => (
        <motion.div
          key={template.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1" onClick={() => onSelect(template)}>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {template.name}
                    {template.isDefault && (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(template)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(template)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(template)}>
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </DropdownMenuItem>
                    {!template.isDefault && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4" onClick={() => onSelect(template)}>
              {/* Category Badge */}
              <div className="flex items-center gap-2">
                <Badge className={getCategoryColor(template.category)}>
                  {template.category}
                </Badge>
                <Badge variant="outline">
                  v{template.version}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {template.stageCount} stages
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {template.phases?.length || 0} phases
                  </span>
                </div>
              </div>

              {/* Phases */}
              {template.phases && template.phases.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {template.phases.slice(0, 3).map((phase, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {phase}
                    </Badge>
                  ))}
                  {template.phases.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.phases.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="text-xs text-gray-500 pt-4 border-t">
              <div className="flex items-center justify-between w-full">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(template.lastModified), 'MMM dd, yyyy')}
                </span>
                <span>by {template.createdBy}</span>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}