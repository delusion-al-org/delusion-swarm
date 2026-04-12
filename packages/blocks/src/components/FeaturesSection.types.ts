export interface Feature {
  title: string;
  description: string;
  icon?: string;
}

export interface FeaturesSectionProps {
  title: string;
  subtitle?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  id?: string;
}
