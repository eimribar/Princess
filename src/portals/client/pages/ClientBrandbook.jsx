import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Download,
  Eye,
  Share2,
  Filter,
  Search,
  Grid,
  List,
  Image as ImageIcon,
  FileText,
  Video,
  Package,
  Palette,
  Type,
  Layout,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Copy,
  Mail,
  DownloadCloud,
  Star,
  FolderOpen,
  ChevronRight,
  ZoomIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

/**
 * Premium Client Brandbook
 * 
 * Beautiful gallery of approved brand assets with download capabilities.
 * Features:
 * - Masonry grid layout
 * - Category filtering
 * - Quick preview
 * - Batch download
 * - Share functionality
 */

const ClientBrandbook = () => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);

  // Mock approved assets data
  const [assets] = useState([
    {
      id: 1,
      name: 'Primary Logo',
      category: 'logo',
      type: 'image',
      format: 'SVG',
      size: '245 KB',
      thumbnail: 'https://via.placeholder.com/400x300/4F46E5/ffffff?text=Primary+Logo',
      fullImage: 'https://via.placeholder.com/1200x900/4F46E5/ffffff?text=Primary+Logo',
      description: 'Main brand logo for all primary applications',
      files: [
        { name: 'logo-primary.svg', size: '245 KB' },
        { name: 'logo-primary.png', size: '890 KB' },
        { name: 'logo-primary.eps', size: '1.2 MB' }
      ],
      usage: 'Use on white or light backgrounds with minimum 40px height',
      approvedDate: new Date('2024-03-07'),
      tags: ['logo', 'primary', 'brand']
    },
    {
      id: 2,
      name: 'Color Palette',
      category: 'colors',
      type: 'document',
      format: 'PDF',
      size: '890 KB',
      thumbnail: 'https://via.placeholder.com/400x300/10B981/ffffff?text=Color+Palette',
      fullImage: 'https://via.placeholder.com/1200x900/10B981/ffffff?text=Color+Palette',
      description: 'Complete brand color system with primary and secondary colors',
      files: [
        { name: 'color-palette.pdf', size: '890 KB' },
        { name: 'color-swatches.ase', size: '12 KB' }
      ],
      usage: 'Refer to specific hex codes for digital and Pantone for print',
      approvedDate: new Date('2024-03-05'),
      tags: ['colors', 'palette', 'guide']
    },
    {
      id: 3,
      name: 'Typography Guide',
      category: 'typography',
      type: 'document',
      format: 'PDF',
      size: '1.5 MB',
      thumbnail: 'https://via.placeholder.com/400x300/8B5CF6/ffffff?text=Typography',
      fullImage: 'https://via.placeholder.com/1200x900/8B5CF6/ffffff?text=Typography',
      description: 'Font families, sizes, and usage guidelines',
      files: [
        { name: 'typography-guide.pdf', size: '1.5 MB' },
        { name: 'font-files.zip', size: '3.4 MB' }
      ],
      usage: 'Primary font for headlines, secondary for body text',
      approvedDate: new Date('2024-03-10'),
      tags: ['typography', 'fonts', 'guide']
    },
    {
      id: 4,
      name: 'Business Card Design',
      category: 'collateral',
      type: 'image',
      format: 'PDF',
      size: '2.1 MB',
      thumbnail: 'https://via.placeholder.com/400x300/F59E0B/ffffff?text=Business+Card',
      fullImage: 'https://via.placeholder.com/1200x900/F59E0B/ffffff?text=Business+Card',
      description: 'Professional business card template',
      files: [
        { name: 'business-card.pdf', size: '2.1 MB' },
        { name: 'business-card.ai', size: '4.5 MB' }
      ],
      usage: 'Print on premium matte cardstock, 3.5" x 2"',
      approvedDate: new Date('2024-03-12'),
      tags: ['collateral', 'print', 'business card']
    },
    {
      id: 5,
      name: 'Social Media Templates',
      category: 'digital',
      type: 'image',
      format: 'PSD',
      size: '15.3 MB',
      thumbnail: 'https://via.placeholder.com/400x300/EC4899/ffffff?text=Social+Templates',
      fullImage: 'https://via.placeholder.com/1200x900/EC4899/ffffff?text=Social+Templates',
      description: 'Templates for Instagram, Facebook, and LinkedIn',
      files: [
        { name: 'social-templates.zip', size: '15.3 MB' },
        { name: 'social-guide.pdf', size: '890 KB' }
      ],
      usage: 'Maintain consistent visual style across all social platforms',
      approvedDate: new Date('2024-03-15'),
      tags: ['digital', 'social media', 'templates']
    },
    {
      id: 6,
      name: 'Brand Guidelines',
      category: 'guidelines',
      type: 'document',
      format: 'PDF',
      size: '8.7 MB',
      thumbnail: 'https://via.placeholder.com/400x300/06B6D4/ffffff?text=Brand+Guidelines',
      fullImage: 'https://via.placeholder.com/1200x900/06B6D4/ffffff?text=Brand+Guidelines',
      description: 'Complete brand standards and usage guidelines',
      files: [
        { name: 'brand-guidelines.pdf', size: '8.7 MB' }
      ],
      usage: 'Essential reference for all brand applications',
      approvedDate: new Date('2024-03-18'),
      tags: ['guidelines', 'standards', 'brand book']
    }
  ]);

  // Categories configuration
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
                          asset.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle asset selection for batch download
  const toggleAssetSelection = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  // Handle batch download
  const handleBatchDownload = () => {
    if (selectedAssets.length === 0) {
      toast({
        title: "No assets selected",
        description: "Please select assets to download",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Download started",
      description: `Downloading ${selectedAssets.length} asset${selectedAssets.length > 1 ? 's' : ''}...`,
      className: "bg-green-50 border-green-200"
    });
    setSelectedAssets([]);
  };

  // Copy share link
  const copyShareLink = () => {
    const link = `${window.location.origin}/public/brandbook/project-123`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard",
      duration: 2000
    });
  };

  // Asset card component
  const AssetCard = ({ asset }) => {
    const isSelected = selectedAssets.includes(asset.id);

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -4 }}
        className="group relative"
      >
        <Card className={cn(
          "overflow-hidden hover:shadow-xl transition-all duration-300",
          isSelected && "ring-2 ring-blue-500"
        )}>
          {/* Selection Checkbox */}
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleAssetSelection(asset.id);
              }}
              className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                isSelected 
                  ? "bg-blue-500 border-blue-500" 
                  : "bg-white/90 border-gray-300 hover:border-blue-500"
              )}
            >
              {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
            </button>
          </div>

          {/* Thumbnail */}
          <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            <img
              src={asset.thumbnail}
              alt={asset.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            
            {/* Overlay Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                  <Eye className="w-4 h-4 mr-1" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1 bg-white/90 backdrop-blur-sm"
                  onClick={() => {
                    toast({
                      title: "Download started",
                      description: `Downloading ${asset.name}...`
                    });
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {/* Format Badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-gray-900 backdrop-blur-sm">
                {asset.format}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1">
              {asset.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {asset.description}
            </p>

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3" />
                {asset.files.length} files
              </span>
              <span>{asset.size}</span>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-3">
              {asset.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {asset.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{asset.tags.length - 2}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Brand Assets
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Final Approved
                  </Badge>
                </h1>
                <p className="mt-2 text-gray-600">Download your approved brand assets and guidelines</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {selectedAssets.length > 0 && (
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                    onClick={handleBatchDownload}
                  >
                    <DownloadCloud className="w-4 h-4 mr-2" />
                    Download Selected ({selectedAssets.length})
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
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
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => {
                      const Icon = category.icon;
                      return (
                        <SelectItem key={category.value} value={category.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <span>{category.label}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

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
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Pills */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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

        {/* Assets Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredAssets.map(asset => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredAssets.map(asset => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-6">
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-24 h-24 object-cover rounded-lg"
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
                          <Button
                            onClick={() => {
                              toast({
                                title: "Download started",
                                description: `Downloading ${asset.name}...`
                              });
                            }}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
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
                    Full Size
                  </Button>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{selectedAsset.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Usage Guidelines</h4>
                    <p className="text-gray-600">{selectedAsset.usage}</p>
                  </div>
                </div>

                {/* Files */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Available Files</h4>
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
                            <p className="text-xs text-gray-500">{file.size}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "Download started",
                              description: `Downloading ${file.name}...`
                            });
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download All Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                  onClick={() => {
                    toast({
                      title: "Download started",
                      description: `Downloading all files for ${selectedAsset.name}...`
                    });
                    setShowPreview(false);
                  }}
                >
                  <DownloadCloud className="w-4 h-4 mr-2" />
                  Download All Files
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Brand Assets
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Public Link</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={`${window.location.origin}/public/brandbook/project-123`}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" onClick={copyShareLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Anyone with this link can view and download brand assets
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  const subject = "Brand Assets - TechCorp";
                  const body = `View our brand assets: ${window.location.origin}/public/brandbook/project-123`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.open(`${window.location.origin}/public/brandbook/project-123`, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Public Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientBrandbook;