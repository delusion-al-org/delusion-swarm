export interface CarouselSlide {
  title: string;
  description?: string;
  image: string;
}

export interface CarouselSectionProps {
  title?: string;
  slides: CarouselSlide[];
}
