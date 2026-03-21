import { ButtonHTMLAttributes, ReactNode } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
  colorClass?: string;
}

export default function IconButton({ icon, children, colorClass = "bg-teal-700 hover:bg-teal-800 text-white", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition flex items-center gap-2 ${colorClass}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
