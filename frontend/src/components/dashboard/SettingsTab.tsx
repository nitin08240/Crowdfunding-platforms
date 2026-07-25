import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Lock, Bell, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SettingsTab: React.FC = () => {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.put('/auth/password', data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update password');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwords.currentPassword,
      newPassword: passwords.newPassword,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display font-black text-2xl text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Manage your account preferences and security</p>
      </div>

      <div className="grid gap-6">
        {/* Security / Password */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Change Password</h2>
              <p className="text-sm text-gray-500">Ensure your account is using a long, random password.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwords.confirmPassword}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
            <div className="pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="btn-primary py-2.5 px-5 text-sm"
              >
                <Save className="w-4 h-4" />
                {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
              </motion.button>
            </div>
          </form>
        </div>

        {/* Notifications (Placeholder) */}
        <div className="glass rounded-2xl p-6 md:p-8 opacity-75">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Notification Preferences</h2>
              <p className="text-sm text-gray-500">Choose what you want to be notified about.</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { id: 'donations', label: 'New Donations', desc: 'When someone donates to your campaign' },
              { id: 'comments', label: 'New Comments', desc: 'When someone comments on your campaign' },
              { id: 'updates', label: 'Platform Updates', desc: 'Important news and updates from CrowdFund' },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <div>
                  <p className="font-medium text-white text-sm">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input type="checkbox" className="sr-only peer" disabled defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-500 opacity-50"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
