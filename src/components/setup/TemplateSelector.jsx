import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search,
  Clock,
  Layers,
  Star,
  TrendingUp,
  Zap,
  Target,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  BarChart3,
  Users,
  Calendar,
  Package,
  Info,
  Eye,
  Check,
  X
} from 'lucide-react';
import { useWizard } from '@/pages/ProjectSetup';
import { useToast } from '@/components/ui/use-toast';

// Template categories
const TEMPLATE_CATEGORIES = {
  ALL: 'All Templates',
  STANDARD: 'Standard',
  EXPRESS: 'Express',
  SPECIALIZED: 'Specialized',
  CUSTOM: 'Custom'
};

// Mock template data with rich details
const TEMPLATES = [
  {
    id: 'complete-brand',
    name: 'Complete Brand Development',
    category: 'STANDARD',
    description: 'Our flagship comprehensive brand development process. Perfect for new brands or complete rebrands.',
    stages: 104,
    phases: 6,
    duration: '6 months',
    deliverables: 42,
    popularity: 87,
    fitScore: 95,
    features: [
      'Full market research',
      'Complete visual identity',
      'Brand strategy development',
      'Implementation guidelines',
      'Launch campaign'
    ],
    testimonial: {
      text: "This template helped us create a cohesive brand identity in record time.",
      author: "Sarah Chen",
      company: "TechStart Inc."
    },
    icon: Award,
    gradient: 'from-blue-500 to-purple-600',
    recommended: true,
    new: false
  },
  {
    id: 'rapid-sprint',
    name: 'Rapid Brand Sprint',
    category: 'EXPRESS',
    description: 'Accelerated process for startups and time-sensitive projects. Get to market faster.',
    stages: 45,
    phases: 4,
    duration: '8 weeks',
    deliverables: 18,
    popularity: 72,
    fitScore: 78,
    features: [
      'Essential research',
      'Core identity elements',
      'Basic guidelines',
      'Quick turnaround',
      'MVP approach'
    ],
    testimonial: {
      text: "Perfect for our startup's aggressive timeline.",
      author: "Mike Johnson",
      company: "FastGrow"
    },
    icon: Zap,
    gradient: 'from-orange-500 to-red-600',
    recommended: false,
    new: true
  },
  {
    id: 'rebrand-refresh',
    name: 'Rebrand & Refresh',
    category: 'SPECIALIZED',
    description: 'Specialized template for evolving existing brands while maintaining equity.',
    stages: 72,
    phases: 5,
    duration: '4 months',
    deliverables: 28,
    popularity: 65,
    fitScore: 82,
    features: [
      'Brand audit',
      'Equity assessment',
      'Evolution strategy',
      'Migration planning',
      'Stakeholder alignment'
    ],
    testimonial: {
      text: "Helped us modernize without losing our heritage.",
      author: "Lisa Park",
      company: "Heritage Co."
    },
    icon: Target,
    gradient: 'from-green-500 to-teal-600',
    recommended: false,
    new: false
  },
  {
    id: 'digital-first',
    name: 'Digital-First Brand',
    category: 'SPECIALIZED',
    description: 'Optimized for digital-native brands and online-only businesses.',
    stages: 58,
    phases: 5,
    duration: '3 months',
    deliverables: 24,
    popularity: 58,
    fitScore: 70,
    features: [
      'Digital ecosystem design',
      'Social media strategy',
      'Web-first identity',
      'Motion design',
      'Digital guidelines'
    ],
    testimonial: {
      text: "Perfect for our e-commerce brand launch.",
      author: "Alex Kim",
      company: "ShopNext"
    },
    icon: Sparkles,
    gradient: 'from-pink-500 to-purple-600',
    recommended: false,
    new: true
  },
  {
    id: 'minimal-mvp',
    name: 'Minimal Viable Brand',
    category: 'EXPRESS',
    description: 'Ultra-lean process for MVPs and proof-of-concept projects.',
    stages: 28,
    phases: 3,
    duration: '4 weeks',
    deliverables: 10,
    popularity: 45,
    fitScore: 60,
    features: [
      'Core identity only',
      'Essential assets',
      'Basic guidelines',
      'Fast delivery',
      'Budget-friendly'
    ],
    testimonial: {
      text: "Got us to market in record time.",
      author: "Tom Davis",
      company: "QuickLaunch"
    },
    icon: Package,
    gradient: 'from-gray-500 to-gray-700',
    recommended: false,
    new: false
  },
  {
    id: 'blank-slate',
    name: 'Start from Scratch',
    category: 'CUSTOM',
    description: 'Build your own custom workflow from the ground up.',
    stages: 0,
    phases: 0,
    duration: 'Custom',
    deliverables: 0,
    popularity: 12,
    fitScore: 0,
    features: [
      'Complete flexibility',
      'Custom phases',
      'Your workflow',
      'No constraints',
      'Advanced users only'
    ],
    icon: FileText,
    gradient: 'from-slate-400 to-slate-600',
    recommended: false,
    new: false,
    isBlank: true
  }
];

export default function TemplateSelector() {
  const { projectData, updateProjectData } = useWizard();
  const { toast } = useToast();
  
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(projectData.template);
  const [showPreview, setShowPreview] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareTemplates, setCompareTemplates] = useState([]);
  
  // Filter templates
  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'ALL' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  // Sort templates by recommendation and popularity
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return b.popularity - a.popularity;
  });
  
  // Handle template selection
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    updateProjectData({ template });
    
    toast({
      title: "Template Selected",
      description: `${template.name} has been selected as your starting point.`,
    });
  };
  
  // Handle preview
  const handlePreview = (template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
  };
  
  // Handle comparison
  const handleCompare = (template) => {
    if (compareTemplates.find(t => t.id === template.id)) {
      setCompareTemplates(prev => prev.filter(t => t.id !== template.id));
    } else if (compareTemplates.length < 3) {
      setCompareTemplates(prev => [...prev, template]);
    } else {
      toast({
        title: "Comparison Limit",
        description: "You can compare up to 3 templates at once.",
        variant: "destructive"
      });
    }
  };
  
  // Calculate fit score based on project requirements
  const calculateFitScore = (template) => {
    // This would be based on actual project requirements
    return template.fitScore;
  };
  
  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search templates by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant={compareMode ? "default" : "outline"}
              onClick={() => {
                setCompareMode(!compareMode);
                setCompareTemplates([]);
              }}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare
            </Button>
          </div>
        </div>
        
        {/* Category Tabs */}
        <div className="mt-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid grid-cols-5 w-full">
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
                <TabsTrigger key={key} value={key}>
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Comparison Bar */}
      {compareMode && compareTemplates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                Comparing {compareTemplates.length} template{compareTemplates.length > 1 ? 's' : ''}
              </span>
              <div className="flex gap-2">
                {compareTemplates.map(t => (
                  <Badge key={t.id} variant="secondary">
                    {t.name}
                    <button
                      onClick={() => handleCompare(t)}
                      className="ml-2 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            {compareTemplates.length >= 2 && (
              <Button size="sm" onClick={() => setShowComparisonModal(true)}>
                View Comparison
              </Button>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedTemplates.map((template, index) => {
          const Icon = template.icon;
          const isSelected = selectedTemplate?.id === template.id;
          const isComparing = compareTemplates.find(t => t.id === template.id);
          
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className={`
                  relative overflow-hidden transition-all duration-300 cursor-pointer
                  ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}
                  ${isComparing ? 'ring-2 ring-yellow-500' : ''}
                `}
                onClick={() => !compareMode && handleSelectTemplate(template)}
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${template.gradient}`} />
                
                {/* Badges */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {template.recommended && (
                    <Badge className="bg-green-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Recommended
                    </Badge>
                  )}
                  {template.new && (
                    <Badge className="bg-blue-500 text-white">
                      New
                    </Badge>
                  )}
                  {isSelected && (
                    <Badge className="bg-blue-500 text-white">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-12 h-12 rounded-lg bg-gradient-to-br ${template.gradient}
                      flex items-center justify-center text-white
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription className="mt-3">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{template.stages} stages</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{template.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{template.deliverables} deliverables</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{template.phases} phases</span>
                    </div>
                  </div>
                  
                  {/* Fit Score */}
                  {!template.isBlank && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Fit Score</span>
                        <span className="font-medium">{calculateFitScore(template)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full bg-gradient-to-r ${template.gradient}`}
                          style={{ width: `${calculateFitScore(template)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Popularity */}
                  {!template.isBlank && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4" />
                      <span>{template.popularity}% of projects use this template</span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    {compareMode ? (
                      <Button
                        variant={isComparing ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompare(template);
                        }}
                      >
                        {isComparing ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Comparing
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Compare
                          </>
                        )}
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(template);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTemplate(template);
                          }}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            <>
                              Use Template
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Template Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          {previewTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-br ${previewTemplate.gradient}
                    flex items-center justify-center text-white
                  `}>
                    <previewTemplate.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle>{previewTemplate.name}</DialogTitle>
                    <DialogDescription>
                      {previewTemplate.description}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  {/* Key Features */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Key Features</h3>
                    <div className="space-y-2">
                      {previewTemplate.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                          <span className="text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Template Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Layers className="w-8 h-8 text-blue-500" />
                            <div>
                              <div className="text-2xl font-bold">{previewTemplate.stages}</div>
                              <div className="text-sm text-gray-600">Total Stages</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-green-500" />
                            <div>
                              <div className="text-2xl font-bold">{previewTemplate.duration}</div>
                              <div className="text-sm text-gray-600">Duration</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Package className="w-8 h-8 text-purple-500" />
                            <div>
                              <div className="text-2xl font-bold">{previewTemplate.deliverables}</div>
                              <div className="text-sm text-gray-600">Deliverables</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Users className="w-8 h-8 text-orange-500" />
                            <div>
                              <div className="text-2xl font-bold">{previewTemplate.phases}</div>
                              <div className="text-sm text-gray-600">Phases</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  {/* Testimonial */}
                  {previewTemplate.testimonial && (
                    <Card className="bg-gray-50">
                      <CardContent className="p-6">
                        <div className="flex gap-2 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                        <p className="text-gray-700 italic mb-3">
                          "{previewTemplate.testimonial.text}"
                        </p>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">{previewTemplate.testimonial.author}</span>
                          {' • '}
                          <span>{previewTemplate.testimonial.company}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowPreview(false)}
                    >
                      Close Preview
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => {
                        handleSelectTemplate(previewTemplate);
                        setShowPreview(false);
                      }}
                    >
                      Use This Template
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}