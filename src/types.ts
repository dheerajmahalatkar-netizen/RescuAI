export enum EmergencyCategory {
  MEDICAL = 'medical',
  ACCIDENT = 'accident',
  FIRE = 'fire',
  BREATHING = 'breathing',
  BLEEDING = 'bleeding',
  OTHER = 'other'
}

export enum SeverityLevel {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface UserProfile {
  fullName: string;
  phoneNumber: string;
  emergencyContacts: string[]; // List of phone numbers or JSON strings
  bloodGroup?: string;
  medicalConditions?: string;
  language?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  age?: number;
  height?: string;
  onMedication?: boolean;
  medicationDetails?: string;
  underDiagnosis?: boolean;
  diagnosisDetails?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface FirstAidStep {
  title: string;
  description: string;
  icon?: string; // Lucide icon name or type
  visualUrl?: string;
  visualPrompt?: string;
  narration?: string; // Localized narration for the step
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface EmergencyRecord {
  id?: string;
  userId: string;
  type: EmergencyCategory;
  severity: SeverityLevel;
  location: LocationData;
  timestamp: any; // Firestore Timestamp
  description?: string;
  voiceInput?: string;
  imageUrl?: string;
  status: 'active' | 'resolved' | 'cancelled';
  assistanceSteps?: string[];
  firstAidAdvice?: FirstAidStep[];
  language?: string;
  chatHistory?: ChatMessage[];
  notes?: string;
}
