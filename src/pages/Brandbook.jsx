import React, { useState, useEffect } from "react";
import { Deliverable, Project } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ExternalLink, 
  BookOpen,
  Palette,
  FileImage,
  Share2,
  Eye,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Brandbook() {
  const [project, setProject] = useState(null);
  const [brandbookDeliverables, setBrandbookDeliverables] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBrandbookData();
  }, []);

  const loadBrandbookData = async () => {
    setIsLoading(true);
    try {
      const [projectData, allDeliverables] = await Promise.all([
        Project.list().then(projects => projects[0]),
        Deliverable.filter({ include_in_brandbook: true, status: 'completed' }, '-created_date')
      ]);
      
      setProject(projectData);
      setBrandbookDeliverables(allDeliverables || []);
    } catch (error) {
      console.error("Error loading brandbook data:", error);
    }
    setIsLoading(false);
  };

  const categories = [
    { id: "all", name: "All Assets", color: "from-slate-600 to-slate-700", icon: FileImage },
    { id: "research", name: "Research", color: "from-purple-600 to-indigo-700", icon: BookOpen },
    { id: "strategy", name: "Strategy", color: "from-blue-600 to-cyan-700", icon: Sparkles },
    { id: "creative", name: "Creative", color: "from-pink-600 to-rose-700", icon: Palette }
  ];

  const filteredDeliverables = selectedCategory === "all" 
    ? brandbookDeliverables 
    : brandbookDeliverables.filter(d => d.type === selectedCategory);

  const groupedDeliverables = filteredDeliverables.reduce((acc, deliverable) => {
    if (!acc[deliverable.type]) {
      acc[deliverable.type] = [];
    }
    acc[deliverable.type].push(deliverable);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="relative">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative max-w-7xl mx-auto px-8 py-16">
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-white/5 rounded-3xl backdrop-blur border border-white/10"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-white/5 rounded-3xl backdrop-blur border border-white/10"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative">
        {/* Hero Section */}
        <div className="px-8 py-16">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl">
                    <BookOpen className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                  {project?.name || "Princess"} Brandbook
                </h1>
                <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
                  Your complete brand identity system — meticulously crafted, thoroughly approved, ready to conquer the world
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 mt-12">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-full px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">{brandbookDeliverables.length} Final Assets</span>
                  </div>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur border border-white/20 rounded-full px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-white font-semibold">Production Ready</span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-r ${category.color} text-white shadow-2xl` 
                        : 'bg-white/5 backdrop-blur text-gray-300 border border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      {category.name}
                      {category.id !== "all" && (
                        <span className={`
                          ml-2 px-2 py-1 rounded-full text-xs font-bold
                          ${isActive ? 'bg-white/20' : 'bg-white/10'}
                        `}>
                          {brandbookDeliverables.filter(d => d.type === category.id).length}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Assets Grid */}
        <div className="px-8 pb-16">
          <div className="max-w-7xl mx-auto">
            {brandbookDeliverables.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24"
              >
                <div className="w-32 h-32 bg-gradient-to-r from-slate-700 to-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                  <BookOpen className="w-16 h-16 text-gray-300" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-4">Brandbook Under Construction</h3>
                <p className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed">
                  Your approved creative assets will appear here as they're completed. 
                  Each piece will be production-ready and aligned with your brand strategy.
                </p>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  {Object.entries(groupedDeliverables).map(([type, deliverables], typeIndex) => {
                    const category = categories.find(c => c.id === type);
                    const Icon = category?.icon || FileImage;
                    
                    return (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: typeIndex * 0.1 }}
                        className="mb-16"
                      >
                        <div className="flex items-center gap-6 mb-8">
                          <div className={`w-16 h-16 bg-gradient-to-r ${category?.color || 'from-gray-600 to-gray-700'} rounded-2xl flex items-center justify-center shadow-xl`}>
                            <Icon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h2 className="text-3xl font-bold text-white capitalize mb-2">
                              {type} Collection
                            </h2>
                            <p className="text-gray-400 text-lg">
                              {deliverables.length} premium asset{deliverables.length !== 1 ? 's' : ''} ready for production
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {deliverables.map((deliverable, index) => (
                            <motion.div
                              key={deliverable.id}
                              initial={{ opacity: 0, y: 20, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ delay: typeIndex * 0.1 + index * 0.05 }}
                              whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            >
                              <Card className="group bg-white/5 backdrop-blur border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden h-full">
                                <div className={`bg-gradient-to-r ${category?.color || 'from-gray-600 to-gray-700'} p-6 relative overflow-hidden`}>
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                                  <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-4">
                                      <Icon className="w-8 h-8 text-white" />
                                      <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold">
                                        ✓ Final
                                      </Badge>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                                      {deliverable.name}
                                    </h3>
                                    <p className="text-white/80 text-sm">
                                      Version {deliverable.current_version || '1.0'} • Production Ready
                                    </p>
                                  </div>
                                </div>
                                
                                <CardContent className="p-6 bg-white/5 backdrop-blur flex-1 flex flex-col">
                                  <div className="flex-1 space-y-4">
                                    <p className="text-gray-300 text-sm leading-relaxed">
                                      Finalized creative asset, approved and ready for immediate use across all brand applications.
                                    </p>
                                    
                                    {deliverable.due_date && (
                                      <div className="flex items-center gap-2 text-gray-400 text-xs">
                                        <Calendar className="w-3 h-3" />
                                        <span>Completed {format(new Date(deliverable.due_date), 'MMM d, yyyy')}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-3 mt-6">
                                    {deliverable.file_url && (
                                      <Button 
                                        size="sm" 
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/20 font-semibold" 
                                        asChild
                                      >
                                        <a href={deliverable.file_url} target="_blank" rel="noopener noreferrer">
                                          <Download className="w-4 h-4 mr-2" />
                                          Download
                                        </a>
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="border-white/20 text-gray-300 hover:bg-white/10 hover:text-white" 
                                      asChild
                                    >
                                      <a href={deliverable.file_url} target="_blank" rel="noopener noreferrer">
                                        <Eye className="w-4 h-4" />
                                      </a>
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Call to Action */}
        {brandbookDeliverables.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="px-8 pb-16"
          >
            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-3xl p-12">
                <h3 className="text-3xl font-bold text-white mb-4">Ready to Launch?</h3>
                <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                  Your complete brand identity system is now ready. Share it with your team, 
                  stakeholders, or use it to brief external partners.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-2xl font-semibold px-8 py-4"
                  >
                    <Share2 className="w-5 h-5 mr-3" />
                    Share Brandbook
                    <ArrowRight className="w-5 h-5 ml-3" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-4"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Download All Assets
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}