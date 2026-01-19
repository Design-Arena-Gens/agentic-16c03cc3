export type OutlierProduct = {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  priceBrl: number;
  reviewCount: number;
  reviewGrowthWeekly: number;
  tags: string[];
  justification: string;
  collectedAt: string;
  category: string;
};
