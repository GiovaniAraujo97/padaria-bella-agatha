export interface Category {
  id?: number;
  name: string;
  icon: string;
  slug: string;
  hasSizes?: boolean;
  visible?: boolean;
  displayOrder?: number;
}