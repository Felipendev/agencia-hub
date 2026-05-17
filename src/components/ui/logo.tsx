import Image from "next/image";
import Link from "next/link";

type LogoVariant = "dark" | "light";
type LogoSize = "sm" | "md" | "lg";

const sizes: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 24, text: "text-sm"  },
  md: { icon: 32, text: "text-lg"  },
  lg: { icon: 40, text: "text-xl"  },
};

type LogoProps = {
  variant?: LogoVariant;
  size?: LogoSize;
  href?: string | null;
  className?: string;
};

function LogoMark({ variant, size }: { variant: LogoVariant; size: LogoSize }) {
  const { icon } = sizes[size];
  const src = variant === "dark" ? "/compass.svg" : "/compass-light.svg";
  return <Image src={src} alt="AgênciasHub" width={icon} height={icon} className="shrink-0" />;
}

function LogoText({ variant, size }: { variant: LogoVariant; size: LogoSize }) {
  const { text } = sizes[size];
  const agenciasColor = variant === "dark" ? "text-white" : "text-[var(--hub-blue-dark)]";
  return (
    <span className={`font-bold tracking-tight ${text}`}>
      <span className={agenciasColor}>Agências</span>
      <span className="text-[var(--hub-yellow)]">Hub</span>
    </span>
  );
}

export function Logo({ variant = "dark", size = "md", href = "/", className = "" }: LogoProps) {
  const inner = (
    <span className={`flex items-center gap-2 ${className}`}>
      <LogoMark variant={variant} size={size} />
      <LogoText variant={variant} size={size} />
    </span>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }
  return inner;
}

export function LogoMarkOnly({ variant = "dark", size = "md", className = "" }: Omit<LogoProps, "href">) {
  const { icon } = sizes[size];
  const src = variant === "dark" ? "/compass.svg" : "/compass-light.svg";
  return <Image src={src} alt="AgênciasHub" width={icon} height={icon} className={`shrink-0 ${className}`} />;
}
