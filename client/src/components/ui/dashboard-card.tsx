import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  color?: "blue" | "green" | "purple" | "amber" | "red";
  className?: string;
  onClick?: () => void;
};

const colorStyles = {
  blue: {
    iconBg: "bg-blue-500",
    value: "text-blue-600",
  },
  green: {
    iconBg: "bg-green-500",
    value: "text-green-600",
  },
  purple: {
    iconBg: "bg-purple-500",
    value: "text-purple-600",
  },
  amber: {
    iconBg: "bg-amber-500",
    value: "text-amber-600",
  },
  red: {
    iconBg: "bg-red-500",
    value: "text-red-600",
  },
};

export function DashboardCard({
  title,
  value,
  icon,
  subtitle,
  color = "blue",
  className,
  onClick,
}: DashboardCardProps) {
  const styles = colorStyles[color];

  return (
    <div 
      className={cn(
        "bg-white overflow-hidden shadow rounded-lg",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3 text-white", styles.iconBg)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className={cn("text-lg font-semibold", styles.value)}>{value}</div>
                {subtitle && (
                  <div className="ml-2 text-sm text-gray-500">{subtitle}</div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
