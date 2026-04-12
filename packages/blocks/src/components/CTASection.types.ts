export interface CTASectionProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  variant?: 'primary' | 'neutral';
  id?: string;
}
