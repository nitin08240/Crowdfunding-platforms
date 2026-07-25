import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Settings, Save, ShieldAlert, Globe, Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminSettingsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data.data.settings),
  });

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: any) => api.put('/admin/settings', newSettings),
    onSuccess: () => {
      toast.success('Settings saved successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    updateMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else if (name.startsWith('socialLinks.')) {
      const socialKey = name.split('.')[1];
      setFormData((prev: any) => ({
        ...prev,
        socialLinks: { ...prev.socialLinks, [socialKey]: value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  if (isLoading || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-black text-2xl text-white mb-1">Platform Settings</h1>
        <p className="text-gray-500 text-sm">Configure global platform behavior and appearance</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* General Settings */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-violet-400" /> General Configuration
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Site Name</label>
              <input 
                type="text" 
                name="siteName"
                value={formData.siteName || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Platform Commission (%)</label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                max="100"
                name="platformCommission"
                value={formData.platformCommission || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Default Currency</label>
              <input 
                type="text" 
                name="defaultCurrency"
                value={formData.defaultCurrency || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode */}
        <div className="glass rounded-2xl p-6 border border-orange-500/20 bg-orange-500/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" /> Maintenance Mode
          </h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  name="maintenanceMode"
                  checked={formData.maintenanceMode || false}
                  onChange={handleChange}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </div>
              <span className="text-sm font-medium text-white">Enable Maintenance Mode</span>
            </label>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Maintenance Message</label>
              <textarea 
                name="maintenanceMessage"
                value={formData.maintenanceMessage || ''}
                onChange={handleChange}
                rows={2}
                className="input py-2 text-sm bg-black/40 border-white/10 resize-none" 
              />
              <p className="text-[10px] text-gray-500 mt-1">This message will be shown to users when maintenance mode is active.</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="glass rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" /> Public Contact Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase flex items-center gap-1.5"><Mail className="w-3 h-3" /> Support Email</label>
              <input 
                type="email" 
                name="contactEmail"
                value={formData.contactEmail || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase flex items-center gap-1.5"><Phone className="w-3 h-3" /> Support Phone</label>
              <input 
                type="text" 
                name="contactPhone"
                value={formData.contactPhone || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Office Address</label>
              <textarea 
                name="contactAddress"
                value={formData.contactAddress || ''}
                onChange={handleChange}
                rows={2}
                className="input py-2 text-sm bg-black/40 border-white/10 resize-none" 
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase">Footer Text</label>
              <input 
                type="text" 
                name="footerText"
                value={formData.footerText || ''}
                onChange={handleChange}
                className="input py-2 text-sm bg-black/40 border-white/10" 
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button 
            type="submit" 
            disabled={updateMutation.isPending}
            className="btn-primary py-2.5 px-6 flex items-center gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsTab;
