export interface Stat {
  label: string;
  value: string;
  description?: string;
}

export interface StatsSectionProps {
  title?: string;
  stats: Stat[];
  id?: string;
}
