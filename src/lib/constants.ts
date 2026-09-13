export const SUPPORT_EMAIL = "support.zcompass@gmail.com";

export const PRODUCT_NAME = "Z-COMPASS";
export const PRODUCT_TAGLINE = "Clarity · Decisions · Progress";

export const INTEREST_AREAS = [
  "Personal",
  "Career",
  "Education",
  "Business",
  "Projects",
  "Finance",
  "Other",
] as const;

export type InterestArea = (typeof INTEREST_AREAS)[number];
