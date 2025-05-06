
export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birth_date: string;
  gender: string;
  image_url: string | null;
  clinic_id: string;
  user_id: string;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  created_at: string;
}
