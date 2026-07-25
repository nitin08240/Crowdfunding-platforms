export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  isEmailVerified: boolean;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  isSuspended?: boolean;
  createdAt?: string;
}

export interface CampaignDocument {
  url: string;
  label: 'aadhaar' | 'pan' | 'medical_report' | 'hospital_bill' | 'identity_proof' | 'other';
  uploadedAt: string;
}

export interface Campaign {
  _id: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  goalAmount: number;
  raisedAmount: number;
  availableBalance: number;
  creator: { _id: string; name: string; avatar?: string; email?: string; phone?: string };
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'completed' | 'rejected' | 'archived' | 'suspended';
  category: string;
  images: string[];
  videoUrl?: string;
  deadline: string;
  location?: string;
  tags: string[];
  donorCount: number;
  viewCount: number;
  shareCount: number;
  documents: CampaignDocument[];
  verified: boolean;
  approvedBy?: { email: string };
  approvedAt?: string;
  rejectedReason?: string;
  flaggedForReview: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  _id: string;
  donor: { _id?: string; name: string; avatar?: string };
  campaign: { _id: string; title: string; slug: string; images: string[] };
  amount: number;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  isAnonymous: boolean;
  message?: string;
  createdAt: string;
}

export interface CampaignUpdate {
  _id: string;
  campaign: string;
  author: { _id: string; name: string; avatar?: string };
  title: string;
  content: string;
  images?: string[];
  createdAt: string;
}

export interface WithdrawalRequest {
  _id: string;
  campaign: { _id: string; title: string; slug?: string; images?: string[] };
  creator: { _id: string; name: string; email?: string; phone?: string };
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  bankDetails: {
    accountHolder: string;
    accountNumber: string;
    ifsc: string;
    bankName?: string;
  };
  transactionDetails?: {
    transactionId: string;
    utrNumber: string;
    transferDate: string;
  };
  adminNotes?: string;
  reviewedBy?: { _id: string; email: string };
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  _id: string;
  adminId: { _id: string; email: string };
  action: string;
  targetType: 'campaign' | 'user' | 'withdrawal' | 'platform';
  campaignId?: { _id: string; title: string };
  userId?: { _id: string; name: string; email: string };
  details?: Record<string, any>;
  timestamp: string;
  ip?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

export const CATEGORIES = [
  { value: 'education', label: 'Education', emoji: '📚' },
  { value: 'medical', label: 'Medical', emoji: '🏥' },
  { value: 'environment', label: 'Environment', emoji: '🌱' },
  { value: 'community', label: 'Community', emoji: '🤝' },
  { value: 'technology', label: 'Technology', emoji: '💻' },
  { value: 'arts', label: 'Arts & Culture', emoji: '🎨' },
  { value: 'animals', label: 'Animals', emoji: '🐾' },
  { value: 'disaster_relief', label: 'Disaster Relief', emoji: '🆘' },
  { value: 'other', label: 'Other', emoji: '✨' },
] as const;

export const DOCUMENT_LABELS = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'pan', label: 'PAN Card' },
  { value: 'medical_report', label: 'Medical Report' },
  { value: 'hospital_bill', label: 'Hospital Bill' },
  { value: 'identity_proof', label: 'Identity Proof' },
  { value: 'other', label: 'Other Document' },
] as const;

export interface NGOItem {
  _id: string;
  creator: { _id: string; name: string; avatar?: string; email?: string };
  name: string;
  registrationNumber: string;
  ngoType: 'Trust' | 'Society' | 'Section 8 Company' | 'Foundation' | 'Other';
  yearEstablished: number;
  panNumber: string;
  tanNumber?: string;
  gstNumber?: string;
  darpanId?: string;
  certificate12A: string;
  certificate80G: string;
  contactDetails: {
    email: string;
    phone: string;
    alternatePhone?: string;
    website?: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  location: {
    country: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
  };
  mission: string;
  vision: string;
  description: string;
  categories: string[];
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    cancelledChequeUrl?: string;
  };
  documents: {
    registrationCertificate: string;
    panCard: string;
    certificate12A: string;
    certificate80G: string;
    addressProof: string;
    representativeIdProof: string;
    representativePhoto: string;
    logo: string;
    coverImage: string;
    annualReport?: string;
    financialStatement?: string;
    fcraCertificate?: string;
  };
  representative: {
    fullName: string;
    designation: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    panNumber: string;
  };
  declaration: {
    confirmedAccuracy: boolean;
    agreedTerms: boolean;
    digitalSignatureUrl: string;
    submittedAt: string;
  };
  logo?: string;
  banner?: string;
  stats: {
    campaignCount: number;
    fundsRaised: number;
    volunteerCount: number;
    beneficiaryCount: number;
    rating: number;
    impactScore: number;
  };
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_required' | 'suspended';
  adminNotes?: string;
  requestedChanges?: string[];
  approvedBy?: { _id: string; email: string; name?: string };
  approvedAt?: string;
  rejectedReason?: string;
  approvalHistory?: {
    status: string;
    timestamp: string;
    adminId?: string;
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const NGO_CATEGORIES = [
  { id: 'Education', label: 'Education', icon: '📚' },
  { id: 'Healthcare', label: 'Healthcare', icon: '🏥' },
  { id: 'Animal Welfare', label: 'Animal Welfare', icon: '🐾' },
  { id: 'Women Empowerment', label: 'Women Empowerment', icon: '👩' },
  { id: 'Child Welfare', label: 'Child Welfare', icon: '👶' },
  { id: 'Environment', label: 'Environment', icon: '🌱' },
  { id: 'Disaster Relief', label: 'Disaster Relief', icon: '🆘' },
  { id: 'Food Distribution', label: 'Food Distribution', icon: '🍲' },
  { id: 'Rural Development', label: 'Rural Development', icon: '🏡' },
  { id: 'Elderly Support', label: 'Elderly Support', icon: '👴' },
  { id: 'Skill Development', label: 'Skill Development', icon: '🛠️' },
  { id: 'Others', label: 'Others', icon: '✨' },
] as const;

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: 'Draft', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
  pending_review: { label: 'Pending Review', color: 'text-yellow-300', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  active: { label: 'Active', color: 'text-green-300', bg: 'bg-green-500/20', border: 'border-green-500/30' },
  paused: { label: 'Paused', color: 'text-blue-300', bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  completed: { label: 'Completed', color: 'text-violet-300', bg: 'bg-violet-500/20', border: 'border-violet-500/30' },
  rejected: { label: 'Rejected', color: 'text-red-300', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  archived: { label: 'Archived', color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
  suspended: { label: 'Suspended', color: 'text-orange-300', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  pending: { label: 'Pending Verification', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  verified: { label: 'Verified & Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  more_info_required: { label: 'Action Required', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/30' },
};
