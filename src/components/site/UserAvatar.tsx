import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UserAvatarProps {
  name: string;
  initials?: string;
  seed?: string;
  size?: string;
  className?: string;
  avatarStyle?: "lorelei" | "personas" | "notionists" | "adventurer" | "thumbs";
}

const avatarGradient = {
  background:
    "linear-gradient(135deg, color-mix(in oklab, var(--violet) 55%, transparent), color-mix(in oklab, var(--blue) 45%, transparent))",
};

/**
 * Generate a Dicebear avatar URL with a consistent seed and harmonious styling.
 */
export function getDicebearAvatarUrl(
  seed: string,
  style: string = "lorelei",
): string {
  const safeSeed = encodeURIComponent(seed.trim());
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${safeSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf,c7d2fe,ddd6fe`;
}

/**
 * Professional Dicebear Avatar component with Radix fallback support.
 */
export function UserAvatar({
  name,
  initials,
  seed,
  size = "size-7",
  className,
  avatarStyle = "lorelei",
}: UserAvatarProps) {
  const effectiveSeed = seed || name || initials || "User";
  const avatarUrl = getDicebearAvatarUrl(effectiveSeed, avatarStyle);
  const displayInitials = initials || name.slice(0, 2).toUpperCase();

  return (
    <Avatar
      className={cn(
        "shrink-0 rounded-full border border-hairline bg-surface-2 ring-1 ring-white/10 shadow-sm select-none",
        size,
        className,
      )}
    >
      <AvatarImage
        src={avatarUrl}
        alt={name}
        className="size-full object-cover"
        loading="lazy"
      />
      <AvatarFallback
        style={avatarGradient}
        className="grid size-full place-items-center text-[10px] font-semibold text-foreground"
      >
        {displayInitials}
      </AvatarFallback>
    </Avatar>
  );
}
