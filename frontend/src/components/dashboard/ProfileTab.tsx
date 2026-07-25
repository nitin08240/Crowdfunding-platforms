import React, { useState } from 'react';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { User as UserIcon, Camera, Save, Phone, MapPin, AlignLeft, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import type { User } from '../../types';

interface ProfileForm {
  name: string;
  phone: string;
  address: string;
  bio: string;
}

const ProfileTab: React.FC = () => {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form with user data
  const [formData, setFormData] = useState<ProfileForm>({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<User>) => api.put('/auth/profile', data).then((res) => res.data.data.user),
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully');
      updateUser(updatedUser);
      queryClient.setQueryData(['user-profile'], updatedUser);
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser({ avatar: res.data.data.avatarUrl });
      toast.success('Avatar updated');
    } catch (error) {
      toast.error('Failed to upload avatar');
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Profile Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your personal information</p>
      </div>

      {user?.kycStatus === 'pending' && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-300 mb-1">KYC Verification Pending</h3>
            <p className="text-xs text-yellow-500/80">Your identity documents are currently under review. This process usually takes 24-48 hours.</p>
          </div>
        </div>
      )}

      {user?.kycStatus === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-300 mb-1">KYC Verification Failed</h3>
            <p className="text-xs text-red-400/80 mb-2">There was an issue with your submitted documents. Please check your email for details.</p>
            <button className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 py-1.5 px-3 rounded-lg transition-colors">
              Resubmit Documents
            </button>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-violet-500/20 flex items-center justify-center border-2 border-violet-500/30">
                {avatarPreview || user?.avatar ? (
                  <img
                    src={avatarPreview || user?.avatar}
                    alt="Avatar"
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-violet-400" />
                )}
              </div>
              <label
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full cursor-pointer transition-opacity duration-200"
                htmlFor="avatar-upload"
              >
                <Camera className="w-6 h-6 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={isUploading}
              />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Profile Picture</h3>
              <p className="text-xs text-gray-500 max-w-xs">JPG, GIF or PNG. Max size of 5MB. A square image works best.</p>
            </div>
          </div>

          <div className="border-t border-white/[0.05]" />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-500" /> Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-500" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input opacity-50 cursor-not-allowed bg-black/20"
              />
              <p className="text-[10px] text-gray-500">Email cannot be changed directly. Contact support.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" /> Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" /> Location
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
                placeholder="Mumbai, Maharashtra"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-gray-500" /> Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="input min-h-[100px] resize-y"
                placeholder="Tell us a bit about yourself..."
                maxLength={500}
              />
              <p className="text-xs text-gray-500 text-right">{formData.bio.length}/500</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-primary"
            >
              <Save className="w-4 h-4" />
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileTab;
