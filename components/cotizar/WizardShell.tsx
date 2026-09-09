"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type WizardShellProps = {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (n: number) => void;
  variant?: "casual" | "profesional";
  children: React.ReactNode;
  canGoNext?: boolean;
  onNext?: () => void;
  onPrev?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  nextLabel?: string;
  submitLabel?: string;
  showNavigation?: boolean;
};

export function WizardShell({
  steps,
  currentStep,
  onStepChange,
  variant = "casual",
  children,
  canGoNext = true,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting,
  nextLabel = "Siguiente",
  submitLabel = "Enviar cotización",
  showNavigation = true,
}: WizardShellProps) {
  const isLast = currentStep === steps.length;
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Barra de progreso visual superior */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-xs font-bold tracking-widest uppercase", variant === "profesional" ? "font-mono text-slate-500 dark:text-zinc-400" : "text-slate-500 dark:text-zinc-400")}>
            Paso {currentStep} de {steps.length}
          </span>
          <span className={cn("text-xs", variant === "profesional" ? "font-mono text-slate-500 dark:text-zinc-400" : "text-slate-500 dark:text-zinc-400")}>
            {Math.round(progress)}% completado
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", variant === "profesional" ? "bg-white" : "bg-orange-500")}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stepper */}
      <div className={cn("flex items-center justify-center gap-2 md:gap-3 mb-8", variant === "profesional" ? "font-mono" : "")}>
        {steps.map((s) => {
          const isActive = currentStep === s.id;
          const isDone = currentStep > s.id;
          const Icon = s.icon;
          return (
            <div key={s.id} className="flex items-center gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => {
                  // solo permitir ir atrás, no adelantar sin validación
                  if (s.id < currentStep) onStepChange(s.id);
                }}
                disabled={s.id > currentStep}
                className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 disabled:cursor-not-allowed"
              >
                <div
                  className={cn(
                    "h-10 w-10 md:h-9 md:w-9 rounded-2xl md:rounded-xl flex items-center justify-center border-2 transition-all shrink-0",
                    isActive && variant === "casual" && "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20",
                    isActive && variant === "profesional" && "bg-orange-500 border-orange-500 text-zinc-950",
                    isDone && "bg-emerald-500 border-emerald-500 text-white",
                    !isActive && !isDone && "bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-500 dark:text-zinc-400"
                  )}
                >
                  {isDone ? <Check className="h-5 w-5 md:h-4 md:w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    "text-[11px] md:text-xs font-bold tracking-wide max-w-[72px] md:max-w-none leading-tight",
                    variant === "profesional" && "font-mono tracking-widest uppercase text-[10px]",
                    isActive ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-zinc-400"
                  )}
                >
                  {s.label}
                </span>
              </button>
              {s.id < steps.length && (
                <div className={cn("h-0.5 w-8 md:w-16 rounded-full transition-colors", currentStep > s.id ? "bg-emerald-500" : "bg-slate-200 dark:bg-zinc-800")} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenido — Tarjeta Flotante elegante */}
      <Card className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 md:p-8">
        {children}

        {showNavigation && (
          <div className="flex justify-between pt-6 mt-6 border-t border-slate-200 dark:border-zinc-700/50">
            <Button
              type="button"
              variant="secondary"
              onClick={onPrev}
              disabled={currentStep === 1}
              className={cn(currentStep === 1 && "invisible", variant === "profesional" && "font-mono")}
            >
              Atrás
            </Button>

            {!isLast ? (
              <Button
                type="button"
                onClick={onNext}
                disabled={!canGoNext}
                className={cn("gap-2", variant === "profesional" && "bg-orange-500 hover:bg-orange-600 text-zinc-950 font-mono")}
              >
                {nextLabel}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={onSubmit}
                disabled={!canGoNext || isSubmitting}
                className={cn("gap-2 min-w-[160px]", variant === "profesional" ? "bg-white hover:bg-zinc-100 text-zinc-900 font-mono" : "")}
              >
                {isSubmitting ? "Enviando..." : submitLabel}
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
