import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { SteppedAddProductForm } from "@/components/SteppedAddProductForm";
import { BackButton } from "@/components/ui/back-button";

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
          <BackButton
            onClick={handleCancel}
          >
            Back to Products
          </BackButton>
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