import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { useWalletData } from "@/hooks/useWalletData";
import { Wallet, CreditCard, Smartphone, DollarSign, Settings, ArrowUpRight, ArrowDownLeft, Plus, Send, Download, CheckCircle, XCircle, RefreshCw, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyWallet() {
  const { settings, isLoading, updateSettings, saveAllSettings } = useSettings();
  const { transactions, stats, loading, error, refreshData, getRecentTransactions, getWeeklyTrend } = useWalletData();
  const [isSaving, setIsSaving] = useState(false);
  const [mpesaDialogOpen, setMpesaDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [generalDialogOpen, setGeneralDialogOpen] = useState(false);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount).replace('KES', 'KES');
  };

  const formatRelativeTime = (timestamp: any) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await saveAllSettings();
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    }
    setIsSaving(false);
  };

  const handleQuickToggle = async (setting: string, value: boolean) => {
    updateSettings({ [setting]: value });
    try {
      await saveAllSettings();
      toast.success(`${setting === 'enableMpesa' ? 'M-Pesa' : 'Cash payments'} ${value ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      toast.error("Failed to update setting. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading wallet...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">My Wallet</h1>
            <p className="text-muted-foreground">Manage your payment methods and transaction settings</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            {!settings.enableMpesa && !settings.acceptCash && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                ⚠️ No Payment Methods
              </Badge>
            )}
            {settings.enableMpesa && !settings.mpesaMethod && (
              <Badge variant="outline" className="text-amber-600 border-amber-200">
                ⚠️ M-Pesa Not Configured
              </Badge>
            )}
            <Badge 
              variant="outline" 
              className="text-blue-600 border-blue-200 cursor-pointer hover:bg-blue-50"
              onClick={() => {
                toast.info("Account verification coming soon! This will verify your M-Pesa business details.");
              }}
            >
              Verify Account →
            </Badge>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Base Wallet - Coming Soon */}
          <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100/50 opacity-60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-gray-500">Base Wallet</CardTitle>
                    <p className="text-sm text-muted-foreground">USD</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-gray-500 border-gray-300">
                  Coming Soon
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-gray-400">
                  USD 0.00
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" disabled className="bg-gray-300">
                  <Plus className="w-4 h-4 mr-1" />
                  Deposit
                </Button>
                <Button size="sm" variant="outline" disabled className="border-gray-300 text-gray-400">
                  <Download className="w-4 h-4 mr-1" />
                  Withdraw
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Card */}
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setPaymentDialogOpen(true)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    settings.enableMpesa || settings.acceptCash ? 'bg-green-600' : 'bg-gray-400'
                  }`}>
                    <Smartphone className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Payment Methods</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {settings.enableMpesa && settings.acceptCash ? 'M-Pesa & Cash' :
                       settings.enableMpesa ? 'M-Pesa Only' :
                       settings.acceptCash ? 'Cash Only' : 'Contact Vendor'}
                    </p>
                  </div>
                </div>
                <Badge variant={settings.enableMpesa || settings.acceptCash ? "default" : "outline"} 
                       className={settings.enableMpesa || settings.acceptCash ? "bg-green-600" : ""}>
                  {settings.enableMpesa || settings.acceptCash ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.enableMpesa ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span className="text-sm font-medium">M-Pesa Payments</span>
                  </div>
                  <span className={`text-sm ${settings.enableMpesa ? 'text-green-600' : 'text-gray-400'}`}>
                    {settings.enableMpesa ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.acceptCash ? 
                      <CheckCircle className="w-4 h-4 text-green-600" /> : 
                      <XCircle className="w-4 h-4 text-gray-400" />
                    }
                    <span className="text-sm font-medium">Cash Payments</span>
                  </div>
                  <span className={`text-sm ${settings.acceptCash ? 'text-green-600' : 'text-gray-400'}`}>
                    {settings.acceptCash ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t">
                {settings.enableMpesa && settings.mpesaMethod ? (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Method: {settings.mpesaMethod === 'paybill' ? 'Paybill' : settings.mpesaMethod === 'till' ? 'Till' : 'Send Money'}
                    </p>
                    <p className="text-xs text-green-600 font-medium">Configured</p>
                  </div>
                ) : settings.enableMpesa ? (
                  <p className="text-xs text-amber-600">⚠️ M-Pesa enabled but not configured</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Click to configure payment methods</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Error Loading Wallet Data</p>
                  <p className="text-sm text-red-600">
                    Unable to fetch payment statistics and transaction history. Please check your internet connection.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshData}
                  className="ml-auto"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : error ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    formatCurrency(stats?.totalRevenue || 0)
                  )}
                </p>
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : error ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    formatCurrency(stats?.weeklyRevenue || 0)
                  )}
                </p>
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Payment Count</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold">
                  {loading ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : error ? (
                    <span className="text-red-500">Error</span>
                  ) : (
                    stats?.totalPaymentsProcessed || 0
                  )}
                </p>
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.mpesaPayments || 0} M-Pesa • {stats?.cashPayments || 0} Cash
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Dialog open={mpesaDialogOpen} onOpenChange={setMpesaDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-green-50 border-green-200">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-green-700">M-Pesa Setup</h3>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>M-Pesa Configuration</DialogTitle>
                <DialogDescription>
                  Configure M-Pesa payment method for your customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Enable M-Pesa</Label>
                    <p className="text-xs text-muted-foreground">Accept M-Pesa payments</p>
                  </div>
                  <Switch 
                    checked={settings.enableMpesa || false} 
                    onCheckedChange={(checked) => handleQuickToggle('enableMpesa', checked)}
                  />
                </div>

                {settings.enableMpesa && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Payment Method</Label>
                      <Select 
                        value={settings.mpesaMethod || 'paybill'} 
                        onValueChange={(value) => updateSettings({ mpesaMethod: value as 'paybill' | 'till' | 'send_money' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="paybill">Paybill Number</SelectItem>
                          <SelectItem value="till">Till Number</SelectItem>
                          <SelectItem value="send_money">Phone Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.mpesaMethod === 'paybill' && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="paybill">Paybill Number</Label>
                          <Input
                            id="paybill"
                            placeholder="522522"
                            value={settings.paybillNumber || ''}
                            onChange={(e) => updateSettings({ paybillNumber: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="account-ref">Account Reference</Label>
                          <Input
                            id="account-ref"
                            placeholder="Your business name"
                            value={settings.accountReference || ''}
                            onChange={(e) => updateSettings({ accountReference: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {settings.mpesaMethod === 'till' && (
                      <div className="space-y-2">
                        <Label htmlFor="till">Till Number</Label>
                        <Input
                          id="till"
                          placeholder="123456"
                          value={settings.tillNumber || ''}
                          onChange={(e) => updateSettings({ tillNumber: e.target.value })}
                        />
                      </div>
                    )}

                    {settings.mpesaMethod === 'send_money' && (
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+254712345678"
                          value={settings.mpesaPhoneNumber || ''}
                          onChange={(e) => updateSettings({ mpesaPhoneNumber: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="instructions">Payment Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Custom instructions for customers..."
                        value={settings.mpesaInstructions || ''}
                        onChange={(e) => updateSettings({ mpesaInstructions: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMpesaDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-blue-50 border-blue-200">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-blue-700">Payment Settings</h3>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Payment Method Settings</DialogTitle>
                <DialogDescription>
                  Configure which payment methods your customers can use
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">M-Pesa Payments</p>
                      <p className="text-sm text-muted-foreground">Via Daraja API</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.enableMpesa || false} 
                    onCheckedChange={(checked) => handleQuickToggle('enableMpesa', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Cash Payments</p>
                      <p className="text-sm text-muted-foreground">Payment on delivery</p>
                    </div>
                  </div>
                  <Switch 
                    checked={settings.acceptCash || false} 
                    onCheckedChange={(checked) => handleQuickToggle('acceptCash', checked)}
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> If both payment methods are disabled, customers will be asked to contact you directly for payment arrangements.
                  </p>
                </div>

                <Button onClick={() => setPaymentDialogOpen(false)} className="w-full">
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Card className="p-4 opacity-50 bg-gray-50 border-gray-200">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-gray-400 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-medium text-gray-500">Base Wallet</h3>
              <p className="text-xs text-gray-400">Coming Soon</p>
            </div>
          </Card>

          <Dialog open={generalDialogOpen} onOpenChange={setGeneralDialogOpen}>
            <DialogTrigger asChild>
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-purple-50 border-purple-200">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-purple-700">General Settings</h3>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>General Payment Settings</DialogTitle>
                <DialogDescription>
                  Configure delivery fees and order minimums
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Delivery Fee (KES)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="delivery-fee"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      value={settings.deliveryFee}
                      onChange={(e) => updateSettings({ deliveryFee: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="min-order">Minimum Order (KES)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="min-order"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-10"
                      value={settings.minimumOrder}
                      onChange={(e) => updateSettings({ minimumOrder: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setGeneralDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Payment History & Settings Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Payment History</TabsTrigger>
            <TabsTrigger value="settings">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Payment Processing History
                  <Badge variant="secondary">7 days</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track M-Pesa and cash payments processed through your store
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground mt-2">Loading payment history...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">Error loading payment history</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2" 
                        onClick={refreshData}
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No payment transactions found</p>
                      <p className="text-sm text-muted-foreground">Payment history will appear here once customers start placing orders</p>
                    </div>
                  ) : (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Recent Payment Activity</h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={refreshData}
                          disabled={loading}
                        >
                          <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {transactions.slice(0, 10).map((transaction, index) => (
                          <div key={transaction.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                transaction.paymentMethod === 'mpesa' 
                                  ? 'bg-green-100' 
                                  : 'bg-blue-100'
                              }`}>
                                {transaction.paymentMethod === 'mpesa' ? (
                                  <Smartphone className={`w-4 h-4 ${
                                    transaction.paymentMethod === 'mpesa' 
                                      ? 'text-green-600' 
                                      : 'text-blue-600'
                                  }`} />
                                ) : (
                                  <CreditCard className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {transaction.paymentMethod === 'mpesa' ? 'M-Pesa Payment' : 'Cash Payment'}
                                  {transaction.status === 'completed' && (
                                    <CheckCircle className="w-4 h-4 text-green-500 inline ml-2" />
                                  )}
                                  {transaction.status === 'failed' && (
                                    <XCircle className="w-4 h-4 text-red-500 inline ml-2" />
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Order #{transaction.orderId} - {transaction.customerPhone || 'Customer Payment'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-medium ${
                                transaction.status === 'completed' 
                                  ? transaction.paymentMethod === 'mpesa' 
                                    ? 'text-green-600' 
                                    : 'text-blue-600'
                                  : transaction.status === 'failed'
                                  ? 'text-red-600'
                                  : 'text-amber-600'
                              }`}>
                                {formatCurrency(transaction.amount)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatRelativeTime(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {transactions.length > 10 && (
                        <div className="text-center pt-4 border-t mt-4">
                          <p className="text-sm text-muted-foreground">
                            Showing 10 of {transactions.length} transactions
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* M-Pesa Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    M-Pesa Configuration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure your M-Pesa payment settings
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Enable M-Pesa</Label>
                      <p className="text-xs text-muted-foreground">Accept M-Pesa payments</p>
                    </div>
                    <Switch 
                      checked={settings.enableMpesa || false} 
                      onCheckedChange={(checked) => updateSettings({ enableMpesa: checked })}
                    />
                  </div>

                  {settings.enableMpesa && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select 
                          value={settings.mpesaMethod || 'paybill'} 
                          onValueChange={(value) => updateSettings({ mpesaMethod: value as 'paybill' | 'till' | 'send_money' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paybill">Paybill Number</SelectItem>
                            <SelectItem value="till">Till Number</SelectItem>
                            <SelectItem value="send_money">Phone Number</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {settings.mpesaMethod === 'paybill' && (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="paybill">Paybill Number</Label>
                            <Input
                              id="paybill"
                              placeholder="522522"
                              value={settings.paybillNumber || ''}
                              onChange={(e) => updateSettings({ paybillNumber: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="account-ref">Account Reference</Label>
                            <Input
                              id="account-ref"
                              placeholder="Your business name"
                              value={settings.accountReference || ''}
                              onChange={(e) => updateSettings({ accountReference: e.target.value })}
                            />
                          </div>
                        </div>
                      )}

                      {settings.mpesaMethod === 'till' && (
                        <div className="space-y-2">
                          <Label htmlFor="till">Till Number</Label>
                          <Input
                            id="till"
                            placeholder="123456"
                            value={settings.tillNumber || ''}
                            onChange={(e) => updateSettings({ tillNumber: e.target.value })}
                          />
                        </div>
                      )}

                      {settings.mpesaMethod === 'send_money' && (
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            placeholder="+254712345678"
                            value={settings.mpesaPhoneNumber || ''}
                            onChange={(e) => updateSettings({ mpesaPhoneNumber: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Base Wallet Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Base Wallet Configuration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure your Base wallet integration
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Enable Base Wallet</Label>
                      <p className="text-xs text-muted-foreground">Accept Base payments</p>
                    </div>
                    <Switch 
                      checked={settings.enableBase || false} 
                      onCheckedChange={(checked) => updateSettings({ enableBase: checked })}
                    />
                  </div>

                  {settings.enableBase && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="base-address">Wallet Address</Label>
                        <Input
                          id="base-address"
                          placeholder="0x..."
                          value={settings.baseWalletAddress || ''}
                          onChange={(e) => updateSettings({ baseWalletAddress: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="base-network">Network</Label>
                        <Select 
                          value={settings.baseNetwork || 'mainnet'}
                          onValueChange={(value) => updateSettings({ baseNetwork: value as 'mainnet' | 'testnet' })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mainnet">Base Mainnet</SelectItem>
                            <SelectItem value="testnet">Base Testnet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="base-api">API Key</Label>
                        <Input
                          id="base-api"
                          type="password"
                          placeholder="Your Base API key"
                          value={settings.baseApiKey || ''}
                          onChange={(e) => updateSettings({ baseApiKey: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  {!settings.enableBase && (
                    <div className="text-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">
                        Base wallet integration coming soon
                      </p>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        Coming Soon
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Blockchain payments will be available in a future update
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* General Payment Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-fee">Delivery Fee</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="delivery-fee"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        value={settings.deliveryFee}
                        onChange={(e) => updateSettings({ deliveryFee: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-order">Minimum Order</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="min-order"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="pl-10"
                        value={settings.minimumOrder}
                        onChange={(e) => updateSettings({ minimumOrder: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <Label className="text-sm font-medium">Accept Cash Payments</Label>
                    <p className="text-xs text-muted-foreground">Allow payment on delivery</p>
                  </div>
                  <Switch 
                    checked={settings.acceptCash || false} 
                    onCheckedChange={(checked) => updateSettings({ acceptCash: checked })}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="min-w-32"
                  >
                    {isSaving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
