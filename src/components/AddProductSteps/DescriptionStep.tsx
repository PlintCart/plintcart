import { UseFormReturn } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, List, Settings } from "lucide-react";

interface DescriptionStepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export function DescriptionStep({ form, isLoading }: DescriptionStepProps) {
  return (
    <Form {...form}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Product Description & Features</h3>
          <p className="text-sm text-gray-500">
            Provide detailed information about your product to help customers make informed decisions
          </p>
        </div>

        <Separator />

        <div className="space-y-6">
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Product Description *
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe your product in detail. Include key features, benefits, and what makes it special..."
                    className="min-h-[120px] resize-none"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-gray-500">
                  A good description helps customers understand your product better and improves search visibility.
                </p>
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
                  <List className="w-4 h-4" />
                  Specifications
                  <Badge variant="outline" className="text-xs">
                    Optional
                  </Badge>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="List technical specifications, dimensions, materials, etc.&#10;Example:&#10;- Weight: 150g&#10;- Dimensions: 15cm x 10cm x 5cm&#10;- Material: Stainless Steel&#10;- Battery Life: 24 hours"
                    className="min-h-[100px] resize-none"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-gray-500">
                  Include technical details, dimensions, materials, or any other specifications that customers might need.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Writing Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Writing Tips
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Highlight the main benefits and unique features</li>
            <li>• Use clear, simple language that customers can understand</li>
            <li>• Include information about size, material, or compatibility</li>
            <li>• Mention any warranties, guarantees, or return policies</li>
            <li>• Think about what questions customers might have</li>
          </ul>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-700 font-medium">Step 2 of 5</span>
            <span className="text-green-600">
              Next: Upload Product Image
            </span>
          </div>
          <div className="mt-2 w-full bg-green-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full w-2/5"></div>
          </div>
        </div>
      </div>
    </Form>
  );
}
