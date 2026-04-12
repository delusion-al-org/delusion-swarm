export interface MenuItem {
  name: string;
  description?: string;
  price: string;
}
export interface MenuSectionProps {
  title?: string;
  items: MenuItem[];
}
