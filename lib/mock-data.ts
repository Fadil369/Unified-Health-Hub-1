export interface Coverage {
  id: string;
  insurerNameAr: string;
  insurerNameEn: string;
  policyNumber: string;
  memberId: string;
  planNameAr: string;
  planNameEn: string;
  status: 'active' | 'expired' | 'pending';
  startDate: string;
  endDate: string;
  deductibleUsed: number;
  deductibleTotal: number;
  outOfPocketUsed: number;
  outOfPocketMax: number;
  copayPercentage: number;
  networkTier: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  status: 'submitted' | 'processing' | 'approved' | 'rejected' | 'appealed';
  serviceDate: string;
  providerNameAr: string;
  providerNameEn: string;
  diagnosisAr: string;
  diagnosisEn: string;
  amountClaimed: number;
  amountApproved: number;
  submittedDate: string;
  lastUpdated: string;
  denialReason?: string;
}

export interface PriorAuth {
  id: string;
  referenceNumber: string;
  status: 'pending' | 'in_review' | 'approved' | 'denied';
  serviceTypeAr: string;
  serviceTypeEn: string;
  providerNameAr: string;
  providerNameEn: string;
  diagnosisCodeAr: string;
  diagnosisCodeEn: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  requestedDate: string;
  approvalProbability: number;
  lastUpdated: string;
}

export interface BenefitCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  used: number;
  total: number;
  icon: string;
}

export interface WalletDocument {
  id: string;
  nameAr: string;
  nameEn: string;
  category: 'lab' | 'imaging' | 'prescription' | 'referral';
  date: string;
  verified: boolean;
}

export const mockCoverage: Coverage = {
  id: 'cov-001',
  insurerNameAr: '\u0634\u0631\u0643\u0629 \u0628\u0648\u0628\u0627 \u0644\u0644\u062a\u0623\u0645\u064a\u0646',
  insurerNameEn: 'Bupa Arabia',
  policyNumber: 'POL-2024-78542',
  memberId: 'MEM-2024-001',
  planNameAr: '\u0627\u0644\u062e\u0637\u0629 \u0627\u0644\u0630\u0647\u0628\u064a\u0629',
  planNameEn: 'Gold Plan',
  status: 'active',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  deductibleUsed: 1200,
  deductibleTotal: 5000,
  outOfPocketUsed: 3500,
  outOfPocketMax: 15000,
  copayPercentage: 20,
  networkTier: 'Tier 1',
};

export const mockClaims: Claim[] = [
  {
    id: 'clm-001',
    claimNumber: 'CLM-2024-0891',
    status: 'approved',
    serviceDate: '2024-10-15',
    providerNameAr: '\u0645\u0633\u062a\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u0641\u064a\u0635\u0644 \u0627\u0644\u062a\u062e\u0635\u0635\u064a',
    providerNameEn: 'King Faisal Specialist Hospital',
    diagnosisAr: '\u0641\u062d\u0635 \u0637\u0628\u064a \u0634\u0627\u0645\u0644',
    diagnosisEn: 'Comprehensive Medical Exam',
    amountClaimed: 2500,
    amountApproved: 2000,
    submittedDate: '2024-10-16',
    lastUpdated: '2024-10-20',
  },
  {
    id: 'clm-002',
    claimNumber: 'CLM-2024-0923',
    status: 'processing',
    serviceDate: '2024-11-02',
    providerNameAr: '\u0639\u064a\u0627\u062f\u0627\u062a \u0627\u0644\u062d\u0645\u0631\u0627\u0621',
    providerNameEn: 'Al Hamra Clinics',
    diagnosisAr: '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0637\u0628 \u0639\u064a\u0648\u0646',
    diagnosisEn: 'Ophthalmology Consultation',
    amountClaimed: 800,
    amountApproved: 0,
    submittedDate: '2024-11-03',
    lastUpdated: '2024-11-05',
  },
  {
    id: 'clm-003',
    claimNumber: 'CLM-2024-0845',
    status: 'rejected',
    serviceDate: '2024-09-20',
    providerNameAr: '\u0635\u064a\u062f\u0644\u064a\u0629 \u0627\u0644\u062f\u0648\u0627\u0621',
    providerNameEn: 'Al Dawaa Pharmacy',
    diagnosisAr: '\u0623\u062f\u0648\u064a\u0629 \u0645\u0648\u0635\u0648\u0641\u0629',
    diagnosisEn: 'Prescription Medications',
    amountClaimed: 450,
    amountApproved: 0,
    submittedDate: '2024-09-21',
    lastUpdated: '2024-09-25',
    denialReason: 'Medication not on formulary',
  },
  {
    id: 'clm-004',
    claimNumber: 'CLM-2024-0967',
    status: 'submitted',
    serviceDate: '2024-11-10',
    providerNameAr: '\u0645\u0633\u062a\u0634\u0641\u0649 \u0627\u0644\u062d\u0628\u064a\u0628',
    providerNameEn: 'Al Habib Hospital',
    diagnosisAr: '\u0641\u062d\u0635 \u0645\u062e\u0628\u0631\u064a',
    diagnosisEn: 'Laboratory Tests',
    amountClaimed: 350,
    amountApproved: 0,
    submittedDate: '2024-11-11',
    lastUpdated: '2024-11-11',
  },
  {
    id: 'clm-005',
    claimNumber: 'CLM-2024-0780',
    status: 'approved',
    serviceDate: '2024-08-05',
    providerNameAr: '\u0639\u064a\u0627\u062f\u0627\u062a \u0627\u0644\u0645\u0648\u0633\u0649',
    providerNameEn: 'Al Moosa Clinics',
    diagnosisAr: '\u0627\u0633\u062a\u0634\u0627\u0631\u0629 \u0623\u0633\u0646\u0627\u0646',
    diagnosisEn: 'Dental Consultation',
    amountClaimed: 1200,
    amountApproved: 960,
    submittedDate: '2024-08-06',
    lastUpdated: '2024-08-12',
  },
];

export const mockPriorAuths: PriorAuth[] = [
  {
    id: 'pa-001',
    referenceNumber: 'PA-2024-0341',
    status: 'approved',
    serviceTypeAr: '\u062a\u0635\u0648\u064a\u0631 \u0628\u0627\u0644\u0631\u0646\u064a\u0646 \u0627\u0644\u0645\u063a\u0646\u0627\u0637\u064a\u0633\u064a',
    serviceTypeEn: 'MRI Scan',
    providerNameAr: '\u0645\u0633\u062a\u0634\u0641\u0649 \u0627\u0644\u0645\u0644\u0643 \u0641\u064a\u0635\u0644',
    providerNameEn: 'King Faisal Hospital',
    diagnosisCodeAr: 'M54.5 - \u0623\u0644\u0645 \u0623\u0633\u0641\u0644 \u0627\u0644\u0638\u0647\u0631',
    diagnosisCodeEn: 'M54.5 - Low Back Pain',
    urgency: 'routine',
    requestedDate: '2024-10-01',
    approvalProbability: 0.97,
    lastUpdated: '2024-10-03',
  },
  {
    id: 'pa-002',
    referenceNumber: 'PA-2024-0389',
    status: 'in_review',
    serviceTypeAr: '\u062c\u0631\u0627\u062d\u0629 \u0627\u0644\u0631\u0643\u0628\u0629',
    serviceTypeEn: 'Knee Surgery',
    providerNameAr: '\u0645\u0633\u062a\u0634\u0641\u0649 \u0627\u0644\u062d\u0628\u064a\u0628',
    providerNameEn: 'Al Habib Hospital',
    diagnosisCodeAr: 'M17.1 - \u062a\u0622\u0643\u0644 \u0645\u0641\u0635\u0644 \u0627\u0644\u0631\u0643\u0628\u0629',
    diagnosisCodeEn: 'M17.1 - Knee Osteoarthritis',
    urgency: 'urgent',
    requestedDate: '2024-11-05',
    approvalProbability: 0.82,
    lastUpdated: '2024-11-07',
  },
];

export const mockBenefits: BenefitCategory[] = [
  { id: 'ben-001', nameAr: '\u0637\u0628\u064a', nameEn: 'Medical', used: 8500, total: 50000, icon: 'medkit' },
  { id: 'ben-002', nameAr: '\u0623\u0633\u0646\u0627\u0646', nameEn: 'Dental', used: 1200, total: 5000, icon: 'body' },
  { id: 'ben-003', nameAr: '\u0628\u0635\u0631\u064a\u0627\u062a', nameEn: 'Vision', used: 300, total: 2000, icon: 'eye' },
  { id: 'ben-004', nameAr: '\u0635\u064a\u062f\u0644\u0629', nameEn: 'Pharmacy', used: 2100, total: 10000, icon: 'flask' },
];

export const mockDocuments: WalletDocument[] = [
  { id: 'doc-001', nameAr: '\u0646\u062a\u0627\u0626\u062c \u0641\u062d\u0635 \u0627\u0644\u062f\u0645', nameEn: 'Blood Test Results', category: 'lab', date: '2024-10-15', verified: true },
  { id: 'doc-002', nameAr: '\u0623\u0634\u0639\u0629 \u0633\u064a\u0646\u064a\u0629 \u0644\u0644\u0635\u062f\u0631', nameEn: 'Chest X-Ray', category: 'imaging', date: '2024-09-20', verified: true },
  { id: 'doc-003', nameAr: '\u0648\u0635\u0641\u0629 \u0637\u0628\u064a\u0629', nameEn: 'Prescription', category: 'prescription', date: '2024-11-02', verified: false },
  { id: 'doc-004', nameAr: '\u062e\u0637\u0627\u0628 \u0625\u062d\u0627\u0644\u0629', nameEn: 'Referral Letter', category: 'referral', date: '2024-11-10', verified: true },
];
