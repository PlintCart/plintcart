import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { Settings, User, Globe, DollarSign, MessageCircle, Bell, Palette } from "lucide-react";
import { useState } from "react";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const { settings, profile, isLoading, updateSettings, updateProfile, saveAllSettings, resetToDefaults } = useSettings();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    await saveAllSettings();
    setIsSaving(false);
  };

  const handleReset = () => {
    resetToDefaults();
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and store settings</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  placeholder="Your Name"
                  value={profile.displayName}
                  onChange={(e) => updateProfile({ displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={profile.phoneNumber}
                  onChange={(e) => updateProfile({ phoneNumber: e.target.value })}
                />
              </div>

              <Button className="w-full text-sm">Update Account</Button>
              <Button variant="outline" className="w-full text-sm" onClick={logout}>
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Store Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Store Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business-name">Business Name</Label>
                <Input
                  id="business-name"
                  placeholder="My Business"
                  value={settings.businessName}
                  onChange={(e) => updateSettings({ businessName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-address">Business Address</Label>
                <Textarea
                  id="business-address"
                  placeholder="123 Main St, City, State 12345"
                  rows={3}
                  value={settings.businessAddress}
                  onChange={(e) => updateSettings({ businessAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-phone">Business Phone</Label>
                <Input
                  id="business-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={settings.businessPhone}
                  onChange={(e) => updateSettings({ businessPhone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business-email">Business Email</Label>
                <Input
                  id="business-email"
                  type="email"
                  placeholder="contact@mybusiness.com"
                  value={settings.businessEmail}
                  onChange={(e) => updateSettings({ businessEmail: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Currency & Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Localization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={settings.currency} onValueChange={(value) => updateSettings({ currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                    <SelectItem value="ksh">KSH (KSh)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Storefront Language</Label>
                <Select value={settings.language} onValueChange={(value) => updateSettings({ language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="sw">Swahili</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSettings({ timezone: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">Eastern Time</SelectItem>
                    <SelectItem value="pst">Pacific Time</SelectItem>
                    <SelectItem value="eat">East Africa Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>



          {/* WhatsApp Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                WhatsApp Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-number">WhatsApp Number</Label>
                <Input
                  id="whatsapp-number"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={settings.whatsappNumber}
                  onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  This number will receive order notifications
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order-message">Order Message Template</Label>
                <Textarea
                  id="order-message"
                  placeholder="Hi! I'd like to place an order..."
                  value={settings.orderMessageTemplate}
                  onChange={(e) => updateSettings({ orderMessageTemplate: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Auto-send Order Details</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Automatically include order details in WhatsApp message
                  </p>
                </div>
                <Switch 
                  checked={settings.autoSendOrderDetails} 
                  onCheckedChange={(checked) => updateSettings({ autoSendOrderDetails: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Email Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive order notifications via email
                  </p>
                </div>
                <Switch 
                  checked={settings.emailNotifications} 
                  onCheckedChange={(checked) => updateSettings({ emailNotifications: checked })}
                />
              </div>

              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">SMS Notifications</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive order notifications via SMS
                  </p>
                </div>
                <Switch 
                  checked={settings.smsNotifications} 
                  onCheckedChange={(checked) => updateSettings({ smsNotifications: checked })}
                />
              </div>

              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Marketing Updates</Label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Receive updates about new features
                  </p>
                </div>
                <Switch 
                  checked={settings.marketingUpdates} 
                  onCheckedChange={(checked) => updateSettings({ marketingUpdates: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={handleReset} disabled={isSaving} className="text-sm">
            Reset to Default
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving} className="text-sm">
            {isSaving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
