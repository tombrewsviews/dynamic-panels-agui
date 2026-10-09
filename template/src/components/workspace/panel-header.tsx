import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PanelHeader({
  title,
  subtitle,
  leading,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex min-h-14 shrink-0 items-center gap-2 border-b px-4 py-2.5", className)}>
      {leading}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold leading-tight">{title}</h2>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
    </header>
  );
}
