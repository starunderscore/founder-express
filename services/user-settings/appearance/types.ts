export type AppearanceSettings = {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'auto';
  updatedAt?: number;
};

export type AppearanceCreateInput = {
  userId: string;
  theme: 'light' | 'dark' | 'auto';
};

export type AppearancePatchInput = {
  theme?: 'light' | 'dark' | 'auto';
};

