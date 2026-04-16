import { STATUT_LABELS, STATUT_COLORS } from "@/lib/utils";

interface BadgeProps {
  statut: string;
  size?: "sm" | "md";
}

export function StatusBadge({ statut, size = "md" }: BadgeProps) {
  const label = STATUT_LABELS[statut] || statut;
  const color = STATUT_COLORS[statut] || "bg-gray-100 text-gray-800";
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";
  const pulseClass = statut === "PRET" ? "status-pret" : "";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${color} ${pulseClass}`}
    >
      {label}
    </span>
  );
}

interface GenericBadgeProps {
  children: React.ReactNode;
  variant?: "blue" | "green" | "orange" | "red" | "gray" | "purple";
  size?: "sm" | "md";
}

export function Badge({ children, variant = "blue", size = "md" }: GenericBadgeProps) {
  const variants = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-800",
  };
  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClass} ${variants[variant]}`}>
      {children}
    </span>
  );
}
