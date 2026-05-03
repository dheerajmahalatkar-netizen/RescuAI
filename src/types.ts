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
  assistanceSteps?: number[];
}
