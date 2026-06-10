export interface IProductService {
  create(data: CreateProductInput): Promise<ProductResult>;
  findAll(filters: ProductFilters): Promise<PaginatedResult<ProductResult>>;
  findOne(id: string): Promise<ProductResult>;
  getProvenance(id: string): Promise<ProvenanceGraph>;
  getLifecycle(id: string): Promise<LifecycleEventResult[]>;
  getCarbon(id: string): Promise<CarbonFootprintResult>;
  getCertificates(id: string): Promise<CertificateResult[]>;
  getProductsByOwner(publicKey: string): Promise<ProductResult[]>;
  getProductsByBatch(batch: string): Promise<ProductResult[]>;
}

export interface ILifecycleService {
  recordEvent(data: CreateLifecycleEventInput): Promise<LifecycleEventResult>;
  batchRecord(events: CreateLifecycleEventInput[]): Promise<LifecycleEventResult[]>;
  getTimeline(productId: string): Promise<LifecycleTimeline>;
  getParticipants(productId: string): Promise<string[]>;
}

export interface ICarbonService {
  calculateFootprint(productId: string): Promise<CarbonFootprintResult>;
  getBreakdown(productId: string): Promise<EmissionsBreakdown>;
  compare(productIds: string[]): Promise<CarbonComparison>;
  getEquivalents(kgCO2e: number): Promise<Equivalents>;
}

export interface ICertificateService {
  issue(data: IssueCertificateInput): Promise<CertificateResult>;
  verify(id: string): Promise<VerificationResult>;
  revoke(id: string, reason: string): Promise<CertificateResult>;
  findOne(id: string): Promise<CertificateResult>;
  findAll(filters: CertificateFilters): Promise<PaginatedResult<CertificateResult>>;
  getCertificatePdf(id: string): Promise<Buffer>;
  getCertificatesByProduct(productId: string): Promise<CertificateResult[]>;
}

export interface IVerifierService {
  register(data: RegisterVerifierInput): Promise<VerifierResult>;
  getProfile(id: string): Promise<VerifierResult>;
  getPendingAttestations(id: string): Promise<AttestationResult[]>;
  heartbeat(id: string): Promise<void>;
  addStake(id: string, amount: number): Promise<VerifierResult>;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  sku?: string;
  batchNumber?: string;
  productType?: string;
  originCountry?: string;
  manufacturerId: string;
  metadata?: Record<string, unknown>;
}

export interface ProductFilters {
  type?: string;
  origin?: string;
  manufacturer?: string;
  q?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductResult {
  id: string;
  productId: number;
  name: string;
  description?: string;
  sku?: string;
  batchNumber?: string;
  productType?: string;
  originCountry?: string;
  ipfsHash?: string;
  status: string;
  metadata?: Record<string, unknown>;
  manufacturer: ManufacturerInfo;
  createdAt: Date;
}

export interface ManufacturerInfo {
  id: string;
  name: string;
  publicKey: string;
  country?: string;
}

export interface ProvenanceGraph {
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
}

export interface ProvenanceNode {
  id: string;
  type: string;
  label: string;
  metadata?: Record<string, unknown>;
}

export interface ProvenanceEdge {
  source: string;
  target: string;
  type: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CreateLifecycleEventInput {
  productId: string;
  stage: string;
  description?: string;
  location?: string;
  timestamp: Date;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
  metadata?: Record<string, unknown>;
}

export interface LifecycleEventResult {
  id: string;
  productId: string;
  stage: string;
  description?: string;
  location?: string;
  timestamp: Date;
  energyKwh?: number;
  fuelUsed?: number;
  fuelType?: string;
  wasteKg?: number;
  txHash?: string;
}

export interface LifecycleTimeline {
  productId: string;
  events: LifecycleEventResult[];
  emissionsByStage: Record<string, number>;
}

export interface IssueCertificateInput {
  productId: string;
  certType: string;
  title: string;
  description?: string;
  issuerId?: string;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface CertificateResult {
  id: string;
  productId: string;
  certType: string;
  title: string;
  description?: string;
  issuerId?: string;
  issuedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  revocationReason?: string;
  ipfsHash?: string;
  status: string;
  txHash?: string;
}

export interface CertificateFilters {
  type?: string;
  status?: string;
  productId?: string;
  issuerId?: string;
  page?: number;
  limit?: number;
}

export interface VerificationResult {
  valid: boolean;
  certificate?: CertificateResult;
  message: string;
}

export interface RegisterVerifierInput {
  publicKey: string;
  name: string;
  email?: string;
  description?: string;
  stakeXlm: number;
}

export interface VerifierResult {
  id: string;
  publicKey: string;
  name: string;
  email?: string;
  description?: string;
  stakeXlm: number;
  reputationScore: number;
  status: string;
  lastHeartbeat?: Date;
}

export interface AttestationResult {
  id: string;
  productId: string;
  verifierId?: string;
  status: string;
  threshold: number;
  approvals: number;
  rejections: number;
  submittedAt: Date;
  resolvedAt?: Date;
}

export interface CarbonFootprintResult {
  id: string;
  productId: string;
  scope1: number;
  scope2: number;
  scope3: number;
  totalFootprint: number;
  confidenceScore?: number;
  methodology: string;
  boundary?: string;
  breakdown?: Record<string, unknown>;
  calculatedAt: Date;
}

export interface EmissionsBreakdown {
  productId: string;
  byStage: Record<string, number>;
  byScope: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  total: number;
  confidenceScore?: number;
}

export interface CarbonComparison {
  products: CarbonFootprintResult[];
  rankings: { productId: string; rank: number }[];
}

export interface Equivalents {
  kmDriven: number;
  treesPlanted: number;
  smartphonesCharged: number;
  homesEnergy: number;
}
