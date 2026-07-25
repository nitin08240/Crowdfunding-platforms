import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Sparkles, FileText, Upload, Trash2, ShieldCheck } from 'lucide-react';
import { campaignService } from '../services/campaign.service';
import toast from 'react-hot-toast';
import { CATEGORIES, DOCUMENT_LABELS } from '../types';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
  story: z.string().min(50, 'Story must be at least 50 characters'),
  goalAmount: z.string().min(1, 'Amount required').refine(val => !isNaN(Number(val)) && Number(val) >= 1000, 'Minimum goal is ₹1,000'),
  category: z.string().min(1, 'Please select a category'),
  deadline: z.string().min(1, 'Deadline is required'),
  location: z.string().optional(),
  tags: z.string().optional(),
  videoUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface FileWithLabel {
  file: File;
  label: string;
  previewUrl: string;
}

const STEPS = [
  { id: 1, title: 'Basic Info', subtitle: 'Title & goal' },
  { id: 2, title: 'Story', subtitle: 'Details & media' },
  { id: 3, title: 'Verification', subtitle: 'Upload KYC' },
  { id: 4, title: 'Review', subtitle: 'Launch campaign' },
];

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState<FileWithLabel[]>([]);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  });

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['title', 'description', 'goalAmount', 'deadline', 'category', 'location', 'tags'];
    if (step === 2) fieldsToValidate = ['story', 'videoUrl'];
    
    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate as any);
      if (!isStepValid) return;
    }
    
    if (step === 3 && documents.length === 0) {
      toast.error('Please upload at least one verification document');
      return;
    }

    setStep((s) => Math.min(s + 1, 4));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newDocs: FileWithLabel[] = Array.from(files).map((file) => ({
      file,
      label: 'other', // Default label
      previewUrl: URL.createObjectURL(file),
    }));

    setDocuments((prev) => [...prev, ...newDocs]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDocumentLabel = (index: number, label: string) => {
    setDocuments((prev) => prev.map((doc, i) => (i === index ? { ...doc, label } : doc)));
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // 1. Create the campaign
      const payload = {
        ...data,
        goalAmount: Number(data.goalAmount),
        tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        images: [], // Images handled later or could add step for campaign images
      };
      
      const campaign = await campaignService.createJson(payload);

      // 2. Upload verification documents if any
      if (documents.length > 0) {
        const docFormData = new FormData();
        const labels = documents.map(d => d.label).join(',');
        docFormData.append('labels', labels);
        documents.forEach((d) => docFormData.append('documents', d.file));
        
        await campaignService.uploadDocuments(campaign._id, docFormData);
      }

      toast.success('Campaign submitted for review!');
      navigate(`/dashboard/campaigns`); // Redirect to dashboard to see pending status
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container-app max-w-3xl">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 badge-purple mb-4 py-2 px-4">
              <Sparkles className="w-4 h-4" /> Create Campaign
            </div>
            <h1 className="font-display font-black text-4xl text-white mb-3">Launch Your Campaign</h1>
            <p className="text-gray-500">Follow the steps below to set up your fundraiser.</p>
          </motion.div>
        </div>

        {/* Stepper */}
        <div className="mb-10 overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex items-center justify-between min-w-[600px] px-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className={`flex flex-col items-center gap-2 relative z-10 w-32 ${step >= s.id ? 'text-violet-400' : 'text-gray-600'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    step === s.id ? 'bg-violet-600 text-white ring-4 ring-violet-500/20' : step > s.id ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-gray-600'
                  }`}>
                    {step > s.id ? '✓' : s.id}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-bold ${step >= s.id ? 'text-white' : 'text-gray-500'}`}>{s.title}</p>
                    <p className="text-xs text-gray-500">{s.subtitle}</p>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-1 bg-white/5 rounded-full mx-[-20px] relative z-0">
                    <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 bg-violet-500`} style={{ width: step > i + 1 ? '100%' : '0%' }} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="glass rounded-2xl p-6 md:p-8 relative overflow-hidden min-h-[400px]">
            <AnimatePresence mode="wait">
              
              {/* STEP 1: Basic Info */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Campaign Title *</label>
                    <input {...register('title')} className="input" placeholder="E.g., Help Ravi get a heart surgery" />
                    {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Short Description *</label>
                    <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Briefly describe your campaign (max 500 characters)" maxLength={500} />
                    <p className="text-xs text-gray-500 mt-1 text-right">{watch('description')?.length || 0}/500</p>
                    {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Goal Amount (₹) *</label>
                      <input {...register('goalAmount')} type="number" className="input" placeholder="50000" min={1000} />
                      {errors.goalAmount && <p className="text-red-400 text-xs mt-1">{errors.goalAmount.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Deadline *</label>
                      <input {...register('deadline')} type="date" className="input" min={minDateStr} />
                      {errors.deadline && <p className="text-red-400 text-xs mt-1">{errors.deadline.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {CATEGORIES.map(({ value, label, emoji }) => (
                        <label
                          key={value}
                          className={`cursor-pointer p-4 rounded-xl border text-center transition-all duration-200 ${
                            watch('category') === value ? 'border-violet-500 bg-violet-500/15' : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                        >
                          <input {...register('category')} type="radio" value={value} className="hidden" />
                          <div className="text-2xl mb-2">{emoji}</div>
                          <p className="text-sm font-medium text-white">{label}</p>
                        </label>
                      ))}
                    </div>
                    {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Location (optional)</label>
                      <input {...register('location')} className="input" placeholder="Mumbai, India" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Tags (optional)</label>
                      <input {...register('tags')} className="input" placeholder="health, urgent, children" />
                      <p className="text-xs text-gray-500 mt-1">Comma separated</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Story & Details */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Campaign Story *</label>
                    <p className="text-xs text-gray-500 mb-3">Tell donors why this campaign matters. Be specific, emotional, and transparent.</p>
                    <textarea {...register('story')} rows={15} className="input resize-y min-h-[200px]" placeholder="Describe your campaign in detail. Explain the problem, why you're raising funds, how the money will be used, and what impact it will create..." />
                    {errors.story && <p className="text-red-400 text-xs mt-1">{errors.story.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">YouTube Video URL (optional)</label>
                    <input {...register('videoUrl')} className="input" placeholder="https://youtube.com/watch?v=..." />
                    {errors.videoUrl && <p className="text-red-400 text-xs mt-1">{errors.videoUrl.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">A video can increase your funding chances by up to 50%.</p>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Verification */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-violet-300 mb-1">Trust & Verification</h3>
                      <p className="text-xs text-violet-400/80 leading-relaxed">
                        To ensure the safety of our donors, all campaigns must be verified. Please upload relevant documents (e.g., Aadhaar card, Medical bills).
                      </p>
                    </div>
                  </div>

                  <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:bg-white/5 transition-colors relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-white mb-1">Click to upload documents</p>
                    <p className="text-xs text-gray-500">PNG, JPG, or PDF (Max 5MB each)</p>
                  </div>

                  {documents.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h4 className="text-sm font-medium text-gray-300">Uploaded Documents</h4>
                      {documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-xl">
                          <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-black/50">
                            {doc.file.type.startsWith('image/') ? (
                              <img src={doc.previewUrl} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate mb-1">{doc.file.name}</p>
                            <select
                              value={doc.label}
                              onChange={(e) => updateDocumentLabel(idx, e.target.value)}
                              className="bg-black/50 border border-white/10 text-xs text-gray-300 rounded px-2 py-1 outline-none focus:border-violet-500"
                            >
                              {DOCUMENT_LABELS.map(l => (
                                <option key={l.value} value={l.value}>{l.label}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDocument(idx)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP 4: Review */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-white">Almost there!</h3>
                    <p className="text-sm text-gray-500">Please review your campaign details before submitting.</p>
                  </div>

                  <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl overflow-hidden">
                    {[
                      { label: 'Title', value: watch('title') },
                      { label: 'Goal Amount', value: `₹${Number(watch('goalAmount')).toLocaleString()}` },
                      { label: 'Category', value: CATEGORIES.find((c) => c.value === watch('category'))?.label },
                      { label: 'Deadline', value: watch('deadline') },
                      { label: 'Documents Attached', value: `${documents.length} files` },
                    ].map(({ label, value }, idx) => (
                      <div key={label} className={`flex items-center justify-between p-4 ${idx !== 0 ? 'border-t border-white/[0.05]' : ''}`}>
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className="text-sm font-medium text-white">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                    <p className="text-sm font-semibold text-yellow-400 mb-1">Pending Review Process</p>
                    <p className="text-xs text-yellow-500/80">
                      Once submitted, our team will review your campaign and documents within 24 hours. You'll receive an email notification once it's approved and live.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-4 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary py-3 px-6"
                disabled={loading}
              >
                Go Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex-1 py-3"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 py-3"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit for Review'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
