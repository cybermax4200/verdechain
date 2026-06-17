export type ProductStatus = 'ACTIVE' | 'RECALLED' | 'INACTIVE' | 'PENDING';

export type LifecycleStage =
  | 'raw_material_extraction'
  | 'raw_material_processing'
  | 'manufacturing'
  | 'assembly'
  | 'packaging'
  | 'transportation'
  | 'distribution'
  | 'retail'
  | 'use'
  | 'end_of_life'
  | 'recycling';

export type CertType =
  | 'carbon_neutral'
  | 'certificate_of_origin'
  | 'organic'
  | 'green_tag'
  | 'fair_trade';

export type AttestationStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface Manufacturer {
  id: string;
  name: string;
  publicKey: string;
  country?: string;
  registeredAt: string;
}

export interface Facility {
  id: string;
  name: string;
  location: string;
  facilityType: string;
  manufacturerId: string;
}

export interface ProductMetadata {
  id: string;
  productId: number;
  name: string;
  description?: string;
  sku?: string;
  batchNumber?: string;
  productType?: string;
  originCountry?: string;
  ipfsHash?: string;
  status: ProductStatus;
  manufacturer: Manufacturer;
  createdAt: string;
  updatedAt?: string;
}

export interface MaterialInput {
  name: string;
  amount: number;
  unit: string;
  origin?: string;
  carbonFootprint?: number;
}

export interface LifecycleEvent {
  id: string;
  productId: string;
  stage: LifecycleStage;
  description?: string;
  location?: string;
  timestamp: string;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
  emissionsKg?: number;
  materialInputs?: MaterialInput[];
}

export interface CarbonFootprint {
  id: string;
  productId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalFootprint: number;
  confidenceScore?: number;
  methodology: string;
  breakdown?: Record<string, number>;
  calculatedAt: string;
}

export interface EmissionsBreakdown {
  stage: LifecycleStage;
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
}

export interface Equivalents {
  kmDriven: number;
  smartphonesCharged: number;
  treeSeedlings: number;
  householdElectricityDays: number;
}

export interface CertificateRecord {
  id: string;
  title: string;
  certType: CertType;
  status: 'active' | 'revoked' | 'expired' | 'pending';
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  issuerId?: string;
  issuerName?: string;
  productId: string;
  productName?: string;
  ipfsHash?: string;
  description?: string;
}

export interface VerifierRecord {
  id: string;
  publicKey: string;
  name: string;
  reputation: ReputationScore;
  stake: string;
  status: 'active' | 'slashed' | 'inactive';
  registeredAt: string;
}

export interface ReputationScore {
  overall: number;
  accuracy: number;
  timeliness: number;
  volume: number;
  peerReviews: number;
  longevity: number;
}

export interface AttestationRecord {
  id: string;
  productId: string;
  productName?: string;
  status: AttestationStatus;
  submittedAt: string;
  resolvedAt?: string;
  verifiers: string[];
  requiredCount: number;
  rejections?: { verifier: string; reason: string }[];
}

export interface ProductFilters {
  q?: string;
  type?: string;
  origin?: string;
  sort?: 'newest' | 'oldest' | 'name';
  page?: number;
  limit?: number;
}

export interface CertificateFilters {
  type?: string;
  status?: string;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SDKConfig {
  apiUrl: string;
  horizonUrl?: string;
  sorobanRpc?: string;
  networkPassphrase?: string;
  contractAddresses?: Record<string, string>;
}
