import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { AddProductForm } from "@/components/AddProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddProduct() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/admin/products");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/admin/products")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Create a new product for your store</p>
          </div>
        </div>

        {/* Form */}
        <AddProductForm onSuccess={handleSuccess} />
      </div>
    </AdminLayout>
  );
}