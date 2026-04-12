export interface HeroSectionProps {
  title: string;
  subtitle?: string;
  kicker?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  image?: string;
  align?: 'center' | 'start';
  id?: string;
}
