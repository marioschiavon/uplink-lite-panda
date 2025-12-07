import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  title: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 bg-card rounded-xl p-6 shadow-lg border border-border">
      {/* Progress bar */}
      <div className="relative">
        <div className="absolute top-6 left-0 right-0 h-1 bg-muted mx-6">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <div key={index} className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shadow-md",
                    isCompleted && "bg-primary text-primary-foreground shadow-primary/30",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/30 scale-110",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground border-2 border-border"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-sm font-semibold transition-colors duration-300",
                    (isCompleted || isCurrent) ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
