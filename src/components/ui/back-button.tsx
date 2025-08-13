import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  className?: string;
  showTextOnMobile?: boolean;
}

export function BackButton({ 
  onClick, 
  children = "Back", 
  variant = "outline",
  size = "default",
  disabled = false,
  className,
  showTextOnMobile = false
}: BackButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "flex items-center gap-2",
              // Enhanced mobile experience: better touch targets and spacing
              "min-h-[44px] min-w-[44px]", // 44px minimum touch target for mobile
              showTextOnMobile ? "px-4" : "sm:px-4 px-3",
              // Hide text on mobile unless specified, show on larger screens
              showTextOnMobile ? "" : "sm:min-w-[auto]",
              className
            )}
          >
            <ArrowLeft className={cn(
              "flex-shrink-0",
              showTextOnMobile ? "h-4 w-4" : "h-5 w-5 sm:h-4 sm:w-4"
            )} />
            {/* Text visible on larger screens, conditionally on mobile */}
            <span className={cn(
              showTextOnMobile ? "" : "hidden sm:inline",
              "whitespace-nowrap font-medium"
            )}>
              {children}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="sm:hidden">
          <p>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
