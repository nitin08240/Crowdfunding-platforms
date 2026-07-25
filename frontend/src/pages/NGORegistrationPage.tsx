import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft, Upload,
  UserCheck, CreditCard, Sparkles, AlertCircle,
  Clock, Check, X, MapPin, Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import type { NGOItem } from '../types';
import { NGO_CATEGORIES } from '../types';

const STEPS = [
  { id: 1, title: 'Org Details', icon: Building2, desc: 'Registration & Tax Details' },
  { id: 2, title: 'Contact', icon: Globe, desc: 'Official Email & Social Links' },
  { id: 3, title: 'Address', icon: MapPin, desc: 'Registered Address' },
  { id: 4, title: 'Description', icon: Sparkles, desc: 'Mission, Vision & Causes' },
  { id: 5, title: 'Bank Details', icon: CreditCard, desc: 'Disbursement Bank Account' },
  { id: 6, title: 'Documents', icon: Upload, desc: 'Registration & Tax Uploads' },
  { id: 7, title: 'Representative', icon: UserCheck, desc: 'Authorized Signatory Details' },
  { id: 8, title: 'Declaration', icon: CheckCircle2, desc: 'Signature & Submission' },
];

const INITIAL_FORM = {
  // Step 1: Org
  name: '',
  registrationNumber: '',
  ngoType: 'Trust',
  yearEstablished: new Date().getFullYear() - 5,
  panNumber: '',
  tanNumber: '',
  gstNumber: '',
  darpanId: '',
  certificate12A: '',
  certificate80G: '',

  // Step 2: Contact
  officialEmail: '',
  phone: '',
  alternatePhone: '',
  website: '',
  facebook: '',
  instagram: '',
  linkedin: '',

  // Step 3: Address
  country: 'India',
  state: '',
  district: '',
  city: '',
  pincode: '',
  address: '',

  // Step 4: Description
  mission: '',
  vision: '',
  description: '',
  categories: [] as string[],

  // Step 5: Bank
  accountHolderName: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',

  // Step 7: Representative
  repFullName: '',
  repDesignation: '',
  repEmail: '',
  repPhone: '',
  repAadhaar: '',
  repPan: '',

  // Step 8: Declaration
  confirmedAccuracy: false,
  agreedTerms: false,
  digitalSignature: '',
};

const DOC_KEYS = [
  { key: 'registrationCertificate', label: 'NGO Registration Certificate', required: true, desc: 'Trust Deed / Society Cert / Sec 8 Cert (PDF/JPG)' },
  { key: 'panCard', label: 'NGO PAN Card', required: true, desc: 'Official Organization PAN (PDF/JPG)' },
  { key: 'certificate12A', label: '12A Certificate', required: true, desc: 'Income Tax 12A Registration (PDF/JPG)' },
  { key: 'certificate80G', label: '80G Certificate', required: true, desc: 'Tax Exemption Certificate (PDF/JPG)' },
  { key: 'addressProof', label: 'Address Proof of NGO', required: true, desc: 'Electricity Bill / Rent Agreement / Utility Bill' },
  { key: 'representativeIdProof', label: 'Authorized Signatory ID Proof', required: true, desc: 'Aadhaar / Passport / Driving License' },
  { key: 'representativePhoto', label: 'Authorized Signatory Photo', required: true, desc: 'Passport size photo (JPG/PNG)' },
  { key: 'logo', label: 'NGO Official Logo', required: true, desc: 'Square transparent/white logo (PNG/JPG)' },
  { key: 'coverImage', label: 'NGO Cover Banner', required: true, desc: 'High quality banner image for profile (JPG/PNG)' },
  { key: 'cancelledChequeUrl', label: 'Cancelled Cheque (Optional)', required: false, desc: 'Bank account verification cheque' },
  { key: 'annualReport', label: 'Annual Report (Optional)', required: false, desc: 'Latest Audited Annual Report (PDF)' },
  { key: 'financialStatement', label: 'Financial Statement (Optional)', required: false, desc: 'Audited Financials / Balance Sheet (PDF)' },
  { key: 'fcraCertificate', label: 'FCRA Certificate (Optional)', required: false, desc: 'Foreign Contribution Regulation Cert (PDF)' },
];

const NGORegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [files, setFiles] = useState<{ [key: string]: File }>({});
  const [existingNGO, setExistingNGO] = useState<NGOItem | null>(null);
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Signature Canvas state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    fetchExistingNGO();
  }, []);

  const fetchExistingNGO = async () => {
    try {
      setFetchingStatus(true);
      const { data } = await api.get('/ngos/user/my-ngo');
      if (data.data) {
        setExistingNGO(data.data);
      }
    } catch {
      // ignore
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCategoryToggle = (catId: string) => {
    setFormData(prev => {
      const exists = prev.categories.includes(catId);
      if (exists) {
        return { ...prev, categories: prev.categories.filter(c => c !== catId) };
      } else {
        return { ...prev, categories: [...prev.categories, catId] };
      }
    });
  };

  const handleFileDrop = (key: string, selectedFile: File | null) => {
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB maximum limit.');
      return;
    }
    setFiles(prev => ({ ...prev, [key]: selectedFile }));
    toast.success(`Uploaded ${selectedFile.name}`);
  };

  // Canvas drawing functions for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#A66A00';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (isDrawing && canvasRef.current) {
      setIsDrawing(false);
      const dataUrl = canvasRef.current.toDataURL();
      setFormData(prev => ({ ...prev, digitalSignature: dataUrl }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setFormData(prev => ({ ...prev, digitalSignature: '' }));
    }
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!formData.name.trim()) { toast.error('NGO Name is required'); return false; }
      if (!formData.registrationNumber.trim()) { toast.error('Registration Number is required'); return false; }
      if (!formData.panNumber.trim() || formData.panNumber.length !== 10) { toast.error('Valid 10-character PAN Number is required'); return false; }
      if (!formData.certificate12A.trim()) { toast.error('12A Certificate Number is required'); return false; }
      if (!formData.certificate80G.trim()) { toast.error('80G Certificate Number is required'); return false; }
    }
    if (step === 2) {
      if (!formData.officialEmail.trim() || !formData.officialEmail.includes('@')) { toast.error('Valid Official Email is required'); return false; }
      if (!formData.phone.trim() || formData.phone.length < 10) { toast.error('Valid Mobile Number is required'); return false; }
    }
    if (step === 3) {
      if (!formData.state.trim() || !formData.district.trim() || !formData.city.trim() || !formData.pincode.trim() || !formData.address.trim()) {
        toast.error('Please complete all address fields.');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.mission.trim()) { toast.error('Mission statement is required'); return false; }
      if (!formData.vision.trim()) { toast.error('Vision statement is required'); return false; }
      if (!formData.description.trim()) { toast.error('About NGO description is required'); return false; }
      if (formData.categories.length === 0) { toast.error('Select at least one cause category'); return false; }
    }
    if (step === 5) {
      if (!formData.accountHolderName.trim() || !formData.bankName.trim() || !formData.accountNumber.trim() || !formData.ifscCode.trim()) {
        toast.error('Complete all Bank Details to enable disbursement.');
        return false;
      }
    }
    if (step === 6) {
      const missing = DOC_KEYS.filter(d => d.required && !files[d.key]);
      if (missing.length > 0) {
        toast.error(`Please upload required document: ${missing[0].label}`);
        return false;
      }
    }
    if (step === 7) {
      if (!formData.repFullName.trim() || !formData.repDesignation.trim() || !formData.repEmail.trim() || !formData.repPhone.trim() || !formData.repAadhaar.trim() || !formData.repPan.trim()) {
        toast.error('Complete all Representative Details.');
        return false;
      }
    }
    if (step === 8) {
      if (!formData.confirmedAccuracy) { toast.error('Confirm accuracy checkbox is required'); return false; }
      if (!formData.agreedTerms) { toast.error('Agree to Terms & Conditions checkbox is required'); return false; }
      if (!hasSignature && !formData.digitalSignature) { toast.error('Please provide digital signature'); return false; }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 8));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(8)) return;

    try {
      setSubmitting(true);
      const formPayload = new FormData();

      const payloadData = {
        name: formData.name,
        registrationNumber: formData.registrationNumber,
        ngoType: formData.ngoType,
        yearEstablished: Number(formData.yearEstablished),
        panNumber: formData.panNumber.toUpperCase(),
        tanNumber: formData.tanNumber?.toUpperCase(),
        gstNumber: formData.gstNumber?.toUpperCase(),
        darpanId: formData.darpanId,
        certificate12A: formData.certificate12A,
        certificate80G: formData.certificate80G,
        contactDetails: {
          email: formData.officialEmail,
          phone: formData.phone,
          alternatePhone: formData.alternatePhone,
          website: formData.website,
        },
        socialMedia: {
          facebook: formData.facebook,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
        },
        location: {
          country: formData.country,
          state: formData.state,
          district: formData.district,
          city: formData.city,
          pincode: formData.pincode,
          address: formData.address,
        },
        mission: formData.mission,
        vision: formData.vision,
        description: formData.description,
        categories: formData.categories,
        bankDetails: {
          accountHolderName: formData.accountHolderName,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode.toUpperCase(),
        },
        representative: {
          fullName: formData.repFullName,
          designation: formData.repDesignation,
          email: formData.repEmail,
          phone: formData.repPhone,
          aadhaarNumber: formData.repAadhaar,
          panNumber: formData.repPan.toUpperCase(),
        },
        declaration: {
          confirmedAccuracy: formData.confirmedAccuracy,
          agreedTerms: formData.agreedTerms,
          digitalSignatureUrl: formData.digitalSignature || 'Digital Signature Signed',
          submittedAt: new Date(),
        },
      };

      formPayload.append('payload', JSON.stringify(payloadData));

      // Append documents
      Object.entries(files).forEach(([key, file]) => {
        formPayload.append(key, file);
      });

      if (existingNGO && (existingNGO.verificationStatus === 'more_info_required' || existingNGO.verificationStatus === 'rejected')) {
        await api.put(`/ngos/${existingNGO._id}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('NGO Application updated and resubmitted successfully!');
      } else {
        await api.post('/ngos/register', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('NGO Application submitted successfully!');
      }

      await fetchExistingNGO();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit NGO application.');
    } finally {
      setSubmitting(false);
    }
  };

  if (fetchingStatus) {
    return (
      <div className="min-h-screen pt-32 flex justify-center items-start bg-gray-50 dark:bg-[#0B0F19]">
        <div className="w-10 h-10 border-4 border-[#A66A00] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If NGO Application already submitted
  if (existingNGO && existingNGO.verificationStatus !== 'more_info_required') {
    const isApproved = existingNGO.verificationStatus === 'verified';
    const isPending = existingNGO.verificationStatus === 'pending';
    const isRejected = existingNGO.verificationStatus === 'rejected';

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] pt-28 pb-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#111827] border border-[#EAEAEA] dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl text-center relative overflow-hidden"
          >
            {isApproved && (
              <>
                <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 uppercase tracking-wider">
                  Verified & Active NGO
                </span>
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mt-4">
                  Welcome, {existingNGO.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-lg mx-auto text-sm leading-relaxed">
                  Your NGO application is verified. Your profile is live in the public directory and you can start raising funds.
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => navigate('/create-campaign')}
                    className="px-6 py-3 bg-gradient-to-r from-[#A66A00] to-[#D89A2B] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all"
                  >
                    Start a Fundraiser Campaign
                  </button>
                  <button
                    onClick={() => navigate(`/ngos/${existingNGO._id}`)}
                    className="px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-semibold rounded-2xl hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                  >
                    View Public NGO Profile
                  </button>
                </div>
              </>
            )}

            {isPending && (
              <>
                <div className="w-20 h-20 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                  Pending Verification
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-4">
                  Application Under Review
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-3 max-w-lg mx-auto text-sm leading-relaxed">
                  Thank you for registering <strong>{existingNGO.name}</strong>. Our compliance team is verifying your registration documents.
                </p>
                
                <div className="mt-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-2xl p-5 text-left max-w-md mx-auto">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" /> Verification Timeline
                  </h4>
                  <ul className="text-xs text-amber-800 dark:text-amber-400 mt-2 space-y-1.5 list-disc list-inside">
                    <li>Document Verification: <strong>24–72 hours</strong></li>
                    <li>Official Email: <strong>{existingNGO.contactDetails.email}</strong></li>
                    <li>Reg No: <strong>{existingNGO.registrationNumber}</strong></li>
                  </ul>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 bg-[#A66A00] text-white font-bold rounded-xl hover:bg-[#8A5700] transition-colors"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </>
            )}

            {isRejected && (
              <>
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <X className="w-10 h-10" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 uppercase tracking-wider">
                  Application Not Approved
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mt-4">
                  Registration Review Result
                </h1>
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-4 text-left max-w-lg mx-auto">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">Reason for Rejection:</p>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-1">{existingNGO.rejectedReason || existingNGO.adminNotes || 'Document verification could not be completed.'}</p>
                </div>
                <div className="mt-8 flex justify-center gap-4">
                  <button
                    onClick={() => setExistingNGO({ ...existingNGO, verificationStatus: 'more_info_required' })}
                    className="px-6 py-3 bg-[#A66A00] text-white font-bold rounded-xl hover:bg-[#8A5700] transition-colors"
                  >
                    Resubmit Corrected Details
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] pt-24 pb-24 px-4 transition-colors">
      <div className="max-w-6xl mx-auto">

        {/* HERO HEADER */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-primary-500/10 text-[#A66A00] dark:text-[#FB923C] border border-[#A66A00]/20 uppercase tracking-widest">
            <Building2 className="w-3.5 h-3.5" /> Partner Onboarding Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mt-3">
            Register Your Non-Profit Organization
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm max-w-2xl mx-auto mt-2">
            Join India's most trusted crowdfunding ecosystem. Raise zero-commission funds, manage donor updates, and access institutional partner grants.
          </p>
        </div>

        {/* STEPPER NAVIGATION */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAEAEA] dark:border-white/10 rounded-2xl p-4 mb-8 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[760px] px-2">
            {STEPS.map((step) => {
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => { if (isCompleted) setCurrentStep(step.id); }}
                    disabled={!isCompleted && !isCurrent}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-[#A66A00] text-white shadow-md'
                        : isCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 cursor-pointer'
                        : 'text-gray-400 dark:text-gray-600 opacity-60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isCurrent ? 'bg-white/20 text-white' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-bold leading-tight">{step.title}</p>
                    </div>
                  </button>
                  {step.id < 8 && (
                    <div className={`w-6 sm:w-10 h-0.5 mx-1.5 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-white/10'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION REQUIRED BANNER (FOR RESUBMIT) */}
        {existingNGO && existingNGO.verificationStatus === 'more_info_required' && (
          <div className="mb-8 p-5 bg-sky-50 dark:bg-sky-950/30 border border-sky-300 dark:border-sky-800 rounded-2xl text-sky-900 dark:text-sky-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Verification Action Required:</p>
              <p className="text-xs mt-1 leading-relaxed">{existingNGO.adminNotes || 'Please update missing documents/information as requested by compliance.'}</p>
            </div>
          </div>
        )}

        {/* FORM CONTAINER */}
        <div className="bg-white dark:bg-[#111827] border border-[#EAEAEA] dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xl relative">
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* STEP 1: ORGANIZATION DETAILS */}
              {currentStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-[#A66A00]" /> Step 1 — Organization Legal Details
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide registered non-profit legal entity details as printed on registration deed.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Official NGO Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Smile Foundation India"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Registration Number *</label>
                      <input
                        type="text"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleChange}
                        placeholder="e.g. Reg-2018/14829"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">NGO Entity Type *</label>
                      <select
                        name="ngoType"
                        value={formData.ngoType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      >
                        <option value="Trust">Trust</option>
                        <option value="Society">Society</option>
                        <option value="Section 8 Company">Section 8 Company</option>
                        <option value="Foundation">Foundation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Year Established *</label>
                      <input
                        type="number"
                        name="yearEstablished"
                        value={formData.yearEstablished}
                        onChange={handleChange}
                        min={1900}
                        max={new Date().getFullYear()}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">NGO PAN Number *</label>
                      <input
                        type="text"
                        name="panNumber"
                        maxLength={10}
                        value={formData.panNumber}
                        onChange={handleChange}
                        placeholder="ABCDE1234F"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white uppercase outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">TAN Number (Optional)</label>
                      <input
                        type="text"
                        name="tanNumber"
                        maxLength={10}
                        value={formData.tanNumber}
                        onChange={handleChange}
                        placeholder="ABCD12345E"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white uppercase outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">GST Number (Optional)</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="22AAAAA0000A1Z5"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white uppercase outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">NITI Aayog DARPAN ID (Optional)</label>
                      <input
                        type="text"
                        name="darpanId"
                        value={formData.darpanId}
                        onChange={handleChange}
                        placeholder="e.g. DL/2019/0219482"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">12A Registration Number *</label>
                      <input
                        type="text"
                        name="certificate12A"
                        value={formData.certificate12A}
                        onChange={handleChange}
                        placeholder="e.g. AAAT12345E12A1"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">80G Registration Number *</label>
                      <input
                        type="text"
                        name="certificate80G"
                        value={formData.certificate80G}
                        onChange={handleChange}
                        placeholder="e.g. AAAT12345E80G2"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CONTACT DETAILS */}
              {currentStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-5 h-5 text-[#A66A00]" /> Step 2 — Official Contact & Media
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Official communication channels for donor queries and verification.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Official Organization Email *</label>
                      <input
                        type="email"
                        name="officialEmail"
                        value={formData.officialEmail}
                        onChange={handleChange}
                        placeholder="contact@ngodomain.org"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Official Phone / Helpline *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Alternate Mobile / Phone</label>
                      <input
                        type="tel"
                        name="alternatePhone"
                        value={formData.alternatePhone}
                        onChange={handleChange}
                        placeholder="Optional alternate number"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Official Website URL</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.ngodomain.org"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Facebook Profile</label>
                      <input
                        type="url"
                        name="facebook"
                        value={formData.facebook}
                        onChange={handleChange}
                        placeholder="https://facebook.com/ngo"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Instagram Handle</label>
                      <input
                        type="text"
                        name="instagram"
                        value={formData.instagram}
                        onChange={handleChange}
                        placeholder="https://instagram.com/ngo"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: ADDRESS */}
              {currentStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#A66A00]" /> Step 3 — Registered Address
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Physical registered headquarters location of the NGO.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Country *</label>
                      <input
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none"
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">District *</label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        placeholder="e.g. Mumbai Suburban"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">City / Town *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g. Mumbai"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="400001"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Complete Registered Street Address *</label>
                      <textarea
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Door / Plot / Street Address..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: DESCRIPTION & CAUSES */}
              {currentStep === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#A66A00]" /> Step 4 — Mission, Vision & Cause Categories
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select causes your NGO serves and outline your core mission statement.</p>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Mission Statement *</label>
                      <textarea
                        name="mission"
                        rows={2}
                        value={formData.mission}
                        onChange={handleChange}
                        placeholder="What is your core mission?"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Vision Statement *</label>
                      <textarea
                        name="vision"
                        rows={2}
                        value={formData.vision}
                        onChange={handleChange}
                        placeholder="What long term impact do you aim to achieve?"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">About NGO (Detailed Narrative) *</label>
                      <textarea
                        name="description"
                        rows={4}
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Describe key projects, beneficiaries, annual impact..."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Select Active Cause Categories *</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {NGO_CATEGORIES.map((cat) => {
                          const selected = formData.categories.includes(cat.id);
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => handleCategoryToggle(cat.id)}
                              className={`p-3 rounded-xl border flex items-center gap-2 text-left transition-all ${
                                selected
                                  ? 'border-[#A66A00] bg-[#A66A00]/10 text-[#A66A00] dark:text-[#FB923C] font-bold'
                                  : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-lg">{cat.icon}</span>
                              <span className="text-xs">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 5: BANK DETAILS */}
              {currentStep === 5 && (
                <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-[#A66A00]" /> Step 5 — NGO Disbursement Bank Account
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Bank account MUST be in the exact legal name of the registered NGO.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Account Holder Name *</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        placeholder="Must match NGO PAN name"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        placeholder="e.g. State Bank of India"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Bank Account Number *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="Enter full account number"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">IFSC Code *</label>
                      <input
                        type="text"
                        name="ifscCode"
                        maxLength={11}
                        value={formData.ifscCode}
                        onChange={handleChange}
                        placeholder="SBIN0001234"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white uppercase outline-none focus:border-[#A66A00]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 6: DOCUMENT UPLOAD */}
              {currentStep === 6 && (
                <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Upload className="w-5 h-5 text-[#A66A00]" /> Step 6 — Document Uploads (PDF / JPG / PNG max 10MB)
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upload clear scanned copies for compliance verification.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DOC_KEYS.map((doc) => {
                      const uploaded = files[doc.key];
                      return (
                        <div
                          key={doc.key}
                          className={`p-4 rounded-2xl border transition-all ${
                            uploaded
                              ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                              : doc.required
                              ? 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5'
                              : 'border-dashed border-gray-200 dark:border-white/10 bg-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                {doc.label} {doc.required && <span className="text-red-500">*</span>}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{doc.desc}</p>
                            </div>
                            {uploaded && (
                              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-white/10 border border-gray-300 dark:border-white/15 text-xs font-semibold text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 transition-colors">
                              <Upload className="w-3.5 h-3.5 text-[#A66A00]" />
                              {uploaded ? 'Change File' : 'Browse File'}
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.webp"
                                className="hidden"
                                onChange={(e) => handleFileDrop(doc.key, e.target.files?.[0] || null)}
                              />
                            </label>
                            {uploaded && (
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 truncate">
                                Selected: {uploaded.name} ({(uploaded.size / (1024 * 1024)).toFixed(2)} MB)
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* STEP 7: AUTHORIZED REPRESENTATIVE */}
              {currentStep === 7 && (
                <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-[#A66A00]" /> Step 7 — Authorized Representative Details
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Official Trustee / Director / President authorized to act on behalf of the NGO.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Full Name *</label>
                      <input
                        type="text"
                        name="repFullName"
                        value={formData.repFullName}
                        onChange={handleChange}
                        placeholder="Representative full legal name"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Designation *</label>
                      <input
                        type="text"
                        name="repDesignation"
                        value={formData.repDesignation}
                        onChange={handleChange}
                        placeholder="e.g. Managing Trustee / Executive Director"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Representative Email *</label>
                      <input
                        type="email"
                        name="repEmail"
                        value={formData.repEmail}
                        onChange={handleChange}
                        placeholder="rep@ngodomain.org"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Mobile Number *</label>
                      <input
                        type="tel"
                        name="repPhone"
                        value={formData.repPhone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Representative Aadhaar Number *</label>
                      <input
                        type="text"
                        name="repAadhaar"
                        maxLength={12}
                        value={formData.repAadhaar}
                        onChange={handleChange}
                        placeholder="12 digit Aadhaar Number"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-[#A66A00]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Representative PAN Number *</label>
                      <input
                        type="text"
                        name="repPan"
                        maxLength={10}
                        value={formData.repPan}
                        onChange={handleChange}
                        placeholder="Individual PAN"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white uppercase outline-none focus:border-[#A66A00]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 8: DECLARATION & DIGITAL SIGNATURE */}
              {currentStep === 8 && (
                <motion.div key="step8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[#A66A00]" /> Step 8 — Declaration & Digital Signature
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Review your statements and authorize submission.</p>
                  </div>

                  <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="confirmedAccuracy"
                        checked={formData.confirmedAccuracy}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-[#A66A00] rounded focus:ring-[#A66A00]"
                      />
                      <span className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                        I confirm that all information provided in this registration form is true, legal, and accurate to the best of our knowledge.
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="agreedTerms"
                        checked={formData.agreedTerms}
                        onChange={handleChange}
                        className="mt-1 w-4 h-4 text-[#A66A00] rounded focus:ring-[#A66A00]"
                      />
                      <span className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-semibold">
                        I agree to the CrowdFund Non-Profit Partner Terms & Conditions and Code of Ethics.
                      </span>
                    </label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">Digital Signature *</label>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-500 hover:text-red-600 font-semibold"
                      >
                        Clear Signature
                      </button>
                    </div>
                    <div className="border border-gray-300 dark:border-white/20 rounded-2xl bg-white overflow-hidden shadow-inner touch-none">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-40 cursor-crosshair"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">Sign inside the box using your mouse, trackpad, or touch screen.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* BUTTON BAR */}
            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-white/10 flex items-center justify-between gap-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-200 font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-2 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
              ) : <div />}

              {currentStep < 8 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-[#A66A00] hover:bg-[#8A5700] text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#A66A00] to-[#D89A2B] hover:opacity-95 text-white font-bold text-sm shadow-xl flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default NGORegistrationPage;
