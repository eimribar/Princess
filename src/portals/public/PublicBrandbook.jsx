import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  Eye,
  Share2,
  Search,
  Grid,
  List,
  Image as ImageIcon,
  FileText,
  Package,
  Palette,
  Type,
  Layout,
  Sparkles,
  ExternalLink,
  Copy,
  Mail,
  DownloadCloud,
  FolderOpen,
  ZoomIn,
  Award,
  Building,
  Globe,
  ChevronRight,
  Star,
  Heart,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Public Brandbook Page
 * 
 * A beautiful, public-facing gallery of brand assets that requires no authentication.
 * Perfect for sharing with external stakeholders, vendors, or partners.
 * 
 * Features:
 * - No login required
 * - Beautiful gallery layout
 * - Download capabilities
 * - Professional presentation
 * - Mobile responsive
 */

const PublicBrandbook = () => {
  const { projectId } = useParams();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [projectInfo, setProjectInfo] = useState(null);

  // Mock project data - in production this would come from your API
  useEffect(() => {
    // Simulate loading project data
    setTimeout(() => {
      setProjectInfo({
        id: projectId,
        name: 'TechCorp Brand Transformation',
        client: 'TechCorp Industries',
        agency: 'Deutsch & Co.',
        completedDate: new Date('2024-03-20'),
        description: 'A comprehensive brand transformation that reimagines TechCorp\'s visual identity for the digital age.',
        tagline: 'Innovation Meets Excellence'
      });
      setIsLoading(false);
    }, 1000);
  }, [projectId]);

  // Mock assets data
  const assets = [
    {
      id: 1,
      name: 'Primary Logo Suite',
      category: 'logo',
      type: 'image',
      format: 'Multiple Formats',
      size: '3.2 MB',
      thumbnail: 'https://via.placeholder.com/600x400/4F46E5/ffffff?text=Logo+Suite',
      fullImage: 'https://via.placeholder.com/1920x1080/4F46E5/ffffff?text=Logo+Suite+Full',
      description: 'Complete logo package including primary, secondary, and icon variations',
      files: [
        { name: 'logo-primary.svg', size: '245 KB', format: 'SVG' },
        { name: 'logo-primary.png', size: '890 KB', format: 'PNG' },
        { name: 'logo-primary.eps', size: '1.2 MB', format: 'EPS' },
        { name: 'logo-icon.svg', size: '85 KB', format: 'SVG' }
      ],
      featured: true
    },
    {
      id: 2,
      name: 'Brand Color System',
      category: 'colors',
      type: 'document',
      format: 'PDF + ASE',
      size: '1.8 MB',
      thumbnail: 'https://via.placeholder.com/600x400/10B981/ffffff?text=Color+System',
      fullImage: 'https://via.placeholder.com/1920x1080/10B981/ffffff?text=Color+System+Full',
      description: 'Comprehensive color palette with primary, secondary, and accent colors',
      files: [
        { name: 'color-guide.pdf', size: '1.5 MB', format: 'PDF' },
        { name: 'colors.ase', size: '12 KB', format: 'ASE' },
        { name: 'color-codes.txt', size: '2 KB', format: 'TXT' }
      ],
      featured: true
    },
    {
      id: 3,
      name: 'Typography Guidelines',
      category: 'typography',
      type: 'document',
      format: 'PDF',
      size: '4.5 MB',
      thumbnail: 'https://via.placeholder.com/600x400/8B5CF6/ffffff?text=Typography',
      fullImage: 'https://via.placeholder.com/1920x1080/8B5CF6/ffffff?text=Typography+Full',
      description: 'Complete typography system with font families and usage guidelines',
      files: [
        { name: 'typography-guide.pdf', size: '2.1 MB', format: 'PDF' },
        { name: 'font-licenses.pdf', size: '450 KB', format: 'PDF' },
        { name: 'web-fonts.zip', size: '2 MB', format: 'ZIP' }
      ],
      featured: false
    },
    {
      id: 4,
      name: 'Business Card Templates',
      category: 'collateral',
      type: 'template',
      format: 'AI + PDF',
      size: '6.3 MB',
      thumbnail: 'https://via.placeholder.com/600x400/F59E0B/ffffff?text=Business+Cards',
      fullImage: 'https://via.placeholder.com/1920x1080/F59E0B/ffffff?text=Business+Cards+Full',
      description: 'Professional business card designs with print specifications',
      files: [
        { name: 'business-cards.ai', size: '4.5 MB', format: 'AI' },
        { name: 'business-cards.pdf', size: '1.8 MB', format: 'PDF' }
      ],
      featured: false
    },
    {
      id: 5,
      name: 'Social Media Kit',
      category: 'digital',
      type: 'template',
      format: 'PSD + PNG',
      size: '28.7 MB',
      thumbnail: 'https://via.placeholder.com/600x400/EC4899/ffffff?text=Social+Kit',
      fullImage: 'https://via.placeholder.com/1920x1080/EC4899/ffffff?text=Social+Kit+Full',
      description: 'Complete social media template package for all major platforms',
      files: [
        { name: 'social-templates.zip', size: '25 MB', format: 'ZIP' },
        { name: 'social-guide.pdf', size: '3.7 MB', format: 'PDF' }
      ],
      featured: true
    },
    {
      id: 6,
      name: 'Brand Guidelines',
      category: 'guidelines',
      type: 'document',
      format: 'PDF',
      size: '12.4 MB',
      thumbnail: 'https://via.placeholder.com/600x400/06B6D4/ffffff?text=Guidelines',
      fullImage: 'https://via.placeholder.com/1920x1080/06B6D4/ffffff?text=Guidelines+Full',
      description: 'Complete brand standards manual with usage guidelines and examples',
      files: [
        { name: 'brand-guidelines-full.pdf', size: '12.4 MB', format: 'PDF' }
      ],
      featured: true
    }
  ];

  // Categories
  const categories = [
    { value: 'all', label: 'All Assets', icon: Grid, count: assets.length },
    { value: 'logo', label: 'Logos', icon: ImageIcon, count: assets.filter(a => a.category === 'logo').length },
    { value: 'colors', label: 'Colors', icon: Palette, count: assets.filter(a => a.category === 'colors').length },
    { value: 'typography', label: 'Typography', icon: Type, count: assets.filter(a => a.category === 'typography').length },
    { value: 'collateral', label: 'Collateral', icon: FileText, count: assets.filter(a => a.category === 'collateral').length },
    { value: 'digital', label: 'Digital', icon: Layout, count: assets.filter(a => a.category === 'digital').length },
    { value: 'guidelines', label: 'Guidelines', icon: Package, count: assets.filter(a => a.category === 'guidelines').length }
  ];

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Featured assets
  const featuredAssets = assets.filter(a => a.featured);

  // Copy share link
  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = 'Link copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Download asset
  const downloadAsset = (asset) => {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    toast.textContent = `Downloading ${asset.name}...`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-600">Loading brand assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              <Award className="w-3 h-3 mr-1" />
              Brand Assets Collection
            </Badge>
            <h1 className="text-5xl font-bold mb-4">
              {projectInfo?.name || 'Brand Assets'}
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              {projectInfo?.tagline}
            </p>
            <p className="text-blue-200 mb-8">
              {projectInfo?.description}
            </p>
            
            {/* Client & Agency Info */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Client:</span>
                <span className="font-semibold">{projectInfo?.client}</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-200" />
                <span className="text-blue-100">Agency:</span>
                <span className="font-semibold">{projectInfo?.agency}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
                onClick={() => {
                  const element = document.getElementById('assets-section');
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Eye className="w-5 h-5 mr-2" />
                View Assets
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={copyShareLink}
              >
                <Share2 className="w-5 h-5 mr-2" />
                Share Collection
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Decorative Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-20 fill-white">
            <path d="M0,64 C360,120 720,0 1440,64 L1440,120 L0,120 Z" />
          </svg>
        </div>
      </div>

      {/* Featured Assets Section */}
      {featuredAssets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Assets</h2>
              <p className="text-gray-600">Essential brand elements for immediate use</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="group relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300"
                >
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {asset.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {asset.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {asset.format} • {asset.size}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => downloadAsset(asset)}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* All Assets Section */}
      <div id="assets-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Complete Asset Library</h2>
          <p className="text-gray-600">All brand assets available for download</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.value}
                  variant={selectedCategory === category.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category.value)}
                  className="whitespace-nowrap"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {category.label}
                  <Badge 
                    variant={selectedCategory === category.value ? 'secondary' : 'outline'} 
                    className="ml-2"
                  >
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Assets Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      
                      {/* Quick Actions Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 bg-white/90 backdrop-blur-sm"
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowPreview(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 bg-white/90 backdrop-blur-sm"
                            onClick={() => downloadAsset(asset)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Format Badge */}
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm text-xs">
                          {asset.format}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {asset.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {asset.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <FolderOpen className="w-3 h-3" />
                          {asset.files.length} files
                        </span>
                        <span>{asset.size}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6"
                >
                  <div className="flex items-center gap-6">
                    <img
                      src={asset.thumbnail}
                      alt={asset.name}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {asset.name}
                      </h3>
                      <p className="text-gray-600 mb-3">{asset.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{asset.format}</span>
                        <span>•</span>
                        <span>{asset.size}</span>
                        <span>•</span>
                        <span>{asset.files.length} files</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedAsset(asset);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                      <Button onClick={() => downloadAsset(asset)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {filteredAssets.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-semibold">Princess Brand Portal</span>
            </div>
            <p className="text-gray-400 mb-6">
              Powered by Deutsch & Co. • © 2024 All rights reserved
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={copyShareLink}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share this page
              </Button>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white"
                onClick={() => window.print()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Print assets list
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          {selectedAsset && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">
                  {selectedAsset.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Large Preview */}
                <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={selectedAsset.fullImage}
                    alt={selectedAsset.name}
                    className="w-full h-auto"
                  />
                  <Button
                    className="absolute top-3 right-3"
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(selectedAsset.fullImage, '_blank')}
                  >
                    <ZoomIn className="w-4 h-4 mr-2" />
                    View Full Size
                  </Button>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedAsset.description}</p>
                </div>

                {/* Files */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Included Files</h4>
                  <div className="space-y-2">
                    {selectedAsset.files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {file.format} • {file.size}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAsset(selectedAsset)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  size="lg"
                  onClick={() => {
                    downloadAsset(selectedAsset);
                    setShowPreview(false);
                  }}
                >
                  <DownloadCloud className="w-5 h-5 mr-2" />
                  Download All Files ({selectedAsset.size})
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBrandbook;