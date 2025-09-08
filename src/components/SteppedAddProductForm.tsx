import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StockManagementService } from "@/services/StockManagementService";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { BackButton } from "@/components/ui/back-button";
import { toast } from "sonner";
import { 
  Package, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Check,
  ArrowRight,
  Save
} from "lucide-react";

// Import step components
import { 
  BasicInfoStep,
  DescriptionStep,
  ImageStep,
  StockSettingsStep,
  ReviewStep
} from "./AddProductSteps";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  isVisible: z.boolean().default(true),
  tags: z.union([z.string(), z.array(z.string())]).transform(val => 
    Array.isArray(val) ? val.join(', ') : val || ""
  ).optional(),
  specifications: z.union([z.string(), z.object({})]).transform(val => 
    typeof val === 'object' && val !== null ? JSON.stringify(val) : val || ""
  ).optional(),
  salePrice: z.number().min(0).optional(),
  featured: z.boolean().default(false),
  
  // Stock Management
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

interface SteppedAddProductFormProps {
  productId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const steps = [
  {
    id: "basic",
    title: "Basic Info",
    description: "Name, price & category",
    icon: <Package className="w-4 h-4" />
  },
  {
    id: "description",
    title: "Description",
    description: "Details & features",
    icon: <FileText className="w-4 h-4" />
  },
  {
    id: "image",
    title: "Image",
    description: "Product photo",
    icon: <ImageIcon className="w-4 h-4" />
  },
  {
    id: "stock",
    title: "Stock",
    description: "Inventory settings",
    icon: <Settings className="w-4 h-4" />
  },
  {
    id: "review",
    title: "Review",
    description: "Final check",
    icon: <Check className="w-4 h-4" />
  }
];

export function SteppedAddProductForm({ productId, onSuccess, onCancel }: SteppedAddProductFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
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

  // Load existing product data when editing
  useEffect(() => {
    const loadProductData = async () => {
      if (!productId) return;

      try {
        setIsLoading(true);
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          
          // Reset form with existing data
          form.reset({
            name: productData.name || "",
            description: productData.description || "",
            price: productData.price || 0,
            category: productData.category || "",
            isVisible: productData.isVisible ?? true,
            tags: Array.isArray(productData.tags) ? productData.tags.join(', ') : (productData.tags || ""),
            specifications: typeof productData.specifications === 'object' && productData.specifications !== null 
              ? JSON.stringify(productData.specifications) 
              : (productData.specifications || ""),
            salePrice: productData.salePrice || 0,
            featured: productData.featured ?? false,
            stockQuantity: productData.stockQuantity || 0,
            minStockLevel: productData.minStockLevel || 5,
            maxStockLevel: productData.maxStockLevel || 100,
            allowBackorders: productData.allowBackorders ?? false,
            trackStock: productData.trackStock ?? true,
            sku: productData.sku || "",
            barcode: productData.barcode || "",
            restockDate: productData.restockDate || "",
          });

          // Set existing image if available
          if (productData.imageUrl) {
            setImagePreview(productData.imageUrl);
          }
        } else {
          toast.error("Product not found");
          onCancel?.();
        }
      } catch (error) {
        console.error("Error loading product:", error);
        toast.error("Failed to load product data");
        onCancel?.();
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
  }, [productId, form, onCancel]);

  const nextStep = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    const stepValidation = {
      0: ["name", "price", "category"], // Basic Info
      1: ["description"], // Description
      2: [], // Image (optional)
      3: [], // Stock (optional)
      4: [], // Review
    };

    const fieldsToValidate = stepValidation[currentStep as keyof typeof stepValidation];
    
      if (fieldsToValidate.length === 0) return true;
      const result = await form.trigger(fieldsToValidate as any);
      if (!result) {
        toast.error("Validation failed for required fields. Please check your input.");
        console.log("Validation failed for fields:", fieldsToValidate);
      }
      return result;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const maxFileSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxFileSize) {
      throw new Error("Image file is too large. Please choose an image smaller than 2MB.");
    }

    try {
      const compressedBase64 = await compressImage(file);
      return compressedBase64;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Image processing failed');
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          let { width, height } = img;
          const maxSize = 600;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: ProductFormData) => {
  console.log("DEBUG: onSubmit handler triggered", { data, productId });
  console.log("DEBUG: imageFile", imageFile);
  console.log("DEBUG: imagePreview", imagePreview);
    setIsLoading(true);
    try {
      // TODO: Replace with zklogin user ID when implemented
      const tempUserId = "temp-user-id";

      let imageUrl = imagePreview; // Keep existing image if no new file uploaded
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      const productData = {
        ...data,
        imageUrl,
        userId: tempUserId,
        updatedAt: new Date(),
        currency: settings.currency || 'usd',
      };
      if (productId) {
  console.log("[UPDATE] productId:", productId);
  console.log("[UPDATE] productData:", productData);
        // Update existing product
        const productRef = doc(db, "products", productId);
        await updateDoc(productRef, productData);
        toast.success("Product updated successfully!");
      } else {
  console.log("[ADD] productData:", productData);
        // Create new product
        const newProductData = {
          ...productData,
          createdAt: new Date(),
        };
        const docRef = await addDoc(collection(db, "products"), newProductData);
        toast.success("Product added successfully!");
      }
      onSuccess?.();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error instanceof Error ? error.message : `Failed to ${productId ? 'update' : 'add'} product`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      form,
      isLoading,
    };

    switch (currentStep) {
      case 0:
        return <BasicInfoStep {...commonProps} />;
      case 1:
        return <DescriptionStep {...commonProps} />;
      case 2:
        return (
          <ImageStep 
            {...commonProps}
            imageFile={imageFile}
            imagePreview={imagePreview}
            onImageSelect={(file, preview) => {
              setImageFile(file);
              setImagePreview(preview);
            }}
          />
        );
      case 3:
        return <StockSettingsStep {...commonProps} />;
      case 4:
        return (
          <ReviewStep 
            {...commonProps}
            formData={form.getValues()}
            imagePreview={imagePreview}
            onSubmit={form.handleSubmit(onSubmit)}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Show loading state when loading product data for editing
  if (productId && isLoading && !form.formState.isDirty) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading product data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{productId ? 'Edit Product' : 'Add New Product'}</CardTitle>
          <Stepper 
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            allowSkipping={true}
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            {/* Current Step Content */}
            <div className="min-h-[400px]">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <div>
                {!isFirstStep && (
                  <BackButton
                    variant="outline"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    Previous
                  </BackButton>
                )}
                {isFirstStep && (
                  <BackButton
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </BackButton>
                )}
              </div>

              <div className="flex gap-2">
                {!isLastStep && (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isLoading}
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
                {isLastStep && (
                  <Button
                    type="button"
                    onClick={() => {
                      console.log("Update/Create button clicked");
                      console.log("Form state:", form.formState);
                      console.log("Form errors details:", JSON.stringify(form.formState.errors, null, 2));
                      console.log("Form values:", form.getValues());
                      console.log("Form is valid:", form.formState.isValid);
                      console.log("Calling form.handleSubmit...");
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      `${productId ? 'Updating' : 'Creating'} Product...`
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {productId ? 'Update Product' : 'Create Product'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
