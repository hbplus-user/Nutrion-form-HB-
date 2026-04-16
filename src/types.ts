export interface Assessment {
  id?: string;
  created_at?: string;
  
  // Personal Info
  client_name: string;
  uhid?: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string;
  location?: string;
  occupation?: string;
  
  // Anthropometrics
  weight: number;
  height: number;
  bmi: number;
  bmr?: number;
  tdee?: number;
  waist_circumference?: number;
  
  // Vitals
  systolic_bp?: number;
  diastolic_bp?: number;
  fasting_sugar?: number;
  
  // Conditions & Symptoms
  conditions: string[];
  gut_symptoms?: string[];
  gut_notes?: string;
  diet_type?: string;
  medications?: string;
  
  // Lifestyle
  physical_activity: string;
  lifestyle?: string;
  sleep_hours?: number;
  stress_level: number; // 1-10
  
  // Assessment
  overall_score: number; // 1-100
  diagnosis: string;
  recommendations: string[];
  
  // Additional Clinical Details
  past_surgeries?: string;
  skin_hair_nail?: string;
  dietary_breakfast?: string;
  dietary_lunch?: string;
  dietary_dinner?: string;
  dietary_outside?: string;
  dietary_alcohol?: string;
  dietary_smoking?: string;

  // Digital Assets
  pdf_url?: string;
  report_snapshot?: any;

  // Metadata
  plan_type: 'Silver' | 'Gold' | 'Platinum';
  status: 'draft' | 'completed';
}

export type AssessmentData = Omit<Assessment, 'id' | 'created_at'>;
