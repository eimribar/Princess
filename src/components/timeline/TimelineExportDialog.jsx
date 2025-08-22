import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileImage, 
  FileText, 
  FileSpreadsheet,
  Calendar,
  Users,
  Loader2
} from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

export default function TimelineExportDialog({ 
  open, 
  onOpenChange, 
  stages, 
  teamMembers, 
  chartRef 
}) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [filename, setFilename] = useState('project-timeline');
  const [dateRange, setDateRange] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      value: 'pdf',
      label: 'PDF Document',
      description: 'High-quality PDF with metadata',
      icon: FileText,
      color: 'text-red-600'
    },
    {
      value: 'png',
      label: 'PNG Image',
      description: 'High-resolution timeline image',
      icon: FileImage,
      color: 'text-blue-600'
    },
    {
      value: 'csv',
      label: 'CSV Data',
      description: 'Stage data for spreadsheets',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    },
    {
      value: 'excel',
      label: 'Excel Workbook',
      description: 'Formatted Excel file with charts',
      icon: FileSpreadsheet,
      color: 'text-emerald-600'
    }
  ];

  const exportToPDF = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      // Add metadata if requested
      if (includeMetadata) {
        pdf.setFontSize(16);
        pdf.text('Project Timeline Report', 20, 20);
        pdf.setFontSize(10);
        pdf.text(`Generated: ${format(new Date(), 'MMMM d, yyyy')}`, 20, 30);
        pdf.text(`Total Stages: ${stages.length}`, 20, 35);
        pdf.text(`Team Members: ${teamMembers.length}`, 20, 40);
        
        const completedStages = stages.filter(s => s.status === 'completed').length;
        const completionRate = Math.round((completedStages / stages.length) * 100);
        pdf.text(`Completion Rate: ${completionRate}%`, 20, 45);
      }

      // Add the timeline image
      const startY = includeMetadata ? 55 : 20;
      const imgWidth = 250; // max width for A4 landscape
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 20, startY, imgWidth, imgHeight);

      // Add legend if requested
      if (includeLegend) {
        const legendY = startY + imgHeight + 10;
        pdf.setFontSize(12);
        pdf.text('Status Legend:', 20, legendY);
        pdf.setFontSize(8);
        
        const legends = [
          { color: [34, 197, 94], text: 'Completed' },
          { color: [59, 130, 246], text: 'In Progress' },
          { color: [239, 68, 68], text: 'Blocked' },
          { color: [156, 163, 175], text: 'Not Started' }
        ];

        legends.forEach((legend, index) => {
          const y = legendY + 8 + (index * 6);
          pdf.setFillColor(legend.color[0], legend.color[1], legend.color[2]);
          pdf.rect(20, y - 2, 3, 3, 'F');
          pdf.text(legend.text, 26, y);
        });
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      throw error;
    }
  };

  const exportToPNG = async () => {
    if (!chartRef.current) return;

    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 3, // Higher resolution for PNG
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('PNG export failed:', error);
      throw error;
    }
  };

  const exportToCSV = () => {
    try {
      const csvData = stages.map(stage => ({
        'Stage Number': stage.number_index,
        'Stage Name': stage.name,
        'Category': stage.category,
        'Status': stage.status,
        'Is Deliverable': stage.is_deliverable ? 'Yes' : 'No',
        'Start Date': stage.startDate ? format(stage.startDate, 'yyyy-MM-dd') : '',
        'End Date': stage.endDate ? format(stage.endDate, 'yyyy-MM-dd') : '',
        'Duration (Days)': stage.duration || '',
        'Assigned To': stage.assigned_to || '',
        'Dependencies': stage.dependencies ? stage.dependencies.join(', ') : '',
        'Description': stage.description || ''
      }));

      const csv = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.csv`;
      link.click();
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // Stages worksheet
      const stagesData = stages.map(stage => ({
        'Stage #': stage.number_index,
        'Name': stage.name,
        'Category': stage.category,
        'Status': stage.status,
        'Deliverable': stage.is_deliverable ? 'Yes' : 'No',
        'Start Date': stage.startDate ? format(stage.startDate, 'yyyy-MM-dd') : '',
        'End Date': stage.endDate ? format(stage.endDate, 'yyyy-MM-dd') : '',
        'Duration': stage.duration || '',
        'Assigned To': stage.assigned_to || '',
        'Dependencies': stage.dependencies ? stage.dependencies.join(', ') : ''
      }));

      const stagesSheet = XLSX.utils.json_to_sheet(stagesData);
      XLSX.utils.book_append_sheet(workbook, stagesSheet, 'Project Stages');

      // Team members worksheet
      const teamData = teamMembers.map(member => ({
        'Name': member.name,
        'Email': member.email,
        'Role': member.role,
        'Team Type': member.team_type,
        'Decision Maker': member.is_decision_maker ? 'Yes' : 'No'
      }));

      const teamSheet = XLSX.utils.json_to_sheet(teamData);
      XLSX.utils.book_append_sheet(workbook, teamSheet, 'Team Members');

      // Summary worksheet
      const completedStages = stages.filter(s => s.status === 'completed').length;
      const inProgressStages = stages.filter(s => s.status === 'in_progress').length;
      const blockedStages = stages.filter(s => s.status === 'blocked').length;
      
      const summaryData = [
        { 'Metric': 'Total Stages', 'Value': stages.length },
        { 'Metric': 'Completed Stages', 'Value': completedStages },
        { 'Metric': 'In Progress Stages', 'Value': inProgressStages },
        { 'Metric': 'Blocked Stages', 'Value': blockedStages },
        { 'Metric': 'Completion Rate', 'Value': `${Math.round((completedStages / stages.length) * 100)}%` },
        { 'Metric': 'Total Team Members', 'Value': teamMembers.length },
        { 'Metric': 'Export Date', 'Value': format(new Date(), 'yyyy-MM-dd HH:mm') }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Project Summary');

      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } catch (error) {
      console.error('Excel export failed:', error);
      throw error;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'png':
          await exportToPNG();
          break;
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          exportToExcel();
          break;
        default:
          throw new Error('Unknown export format');
      }
      
      // Close dialog after successful export
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      // You could show a toast notification here
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormat = formatOptions.find(opt => opt.value === exportFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Timeline
          </DialogTitle>
          <DialogDescription>
            Choose your preferred format and options for exporting the project timeline.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              {formatOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <label 
                    htmlFor={option.value} 
                    className="flex items-center gap-3 cursor-pointer flex-1 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <option.icon className={`w-5 h-5 ${option.color}`} />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-slate-600">{option.description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Filename */}
          <div className="space-y-2">
            <Label htmlFor="filename">Filename</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="project-timeline"
            />
          </div>

          {/* Options for visual formats */}
          {(exportFormat === 'pdf' || exportFormat === 'png') && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Export Options</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="metadata"
                  checked={includeMetadata}
                  onCheckedChange={setIncludeMetadata}
                />
                <label htmlFor="metadata" className="text-sm font-medium">
                  Include project metadata
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="legend"
                  checked={includeLegend}
                  onCheckedChange={setIncludeLegend}
                />
                <label htmlFor="legend" className="text-sm font-medium">
                  Include status legend
                </label>
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="font-medium text-slate-900">Export Preview</div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {stages.length} stages
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {teamMembers.length} team members
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {selectedFormat?.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {format(new Date(), 'MMM d, yyyy')}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || !filename.trim()}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {selectedFormat?.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}