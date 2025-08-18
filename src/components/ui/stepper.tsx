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
      {/* Desktop stepper */}
      <ol className="hidden md:flex items-center justify-between w-full">
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
                
                {/* Step label - hidden on small screens */}
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="flex-1 mx-4 relative">
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
                  <div 
                    className={cn(
                      "absolute top-6 left-0 h-0.5 bg-primary transition-all duration-500 ease-in-out",
                      isCompleted ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Mobile stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2",
                {
                  "bg-primary border-primary text-primary-foreground": currentStep >= 0,
                  "border-muted bg-background text-muted-foreground": currentStep < 0,
                }
              )}
            >
              {currentStep > 0 ? (
                <Check className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4">
                  {steps[currentStep]?.icon}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium">{steps[currentStep]?.title}</p>
              <p className="text-xs text-muted-foreground">{steps[currentStep]?.description}</p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {currentStep + 1} of {steps.length}
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-border rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
};
