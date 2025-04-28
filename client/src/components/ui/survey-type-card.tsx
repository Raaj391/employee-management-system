import { cn } from "@/lib/utils";
import { SurveyType } from "@shared/schema";

type SurveyTypeCardProps = {
  type: SurveyType;
  name: string;
  rate: number;
  isSelected: boolean;
  isDisabled?: boolean;
};

const typeColors = {
  yours: {
    bg: "bg-blue-50",
    hoverBg: "hover:bg-blue-100",
    text: "text-blue-800",
    accent: "text-blue-600",
    border: "border-blue-200",
    selectedBorder: "border-blue-500",
  },
  yoursinternational: {
    bg: "bg-green-50",
    hoverBg: "hover:bg-green-100",
    text: "text-green-800",
    accent: "text-green-600",
    border: "border-green-200",
    selectedBorder: "border-green-500",
  },
  ssi: {
    bg: "bg-purple-50",
    hoverBg: "hover:bg-purple-100",
    text: "text-purple-800",
    accent: "text-purple-600",
    border: "border-purple-200",
    selectedBorder: "border-purple-500",
  },
  dynata: {
    bg: "bg-amber-50",
    hoverBg: "hover:bg-amber-100",
    text: "text-amber-800",
    accent: "text-amber-600",
    border: "border-amber-200",
    selectedBorder: "border-amber-500",
  },
};

export function SurveyTypeCard({
  type,
  name,
  rate,
  isSelected,
  isDisabled = false,
}: SurveyTypeCardProps) {
  const colors = typeColors[type];

  return (
    <div
      className={cn(
        "cursor-pointer border-2 rounded-lg p-4 text-center transition-all",
        colors.bg,
        colors.border,
        isSelected && [colors.selectedBorder, "ring-2 ring-offset-1", colors.border.replace("border", "ring")],
        !isDisabled && !isSelected && colors.hoverBg,
        isDisabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <h4 className={cn("font-medium mb-2", colors.text)}>{name}</h4>
      <p className={cn("font-bold", colors.accent)}>₹{rate} per survey</p>
      {isDisabled && (
        <p className="text-xs mt-2 text-gray-500">Already submitted</p>
      )}
    </div>
  );
}
