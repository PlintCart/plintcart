import { UseFormReturn } from "react-hook-form";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Image as ImageIcon, Upload, X, Camera } from "lucide-react";

interface ImageStepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File | null, preview: string | null) => void;
}

export function ImageStep({ 
  form, 
  isLoading, 
  imageFile, 
  imagePreview, 
  onImageSelect 
}: ImageStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image file is too large. Please choose an image smaller than 2MB.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        onImageSelect(file, preview);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    onImageSelect(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
          <ImageIcon className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold">Product Image</h3>
        <p className="text-sm text-gray-500">
          Add a high-quality image to showcase your product
        </p>
      </div>

      {/* Image Upload/Preview */}
      {imagePreview ? (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product Image Preview</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full max-w-md mx-auto rounded-lg shadow-sm border"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{imageFile?.name}</span>
                <span>{imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : ''}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleUploadClick}
                disabled={isLoading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Different Image
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <div className="space-y-4 text-center">
              <Button
                type="button"
                onClick={handleUploadClick}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
              </Button>
              <div className="text-xs text-gray-400 space-y-1">
                <p>Supported formats: JPG, PNG, GIF</p>
                <p>Maximum file size: 2MB</p>
                <p>Recommended dimensions: 600x600px or larger</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />

      {/* Image Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Image Guidelines
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use a clean, uncluttered background</li>
          <li>• Show the product from the best angle</li>
          <li>• Ensure good lighting and sharp focus</li>
          <li>• Include the product's key features</li>
          <li>• Avoid watermarks or text overlays</li>
        </ul>
      </div>

      {/* Optional Notice */}
      <div className="text-center">
        <Badge variant="secondary" className="text-xs">
          <ImageIcon className="w-3 h-3 mr-1" />
          Image is optional but highly recommended
        </Badge>
        <p className="text-xs text-gray-500 mt-2">
          Products with images get significantly more views and sales
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="mt-8 p-4 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-purple-700 font-medium">Step 3 of 5</span>
          <span className="text-purple-600">
            Next: Stock & Inventory Settings
          </span>
        </div>
        <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
          <div className="bg-purple-600 h-2 rounded-full w-3/5"></div>
        </div>
      </div>
    </div>
  );
}
