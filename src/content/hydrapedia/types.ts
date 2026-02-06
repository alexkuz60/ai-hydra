export interface HydrapediaSection {
  id: string;
  titleKey: string;
  icon: string;
  adminOnly?: boolean;
  content: {
    ru: string;
    en: string;
  };
}
