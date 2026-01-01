import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon | React.ReactElement;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "secondary" | "accent";
  className?: string;
}

const variants = {
  default: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
  },
  primary: {
    iconBg: "bg-accent",
    iconColor: "text-primary",
  },
  secondary: {
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  accent: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  warning: {
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const styles = variants[variant];

  return (
    <div
      className={cn(
        "bg-card rounded-xl p-6 border border-border shadow-card hover:shadow-lg transition-all duration-300 group",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-card-foreground">{value}</h3>
            {trend && (
              <span
                className={cn(
                  "text-sm font-medium",
                  trend.positive ? "text-success" : "text-destructive"
                )}
              >
                {trend.positive ? "+" : "-"}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
            styles.iconBg
          )}
        >
          {React.isValidElement(Icon) ? (
            React.cloneElement(Icon as React.ReactElement<{ className?: string }>, {
              className: cn("w-6 h-6", styles.iconColor),
            })
          ) : (
            (() => {
              const IconComponent = Icon as LucideIcon;
              return <IconComponent className={cn("w-6 h-6", styles.iconColor)} />;
            })()
          )}
        </div>
      </div>
    </div>
  );
}
