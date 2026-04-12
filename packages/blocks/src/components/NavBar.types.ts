export interface NavBarLink {
  label: string;
  href: string;
}

export interface NavBarProps {
  brand: string;
  links: NavBarLink[];
  ctaLabel?: string;
  ctaHref?: string;
  sticky?: boolean;
  showThemeToggle?: boolean;
}
