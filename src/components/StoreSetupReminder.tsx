import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Settings, Palette, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useAuth } from '@/contexts/AuthContext';

interface StoreSetupReminderProps {
  onDismiss?: () => void;
}

export function StoreSetupReminder({ onDismiss }: StoreSetupReminderProps) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if store needs setup
  const needsSetup = !settings.businessName || 
                    !settings.storeDescription || 
                    !settings.primaryColor ||
                    settings.primaryColor === '#059669'; // Default color

  // Auto-dismiss after being shown for a while
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsDismissed(true);
    }, 30000); // Auto-dismiss after 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleSetupStore = () => {
    navigate('/admin/settings');
    handleDismiss();
  };

  const handlePreviewStore = () => {
    // This will be the user's store URL
    const storeUrl = `/store/${user?.uid || 'preview'}`;
    window.open(storeUrl, '_blank');
  };

  if (isDismissed || !needsSetup) {
    return null;
  }

  return (
    <Alert className="border-blue-200 bg-blue-50 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Palette className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <strong className="text-blue-800">🎨 Customize Your Store!</strong>
              <br />
              Your products are now automatically creating a beautiful storefront for your customers. 
              Add your business name, description, colors, and logo to make it uniquely yours.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleSetupStore}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Customize Store
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handlePreviewStore}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Store
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-blue-600 hover:bg-blue-100 -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}

interface NewProductCelebrationProps {
  productName: string;
  onDismiss?: () => void;
}

export function NewProductCelebration({ productName, onDismiss }: NewProductCelebrationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onDismiss?.();
    }, 10000); // Auto-dismiss after 10 seconds

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleViewStore = () => {
    navigate('/admin/products');
    setIsVisible(false);
    onDismiss?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Alert className="border-green-200 bg-green-50 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🎉</div>
          <div className="flex-1">
            <AlertDescription className="text-sm">
              <strong className="text-green-800">Product Added Successfully!</strong>
              <br />
              <em>"{productName}"</em> is now live in your store and ready to be shared with customers!
              Your store is automatically updated with each product you add.
            </AlertDescription>
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleViewStore}
                className="bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Products
              </Button>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-green-600 hover:bg-green-100 -mt-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Alert>
  );
}
