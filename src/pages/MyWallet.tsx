import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/contexts/SettingsContext";
import { Wallet, CreditCard, Smartphone, DollarSign } from "lucide-react";
import { useState } from "react";

export default function MyWallet() {
  const { settings, isLoading, updateSettings, saveAllSettings } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await saveAllSettings();
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wallet settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Wallet</h1>
          <p className="text-muted-foreground">Manage your payment settings and wallet configuration</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Payment Settings */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Settings
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Configure M-Pesa payment options for your customers
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Payment Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Delivery/Service Fee</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="delivery-fee"
                      type="number"
                      step="0.01"
                      placeholder="5.00"
                      className="pl-10"
                      value={settings.deliveryFee}
                      onChange={(e) => updateSettings({ deliveryFee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-order">Minimum Order Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="min-order"
                      type="number"
                      step="0.01"
                      placeholder="10.00"
                      className="pl-10"
                      value={settings.minimumOrder}
                      onChange={(e) => updateSettings({ minimumOrder: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* M-Pesa Integration */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-green-600" />
                M-Pesa Integration
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Configure M-Pesa payment method for seamless transactions
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Enable M-Pesa Payments</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Allow customers to pay via M-Pesa
                  </p>
                </div>
                <Switch 
                  checked={settings.enableMpesa || false} 
                  onCheckedChange={(checked) => updateSettings({ enableMpesa: checked })}
                />
              </div>

              {settings.enableMpesa && (
                <div className="space-y-4 border rounded-lg p-4 bg-green-50/50">
                  <div className="space-y-2">
                    <Label>M-Pesa Payment Method</Label>
                    <Select 
                      value={settings.mpesaMethod || 'paybill'} 
                      onValueChange={(value) => updateSettings({ mpesaMethod: value as 'paybill' | 'till' | 'send_money' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paybill">Paybill (Business Number)</SelectItem>
                        <SelectItem value="till">Till Number (Buy Goods)</SelectItem>
                        <SelectItem value="send_money">Send Money (Phone Number)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.mpesaMethod === 'paybill' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paybill-number">Paybill Number</Label>
                        <Input
                          id="paybill-number"
                          placeholder="e.g., 522522"
                          value={settings.paybillNumber || ''}
                          onChange={(e) => updateSettings({ paybillNumber: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your business paybill number from Safaricom
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="account-reference">Account Reference Format</Label>
                        <Input
                          id="account-reference"
                          placeholder="e.g., ORDER123 or your business name"
                          value={settings.accountReference || ''}
                          onChange={(e) => updateSettings({ accountReference: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          How customers should enter account reference
                        </p>
                      </div>
                    </div>
                  )}

                  {settings.mpesaMethod === 'till' && (
                    <div className="space-y-2">
                      <Label htmlFor="till-number">Till Number</Label>
                      <Input
                        id="till-number"
                        placeholder="e.g., 123456"
                        value={settings.tillNumber || ''}
                        onChange={(e) => updateSettings({ tillNumber: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your business till number (Buy Goods and Services)
                      </p>
                    </div>
                  )}

                  {settings.mpesaMethod === 'send_money' && (
                    <div className="space-y-2">
                      <Label htmlFor="mpesa-phone">M-Pesa Phone Number</Label>
                      <Input
                        id="mpesa-phone"
                        placeholder="e.g., +254712345678"
                        value={settings.mpesaPhoneNumber || ''}
                        onChange={(e) => updateSettings({ mpesaPhoneNumber: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Phone number that will receive M-Pesa payments
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="mpesa-instructions">Payment Instructions</Label>
                    <Textarea
                      id="mpesa-instructions"
                      placeholder="Custom instructions for your customers..."
                      value={settings.mpesaInstructions || ''}
                      onChange={(e) => updateSettings({ mpesaInstructions: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Additional instructions shown to customers during checkout
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Other Payment Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Other Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Accept Cash Payments</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Allow customers to pay on delivery
                  </p>
                </div>
                <Switch 
                  checked={settings.acceptCash || false} 
                  onCheckedChange={(checked) => updateSettings({ acceptCash: checked })}
                />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  More payment methods coming soon:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Bank transfers</li>
                  <li>• PayPal integration</li>
                  <li>• Cryptocurrency payments</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Delivery Fee</span>
                  <span className="font-medium">{settings.currency || 'KES'} {settings.deliveryFee || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Minimum Order</span>
                  <span className="font-medium">{settings.currency || 'KES'} {settings.minimumOrder || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">M-Pesa</span>
                  <span className={`text-sm ${settings.enableMpesa ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {settings.enableMpesa ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cash Payments</span>
                  <span className={`text-sm ${settings.acceptCash ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {settings.acceptCash ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="min-w-32"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
