import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { StockManagementService } from "@/services/StockManagementService";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stepper } from "@/components/ui/stepper";
import { toast } from "sonner";
import { 
  Package, 
  FileText, 
  Image as ImageIcon, 
  Settings, 
  Check,
  ArrowLeft,
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
  tags: z.string().optional(),
  specifications: z.string().optional(),
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

export function SteppedAddProductForm({ onSuccess, onCancel }: SteppedAddProductFormProps) {
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
    return result;
  };

  const uploadImage = async (file: File): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

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
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }

      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const productData = {
        ...data,
        imageUrl,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        currency: settings.currency || 'usd',
      };

      const docRef = await addDoc(collection(db, "products"), productData);

      // Create stock transaction if tracking stock
      if (data.trackStock && data.stockQuantity && data.stockQuantity > 0) {
        const stockService = new StockManagementService();
        await stockService.addStock(
          docRef.id,
          data.stockQuantity,
          'Initial stock',
          'addition',
          'Initial stock setup for new product'
        );
      }

      toast.success("Product added successfully!");
      onSuccess?.();
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add product");
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
          <Stepper 
            steps={steps}
            currentStep={currentStep}
            onStepClick={goToStep}
            allowSkipping={true}
          />
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Step Content */}
          <div className="min-h-[400px]">
            {renderCurrentStep()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              {isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
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
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    "Creating Product..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Product
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
