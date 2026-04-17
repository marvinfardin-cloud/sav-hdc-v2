import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "orange" | "purple" | "navy";
  href?: string;
}

export function StatsCard({ title, value, subtitle, icon, color = "navy", href }: StatsCardProps) {
  const colors = {
    navy: { bg: "bg-navy-50", icon: "bg-navy-100 text-navy-700", text: "text-navy-700" },
    blue: { bg: "bg-blue-50", icon: "bg-blue-100 text-blue-700", text: "text-blue-700" },
    green: { bg: "bg-green-50", icon: "bg-green-100 text-green-700", text: "text-green-700" },
    orange: { bg: "bg-orange-50", icon: "bg-orange-100 text-orange-700", text: "text-orange-700" },
    purple: { bg: "bg-purple-50", icon: "bg-purple-100 text-purple-700", text: "text-purple-700" },
  };

  const c = colors[color];

  const inner = (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 ${href ? "hover:shadow-md hover:border-gray-200 transition-all cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-1 ${c.text}`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}
