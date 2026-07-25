import mongoose, { Document, Schema } from 'mongoose';

export interface INGODocumentItem {
  url: string;
  name?: string;
  fileType?: string;
  uploadedAt?: Date;
}

export interface INGO extends Document {
  creator: mongoose.Types.ObjectId;
  name: string;
  registrationNumber: string;
  ngoType: 'Trust' | 'Society' | 'Section 8 Company' | 'Foundation' | 'Other';
  yearEstablished: number;
  panNumber: string;
  tanNumber?: string;
  gstNumber?: string;
  darpanId?: string;
  certificate12A?: string;
  certificate80G?: string;

  // Step 2: Contact Details
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

  // Step 3: Address
  location: {
    country: string;
    state: string;
    district: string;
    city: string;
    pincode: string;
    address: string;
  };

  // Step 4: Description & Categories
  mission: string;
  vision: string;
  description: string;
  categories: string[];

  // Step 5: Bank Details
  bankDetails: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    cancelledChequeUrl?: string;
  };

  // Step 6: Documents
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

  // Step 7: Authorized Representative
  representative: {
    fullName: string;
    designation: string;
    email: string;
    phone: string;
    aadhaarNumber: string;
    panNumber: string;
  };

  // Step 8: Declaration & Signature
  declaration: {
    confirmedAccuracy: boolean;
    agreedTerms: boolean;
    digitalSignatureUrl: string;
    submittedAt: Date;
  };

  // Profile Branding & Stats
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

  // Verification & Review Workflow
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'more_info_required' | 'suspended';
  adminNotes?: string;
  requestedChanges?: string[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedReason?: string;
  approvalHistory?: {
    status: string;
    timestamp: Date;
    adminId?: mongoose.Types.ObjectId;
    notes?: string;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const NGOSchema = new Schema<INGO>(
  {
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, unique: true, trim: true },
    ngoType: {
      type: String,
      enum: ['Trust', 'Society', 'Section 8 Company', 'Foundation', 'Other'],
      required: true,
    },
    yearEstablished: { type: Number, required: true },
    panNumber: { type: String, required: true, uppercase: true, trim: true },
    tanNumber: { type: String, uppercase: true, trim: true },
    gstNumber: { type: String, uppercase: true, trim: true },
    darpanId: { type: String, trim: true },
    certificate12A: { type: String, required: true, trim: true },
    certificate80G: { type: String, required: true, trim: true },

    contactDetails: {
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, required: true, trim: true },
      alternatePhone: { type: String, trim: true },
      website: { type: String, trim: true },
    },
    socialMedia: {
      facebook: { type: String, trim: true },
      instagram: { type: String, trim: true },
      linkedin: { type: String, trim: true },
      twitter: { type: String, trim: true },
    },

    location: {
      country: { type: String, default: 'India', required: true },
      state: { type: String, required: true },
      district: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      address: { type: String, required: true },
    },

    mission: { type: String, required: true },
    vision: { type: String, required: true },
    description: { type: String, required: true },
    categories: [{ type: String, required: true }],

    bankDetails: {
      accountHolderName: { type: String, required: true },
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true, uppercase: true },
      cancelledChequeUrl: { type: String },
    },

    documents: {
      registrationCertificate: { type: String, required: true },
      panCard: { type: String, required: true },
      certificate12A: { type: String, required: true },
      certificate80G: { type: String, required: true },
      addressProof: { type: String, required: true },
      representativeIdProof: { type: String, required: true },
      representativePhoto: { type: String, required: true },
      logo: { type: String, required: true },
      coverImage: { type: String, required: true },
      annualReport: { type: String },
      financialStatement: { type: String },
      fcraCertificate: { type: String },
    },

    representative: {
      fullName: { type: String, required: true },
      designation: { type: String, required: true },
      email: { type: String, required: true, lowercase: true },
      phone: { type: String, required: true },
      aadhaarNumber: { type: String, required: true },
      panNumber: { type: String, required: true, uppercase: true },
    },

    declaration: {
      confirmedAccuracy: { type: Boolean, required: true, default: false },
      agreedTerms: { type: Boolean, required: true, default: false },
      digitalSignatureUrl: { type: String, required: true },
      submittedAt: { type: Date, default: Date.now },
    },

    logo: { type: String },
    banner: { type: String },
    stats: {
      campaignCount: { type: Number, default: 0 },
      fundsRaised: { type: Number, default: 0 },
      volunteerCount: { type: Number, default: 0 },
      beneficiaryCount: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      impactScore: { type: Number, default: 0 },
    },

    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'more_info_required', 'suspended'],
      default: 'pending',
    },
    adminNotes: { type: String },
    requestedChanges: [{ type: String }],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
    approvalHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        adminId: { type: Schema.Types.ObjectId, ref: 'Admin' },
        notes: { type: String },
      },
    ],
  },
  { timestamps: true }
);

// Indexes
NGOSchema.index({ 'contactDetails.email': 1 });
NGOSchema.index({ verificationStatus: 1 });

export default mongoose.model<INGO>('NGO', NGOSchema);
