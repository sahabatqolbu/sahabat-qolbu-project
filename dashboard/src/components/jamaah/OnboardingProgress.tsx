// dashboard/src/components/jamaah/OnboardingProgress.tsx
"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  shortTitle: string;
}

interface OnboardingProgressProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function OnboardingProgress({
  steps,
  currentStep,
  completedSteps,
}: OnboardingProgressProps) {
  return (
    <div className="w-full">
      {/* Mobile: Simple indicator */}
      <div className="flex items-center justify-between md:hidden px-2">
        <span className="text-sm font-medium text-[var(--color-primary)]">
          Langkah {currentStep} dari {steps.length}
        </span>
        <span className="text-xs text-gray-500">
          {steps[currentStep - 1]?.title}
        </span>
      </div>

      {/* Mobile: Progress bar */}
      <div className="mt-2 md:hidden">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-secondary)] rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: Step indicators */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = completedSteps.includes(step.id);
          const isPast = step.id < currentStep;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted || isPast
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                        ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                        : "bg-white border-gray-300 text-gray-400",
                  )}
                >
                  {isCompleted || isPast ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium text-center max-w-[80px]",
                    isActive
                      ? "text-[var(--color-primary)]"
                      : isCompleted || isPast
                        ? "text-green-600"
                        : "text-gray-400",
                  )}
                >
                  {step.shortTitle}
                </span>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    isPast || isCompleted ? "bg-green-500" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
