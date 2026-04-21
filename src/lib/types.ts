export type Stage = {
  id: number;
  name: string;
  position: number;
  color: string;
  is_won: 0 | 1;
  is_lost: 0 | 1;
};

export type Contact = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  instagram: string | null;
  source: string | null;
  stage_id: number;
  position: number;
  last_contacted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContactWithStage = Contact & {
  stage_name: string;
  stage_color: string;
  stage_is_won: 0 | 1;
  stage_is_lost: 0 | 1;
};

export type Note = {
  id: number;
  contact_id: number;
  body: string;
  created_at: string;
};

export type Payment = {
  id: number;
  contact_id: number;
  amount: number;
  currency: string;
  method: string;
  paid_at: string;
  notes: string | null;
  service: string | null;
  created_at: string;
};

export type Settings = {
  business_name: string;
  brand_hue: string;
  currency: string;
  logo_path: string | null;
  onboarded: boolean;
};
