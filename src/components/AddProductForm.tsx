import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Image as ImageIcon } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  category: z.string().min(1, "Category is required"),
  isVisible: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

const categories = [
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Health & Beauty",
  "Home & Garden",
  "Sports & Outdoors",
  "Books & Media",
  "Toys & Games",
  "Other"
];

interface AddProductFormProps {
  onSuccess?: () => void;
}

export function AddProductForm({ onSuccess }: AddProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      isVisible: true,
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

    const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
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

      // Add product to Firestore
      await addDoc(collection(db, "products"), {
        ...data,
        imageUrl,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success("Product added successfully!");
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
                      className="w-48 h-48 object-cover rounded-lg border"
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
                  <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>
                      </p>
                      <p className="text-xs text-muted-foreground">PNG, JPG or GIF</p>
                    </div>
                    <input
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
                    <Input placeholder="Enter product name" {...field} />
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
                      placeholder="Describe your product"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

            {/* Visibility */}
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
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

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