import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Palette, Layout, Eye } from "lucide-react";
import { useState } from "react";

export default function Design() {
  const [selectedTheme, setSelectedTheme] = useState("green");
  const [showPrices, setShowPrices] = useState(true);
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [viewMode, setViewMode] = useState("grid");

  const themes = [
    { id: "green", name: "Green", primary: "#22c55e", accent: "#16a34a" },
    { id: "blue", name: "Blue", primary: "#3b82f6", accent: "#2563eb" },
    { id: "purple", name: "Purple", primary: "#8b5cf6", accent: "#7c3aed" },
    { id: "orange", name: "Orange", primary: "#f97316", accent: "#ea580c" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Design</h1>
            <p className="text-muted-foreground">Customize your storefront appearance</p>
          </div>
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview Store
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hero Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Hero Banner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a hero banner image
                </p>
                <p className="text-xs text-muted-foreground">
                  Recommended: 1200x400px
                </p>
                <Button variant="outline" className="mt-4">
                  Choose Image
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-title">Hero Title</Label>
                <Input
                  id="hero-title"
                  placeholder="Welcome to our store"
                  defaultValue="Welcome to our store"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero-subtitle"
                  placeholder="Discover amazing products..."
                  defaultValue="Discover amazing products at great prices"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Theme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      selectedTheme === theme.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span className="font-medium">{theme.name}</span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-primary">Custom Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-primary"
                    type="color"
                    defaultValue="#22c55e"
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    placeholder="#22c55e"
                    defaultValue="#22c55e"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="w-5 h-5" />
                Layout Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Product View</Label>
                <Select value={viewMode} onValueChange={setViewMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Prices</Label>
                  <p className="text-sm text-muted-foreground">
                    Display product prices on the storefront
                  </p>
                </div>
                <Switch
                  checked={showPrices}
                  onCheckedChange={setShowPrices}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Descriptions</Label>
                  <p className="text-sm text-muted-foreground">
                    Display product descriptions on cards
                  </p>
                </div>
                <Switch
                  checked={showDescriptions}
                  onCheckedChange={setShowDescriptions}
                />
              </div>
            </CardContent>
          </Card>

          {/* Store Information */}
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Store Name</Label>
                <Input
                  id="store-name"
                  placeholder="My Awesome Store"
                  defaultValue="My Awesome Store"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-description">Store Description</Label>
                <Textarea
                  id="store-description"
                  placeholder="Tell customers about your business..."
                  defaultValue="We offer high-quality products at competitive prices"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-logo">Store Logo</Label>
                <div className="flex gap-2">
                  <Input
                    id="store-logo"
                    type="file"
                    accept="image/*"
                    className="flex-1"
                  />
                  <Button variant="outline">Upload</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline">Reset to Default</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
