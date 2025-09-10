import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Share2, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const StorefrontLink = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!user || !user.uid) return null;

  const storefrontUrl = `${window.location.origin}/store/${user.uid}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(storefrontUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Your storefront link has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareStorefront = () => {
    const message = `Check out my store! Browse and shop my products here: ${storefrontUrl}`;
    
    if (navigator.share) {
      navigator.share({
        title: "My Store",
        text: message,
        url: storefrontUrl,
      });
    } else {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const openStorefront = () => {
    window.open(storefrontUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Your Public Storefront
        </CardTitle>
        <CardDescription>
          Share this link with customers to showcase your products
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storefront-url">Storefront URL</Label>
          <div className="flex gap-2">
            <Input
              id="storefront-url"
              value={storefrontUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={openStorefront} variant="default">
            <ExternalLink className="h-4 w-4 mr-2" />
            Visit Store
          </Button>
          
          <Button onClick={shareStorefront} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Share Store
          </Button>
        </div>

        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How to use your storefront:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share this link on social media, WhatsApp, or your website</li>
            <li>• Customers can browse and buy your products without signing up</li>
            <li>• All payments go directly to your configured M-Pesa account</li>
            <li>• Track sales and analytics in your admin dashboard</li>
          </ul>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            Public & Ready
          </Badge>
          <span className="text-sm text-muted-foreground">
            No login required for customers
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
