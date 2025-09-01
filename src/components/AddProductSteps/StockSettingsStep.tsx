import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import { Form } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, BarChart3, AlertTriangle, Calendar, Hash } from "lucide-react";

interface StockSettingsStepProps {
  form: UseFormReturn<any>;
  isLoading: boolean;
}

export function StockSettingsStep({ form, isLoading }: StockSettingsStepProps) {
  const trackStock = form.watch("trackStock");

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Package className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold">Stock & Inventory Management</h3>
          <p className="text-sm text-gray-500">
            Configure how you want to manage inventory for this product
          </p>
        </div>

        <Separator />

        <div className="space-y-6">
          {/* Track Stock Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Inventory Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="trackStock"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Track Stock Quantity
                      </FormLabel>
                      <FormDescription>
                        Enable inventory tracking to monitor stock levels and prevent overselling
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Stock Details - Only show if tracking is enabled */}
          {trackStock && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Stock Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Current Stock */}
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          Current Stock Quantity
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            disabled={isLoading}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          How many units do you currently have in stock?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Minimum Stock Level */}
                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          Minimum Stock Level
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            disabled={isLoading}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Alert when stock falls below this level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Maximum Stock Level */}
                  <FormField
                    control={form.control}
                    name="maxStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Maximum Stock Level
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="100"
                            disabled={isLoading}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of units to keep in stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Restock Date */}
                  <FormField
                    control={form.control}
                    name="restockDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Expected Restock Date
                          <Badge variant="outline" className="text-xs">
                            Optional
                          </Badge>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          When do you expect to receive more stock?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Allow Backorders */}
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="allowBackorders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Allow Backorders
                          </FormLabel>
                          <FormDescription>
                            Allow customers to order even when out of stock
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Identifiers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Product Identifiers
                <Badge variant="outline" className="text-xs">
                  Optional
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SKU */}
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        SKU (Stock Keeping Unit)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., PROD-001"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Internal product identifier for inventory management
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Barcode */}
                <FormField
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Barcode
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 1234567890123"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Product barcode for scanning and inventory
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Stock Management Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stock Management Benefits
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Prevent overselling by tracking available quantities</li>
              <li>• Get low stock alerts to manage reorders</li>
              <li>• Track sales performance and inventory turnover</li>
              <li>• Enable backorders for popular out-of-stock items</li>
              <li>• Organize products with SKUs and barcodes</li>
            </ul>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 p-4 bg-orange-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-700 font-medium">Step 4 of 5</span>
            <span className="text-orange-600">
              Next: Review & Create Product
            </span>
          </div>
          <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
            <div className="bg-orange-600 h-2 rounded-full w-4/5"></div>
          </div>
        </div>
      </div>
  );
}
