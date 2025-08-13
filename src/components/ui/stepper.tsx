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
              {/* Step circle with icon */}
              <div className="flex flex-col items-center relative">
                <button
                  onClick={() => isClickable && onStepClick?.(index)}
                  disabled={!isClickable}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 relative z-10",
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
                    <div className="w-5 h-5">
                      {step.icon}
                    </div>
                  )}
                </button>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border transform -translate-y-1/2" />
                  <div 
                    className={cn(
                      "absolute top-1/2 left-0 h-0.5 bg-primary transform -translate-y-1/2 transition-all duration-500 ease-in-out",
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
