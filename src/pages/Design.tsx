import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Palette, Eye, Store, Brush, Settings, ExternalLink, Upload, Image } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { ImageStorage } from "@/lib/imageStorage";
import { toast } from "sonner";
import { useState } from "react";

export default function Design() {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    return await ImageStorage.smartUpload(file, folder);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    try {
      setLogoUploading(true);
      const logoUrl = await uploadImage(file, 'logos');
      updateSettings({ logoUrl });
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setLogoUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleHeroUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB for hero images)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB");
      return;
    }

    try {
      setHeroUploading(true);
      const heroUrl = await uploadImage(file, 'hero-images');
      updateSettings({ coverImageUrl: heroUrl });
      toast.success("Hero image uploaded successfully!");
    } catch (error) {
      console.error("Error uploading hero image:", error);
      toast.error("Failed to upload hero image");
    } finally {
      setHeroUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handlePreviewStorefront = () => {
    if (user?.uid) {
      // Open storefront in new tab with correct customer view URL
      window.open(`/store/${user.uid}`, '_blank');
    } else {
      toast.error("Please make sure you're logged in and your account is properly set up");
      console.warn('⚠️ User or user.uid is undefined, cannot generate storefront URL');
    }
  };

  const themes = [
    { 
      id: "modern", 
      name: "Modern & Clean", 
      description: "Clean lines and minimal design",
      preview: "#059669"
    },
    { 
      id: "elegant", 
      name: "Elegant & Minimal", 
      description: "Sophisticated and refined",
      preview: "#6366f1"
    },
    { 
      id: "vibrant", 
      name: "Vibrant & Colorful", 
      description: "Bold colors and dynamic layout",
      preview: "#f59e0b"
    },
    { 
      id: "classic", 
      name: "Classic & Professional", 
      description: "Traditional and trustworthy",
      preview: "#1f2937"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Store className="w-8 h-8 text-primary" />
              Customize Your Store
            </h1>
            <p className="text-muted-foreground mt-1">
              Design your storefront to match your brand and attract customers
            </p>
          </div>
          <Button 
            onClick={handlePreviewStorefront}
            className="w-full sm:w-auto"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Live Store
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Theme & Branding */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Store Theme</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {themes.map((theme) => (
                    <div
                      key={theme.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        settings.storeTheme === theme.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => updateSettings({ storeTheme: theme.id })}
                    >
                      <div 
                        className="w-full h-12 rounded mb-3"
                        style={{ backgroundColor: theme.preview }}
                      />
                      <h4 className="font-medium text-sm">{theme.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color" className="text-base font-medium">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary-color"
                      type="color"
                      value={settings.primaryColor || "#059669"}
                      onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                      className="w-16 h-12 p-1 border rounded"
                    />
                    <Input
                      type="text"
                      value={settings.primaryColor || "#059669"}
                      onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                      placeholder="#059669"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This color will be used for buttons, links, and highlights
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Store Identity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brush className="w-5 h-5" />
                Store Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url" className="text-base font-medium">Logo</Label>
                <div className="space-y-3">
                  {/* URL Input */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Option 1: Use URL</Label>
                    <Input
                      id="logo-url"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={settings.logoUrl || ""}
                      onChange={(e) => updateSettings({ logoUrl: e.target.value })}
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Option 2: Upload Image</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={logoUploading}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={logoUploading}
                        >
                          {logoUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Logo
                            </>
                          )}
                        </Button>
                      </div>
                      {settings.logoUrl && (
                        <div className="w-12 h-12 border rounded overflow-hidden">
                          <img 
                            src={settings.logoUrl} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, 200x200px or larger. Max 5MB.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover-image" className="text-base font-medium">Hero Banner Image</Label>
                <div className="space-y-3">
                  {/* URL Input */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Option 1: Use URL</Label>
                    <Input
                      id="cover-image"
                      type="url"
                      placeholder="https://example.com/hero-image.jpg"
                      value={settings.coverImageUrl || ""}
                      onChange={(e) => updateSettings({ coverImageUrl: e.target.value })}
                    />
                  </div>
                  
                  {/* File Upload */}
                  <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Option 2: Upload Image</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleHeroUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={heroUploading}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={heroUploading}
                        >
                          {heroUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Image className="w-4 h-4 mr-2" />
                              Choose Hero Image
                            </>
                          )}
                        </Button>
                      </div>
                      {settings.coverImageUrl && (
                        <div className="w-20 h-12 border rounded overflow-hidden">
                          <img 
                            src={settings.coverImageUrl} 
                            alt="Hero preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: Wide image, 1200x400px or larger. Max 10MB.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-description" className="text-base font-medium">Store Description</Label>
                <Textarea
                  id="store-description"
                  placeholder="Tell customers about your business..."
                  rows={4}
                  value={settings.storeDescription || ""}
                  onChange={(e) => updateSettings({ storeDescription: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This will appear on your storefront homepage
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Display Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Display Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Show Business Info</Label>
                  <p className="text-sm text-muted-foreground">
                    Display contact details on storefront
                  </p>
                </div>
                <Switch 
                  checked={settings.showBusinessInfo ?? true} 
                  onCheckedChange={(checked) => updateSettings({ showBusinessInfo: checked })}
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Show Social Proof</Label>
                  <p className="text-sm text-muted-foreground">
                    Display customer reviews and ratings
                  </p>
                </div>
                <Switch 
                  checked={settings.showSocialProof ?? false} 
                  onCheckedChange={(checked) => updateSettings({ showSocialProof: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold mb-2">Ready to see your store in action?</h3>
                <p className="text-muted-foreground mb-4">
                  Preview your customized storefront to see how customers will experience your brand
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    size="lg"
                    onClick={handlePreviewStorefront}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Your Store
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => {
                      toast.success("Settings saved! Your changes are now live.");
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
