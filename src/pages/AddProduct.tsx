import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { SteppedAddProductForm } from "@/components/SteppedAddProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AddProduct() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/admin/products");
  };

  const handleCancel = () => {
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
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">Follow the steps to create a new product for your store</p>
          </div>
        </div>

        {/* Stepped Form */}
        <SteppedAddProductForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </AdminLayout>
  );
}