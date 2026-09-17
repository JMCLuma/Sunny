import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { useState } from "react";
import { Check, ChevronDown, Globe, Moon, Sun } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_CAMP_SEARCH } from "@/features/public/camp-search";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

// Native (endonym) language names — translations are not wired yet, so
// selecting only updates the label for now.
const LANGUAGES = [
  "English",
  "فارسی",
  "Русский",
  "Тоҷикӣ",
  "العربية",
  "हिन्दी",
  "ગુજરાતી",
  "اردو",
] as const;

const pillBase =
  "inline-flex h-[38px] items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const pillVariants = {
  // Filled brand-green — the single primary action (Donate).
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  // Outlined — secondary action (Sign In).
  outline:
    "border border-primary/40 bg-transparent text-foreground hover:border-primary hover:bg-primary/5",
  // Ghost utility — nav + language + toggle.
  ghost: "bg-transparent text-foreground hover:bg-muted",
} as const;

type PillProps = ComponentProps<"button"> & {
  variant?: keyof typeof pillVariants;
};

function Pill({ children, className, variant = "ghost", ...props }: PillProps) {
  return (
    <button type="button" className={cn(pillBase, pillVariants[variant], className)} {...props}>
      {children}
    </button>
  );
}

const pillClasses = (variant: keyof typeof pillVariants = "ghost", className?: string) =>
  cn(pillBase, pillVariants[variant], className);

function LanguageMenu() {
  const [selected, setSelected] = useState<(typeof LANGUAGES)[number]>("English");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Pill
          variant="ghost"
          aria-label="Change language"
          className="hidden gap-1.5 md:inline-flex"
        >
          <Globe className="size-4" />
          {selected}
          <ChevronDown className="size-3.5 opacity-70" />
        </Pill>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language}
            onSelect={() => setSelected(language)}
            className="flex items-center justify-between gap-3"
          >
            <span>{language}</span>
            {language === selected ? (
              <Check className="size-4 text-primary" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Pill
      variant="ghost"
      className="w-[38px] px-0"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Pill>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link
          to="/"
          aria-label="Luma home"
          className="flex items-center gap-3 text-foreground no-underline"
        >
          <img src="/jmc-logo.png" alt="" aria-hidden="true" className="block h-9 w-auto" />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-foreground">Luma</span>
            <span className="text-xs text-muted-foreground">by Jubilee Monuments Corp.</span>
          </span>
        </Link>
        <nav className="flex items-center justify-end gap-2">
          <Link
            to="/camps"
            search={DEFAULT_CAMP_SEARCH}
            className={pillClasses("ghost", "hidden md:inline-flex")}
          >
            Camps
          </Link>
          <LanguageMenu />
          <Link to="/my" className={pillClasses("outline", "hidden sm:inline-flex")}>
            Sign In
          </Link>
          <Link to="/donate" className={pillClasses("primary")}>
            Donate
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
