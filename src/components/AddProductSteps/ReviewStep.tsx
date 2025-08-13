import { UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Package, 
  FileText, 
  Image as ImageIcon, 
  Settings,
  DollarSign,
  Tag,
  Hash,
  BarChart3,
  AlertTriangle,
  Calendar
} from "lucide-react";

interface ReviewStepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
  formData: any;
  imagePreview: string | null;
  onSubmit: () => void;
}

export function ReviewStep({ 
  form, 
  isLoading, 
  formData, 
  imagePreview, 
  onSubmit 
}: ReviewStepProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold">Review & Create Product</h3>
        <p className="text-sm text-gray-500">
          Please review all the information before creating your product
        </p>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Product Name:</span>
              <p className="text-sm">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Category:</span>
              <p className="text-sm">{formData.category || 'Not provided'}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Price:
                </span>
                <p className="text-sm font-medium text-green-600">
                  {formatPrice(formData.price || 0)}
                </p>
              </div>
              {formData.salePrice && formData.salePrice > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Sale Price:</span>
                  <p className="text-sm font-medium text-orange-600">
                    {formatPrice(formData.salePrice)}
                  </p>
                </div>
              )}
            </div>
            {formData.tags && (
              <div>
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Tags:
                </span>
                <p className="text-sm">{formData.tags}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Image */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              Product Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            {imagePreview ? (
              <div className="space-y-2">
                <img
                  src={imagePreview}
                  alt="Product preview"
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Image uploaded
                </Badge>
              </div>
            ) : (
              <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No image uploaded</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description & Specifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Description:</span>
              <p className="text-sm mt-1 p-3 bg-gray-50 rounded border max-h-24 overflow-y-auto">
                {formData.description || 'No description provided'}
              </p>
            </div>
            {formData.specifications && (
              <div>
                <span className="text-sm font-medium text-gray-600">Specifications:</span>
                <p className="text-sm mt-1 p-3 bg-gray-50 rounded border max-h-24 overflow-y-auto">
                  {formData.specifications}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Stock Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Track Stock:</span>
              <Badge variant={formData.trackStock ? "secondary" : "outline"}>
                {formData.trackStock ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            
            {formData.trackStock && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Current Stock:
                    </span>
                    <p className="text-sm">{formData.stockQuantity || 0} units</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Min Level:
                    </span>
                    <p className="text-sm">{formData.minStockLevel || 0} units</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      Max Level:
                    </span>
                    <p className="text-sm">{formData.maxStockLevel || 0} units</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Backorders:</span>
                    <Badge variant={formData.allowBackorders ? "secondary" : "outline"} className="text-xs">
                      {formData.allowBackorders ? "Allowed" : "Not Allowed"}
                    </Badge>
                  </div>
                </div>

                {formData.restockDate && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Restock Date:
                    </span>
                    <p className="text-sm">{formatDate(formData.restockDate)}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Product Identifiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hash className="w-4 h-4" />
              Product Identifiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">SKU:</span>
              <p className="text-sm">{formData.sku || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Barcode:</span>
              <p className="text-sm">{formData.barcode || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="font-medium text-green-800">Ready to Create</span>
          </div>
          <p className="text-sm text-green-700">
            Your product is ready to be created. Once created, it will be available in your product catalog
            {formData.isVisible ? ' and visible to customers' : ' but hidden from customers until you make it visible'}.
          </p>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      <div className="mt-8 p-4 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700 font-medium">Step 5 of 5</span>
          <span className="text-green-600">
            Ready to create your product!
          </span>
        </div>
        <div className="mt-2 w-full bg-green-200 rounded-full h-2">
          <div className="bg-green-600 h-2 rounded-full w-full"></div>
        </div>
      </div>
    </div>
  );
}
