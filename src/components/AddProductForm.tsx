import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { useSettings } from "@/contexts/SettingsContext";
import { StockManagementService } from "@/services/StockManagementService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Tag, Package, Star, Hash } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  isVisible: z.boolean().default(true),
  tags: z.string().optional(),
  specifications: z.string().optional(),
  salePrice: z.number().min(0).optional(),
  featured: z.boolean().default(false),
  
  // Enhanced Stock Management
  stockQuantity: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  maxStockLevel: z.number().min(0).optional(),
  allowBackorders: z.boolean().default(false),
  trackStock: z.boolean().default(true),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  restockDate: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

const categories = [
  // Retail & E-commerce
  "Electronics & Technology",
  "Clothing & Fashion",
  "Home & Garden",
  "Jewelry & Accessories", 
  "Books & Media",
  "Toys & Games",
  
  // Food & Beverage
  "Food & Beverages",
  "Restaurant & Catering",
  "Bakery & Desserts",
  
  // Services
  "Beauty & Personal Care",
  "Health & Wellness",
  "Professional Services",
  "Cleaning & Maintenance",
  "Education & Training",
  "Consulting & Coaching",
  
  // Local Business
  "Hardware & Tools",
  "Sports & Outdoors",
  "Arts & Crafts",
  "Pet Supplies",
  "Automotive",
  
  // Digital Products
  "Digital Downloads",
  "Software & Apps",
  "Online Courses",
  "Subscriptions",
  
  // Other
  "Other"
];

interface AddProductFormProps {
  onSuccess?: () => void;
}

export function AddProductForm({ onSuccess }: AddProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      isVisible: true,
      tags: "",
      specifications: "",
      salePrice: 0,
      featured: false,
      
      // Stock Management defaults
      stockQuantity: 0,
      minStockLevel: 5,
      maxStockLevel: 100,
      allowBackorders: false,
      trackStock: true,
      sku: "",
      barcode: "",
      restockDate: "",
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Use base64 to avoid CORS issues completely
    console.log('📸 Using base64 image storage (CORS-safe method)');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        console.log('✅ Image converted to base64 successfully');
        resolve(dataUrl);
      };
      reader.onerror = () => {
        console.error('❌ Failed to read image file');
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });

  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please log in to add products");
        return;
      }

      if (!imageFile) {
        toast.error("Please select an image for the product");
        return;
      }

      // Upload image
      const imageUrl = await uploadImage(imageFile);

      // Generate unique shareable ID
      const shareableId = `${user.uid}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      // Process tags and specifications
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      let specificationsObj = {};
      if (data.specifications) {
        try {
          // Try to parse as JSON first
          specificationsObj = JSON.parse(data.specifications);
        } catch {
          // If not JSON, treat as key:value pairs separated by commas
          const specs = data.specifications.split(',');
          specs.forEach(spec => {
            const [key, value] = spec.split(':').map(s => s.trim());
            if (key && value) {
              specificationsObj[key] = value;
            }
          });
        }
      }

      // Determine stock status based on quantity and settings
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
      if (data.trackStock) {
        if (data.stockQuantity === 0) {
          stockStatus = 'out_of_stock';
        } else if (data.stockQuantity <= data.minStockLevel) {
          stockStatus = 'low_stock';
        }
      }

      // Prepare enhanced product data with stock management
      const productData = {
        ...data,
        imageUrl,
        userId: user.uid,
        shareableId,
        businessName: settings.businessName || 'Our Store',
        whatsappNumber: settings.whatsappNumber || '',
        tags: tagsArray,
        specifications: specificationsObj,
        views: 0,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        
        // Enhanced stock management fields
        initialStock: data.stockQuantity, // Track original stock level
        stockStatus,
        stockHistory: [], // Will be populated by service
      };

      // Add product to Firebase
      const docRef = await addDoc(collection(db, "products"), productData);
      const productId = docRef.id;

      // Create initial stock transaction if tracking stock
      if (data.trackStock && data.stockQuantity > 0) {
        const stockService = new StockManagementService();
        await stockService.addStock(productId, data.stockQuantity, `Initial stock for ${data.name}`, 'addition');
      }

      toast.success("Product added successfully with stock tracking!");
      form.reset();
      setImageFile(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error("Failed to add product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Add New Product</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-medium">Product Image</label>
              <div className="flex flex-col items-center justify-center space-y-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 sm:w-48 sm:h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2"
                    >
                      Change
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-32 h-32 sm:w-48 sm:h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors" htmlFor="product-image-upload">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4 text-muted-foreground" />
                      <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-muted-foreground text-center px-2">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                    </div>
                    <input
                      id="product-image-upload"
                      name="productImage"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Product Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input 
                      id="product-name"
                      name="productName"
                      placeholder="Enter product name" 
                      autoComplete="off"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      id="product-description"
                      name="productDescription"
                      placeholder="Describe your product"
                      className="min-h-[100px]"
                      autoComplete="off"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        id="product-price"
                        name="productPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        autoComplete="off"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} name="productCategory">
                      <FormControl>
                        <SelectTrigger id="product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Enhanced Product Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Enhanced Details</h3>
              </div>

              {/* Stock Quantity & Sale Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Stock Quantity
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="stock-quantity"
                          name="stockQuantity"
                          type="number"
                          min="0"
                          placeholder="Available quantity"
                          autoComplete="off"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          id="sale-price"
                          name="salePrice"
                          type="number"
                          step="0.01"
                          placeholder="Discounted price"
                          autoComplete="off"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Enhanced Stock Management */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <h4 className="text-md font-semibold">Advanced Stock Management</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Low stock warning"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Alert when stock reaches this level
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Stock Level</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Maximum capacity"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Maximum stock capacity
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Product SKU"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          Stock Keeping Unit
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Product barcode"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="restockDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Restock Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <div className="text-xs text-muted-foreground">
                          When will this be restocked?
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trackStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Track Stock</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Monitor inventory levels for this product
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowBackorders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Backorders</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Accept orders when out of stock
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Tags */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </FormLabel>
                    <FormControl>
                      <Input
                        id="product-tags"
                        name="productTags"
                        placeholder="e.g., premium, bestseller, new (comma separated)"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Add tags to help customers find your product. Separate with commas.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Specifications */}
              <FormField
                control={form.control}
                name="specifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Specifications
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        id="product-specifications"
                        name="productSpecifications"
                        placeholder="e.g., Size: Large, Color: Red, Material: Cotton"
                        className="min-h-[80px]"
                        autoComplete="off"
                        {...field}
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground">
                      Add product specifications (Key: Value format, separated by commas)
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Featured & Visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Featured Product
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Highlight this product in your store
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        id="product-featured"
                        name="productFeatured"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isVisible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Visible to customers</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this product visible in your storefront
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        id="product-visibility"
                        name="productVisibility"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Sharing Options Preview */}
            <Card className="border-2 border-dashed border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <Star className="w-5 h-5" />
                  Sharing Features
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-green-600">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Unique shareable link will be generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>WhatsApp thumbnail with clickable link</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4" />
                    <span>Social media sharing optimized</span>
                  </div>
                  <div className="text-xs text-green-500 bg-green-100 p-2 rounded">
                    💡 Once created, you'll be able to share this product as a beautiful thumbnail that customers can click to view details and purchase directly!
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Adding Product..." : "Add Product"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}