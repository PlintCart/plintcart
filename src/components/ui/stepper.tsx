import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowSkipping?: boolean;
}

export const Stepper = ({ steps, currentStep, onStepClick, allowSkipping = false }: StepperProps) => {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = allowSkipping || isCompleted || isCurrent;

          return (
            <li key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    {
                      "bg-primary border-primary text-primary-foreground": isCompleted,
                      "border-primary bg-primary/10 text-primary": isCurrent,
                      "border-muted bg-background text-muted-foreground": !isCompleted && !isCurrent,
                      "cursor-pointer hover:bg-primary/20": isClickable && !isCompleted,
                      "cursor-not-allowed opacity-50": !isClickable,
                    }
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </button>
                
                {/* Step info */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-sm font-medium transition-colors",
                    {
                      "text-primary": isCurrent || isCompleted,
                      "text-muted-foreground": !isCurrent && !isCompleted,
                    }
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-24">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 h-px bg-border mt-[-20px]">
                  <div 
                    className={cn(
                      "h-full bg-primary transition-all duration-300",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
