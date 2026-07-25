import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Shield, Filter } from 'lucide-react';

const AdminAuditLogs: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter],
    queryFn: () => 
      api.get(`/admin/audit-logs?page=${page}&limit=20${actionFilter !== 'all' ? `&action=${actionFilter}` : ''}`)
         .then((r) => r.data.data),
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  // Extract unique actions for the filter dropdown
  const actionTypes = [
    'ADMIN_LOGIN', 'ADMIN_LOGOUT', 'USER_SUSPENDED', 'USER_UNSUSPENDED', 'USER_DELETED', 
    'KYC_APPROVED', 'KYC_REJECTED', 'CAMPAIGN_APPROVED', 'CAMPAIGN_REJECTED', 
    'CAMPAIGN_SUSPENDED', 'CAMPAIGN_FEATURED', 'CAMPAIGN_UNFEATURED', 'CAMPAIGN_DELETED',
    'WITHDRAWAL_APPROVED', 'NGO_VERIFIED', 'NGO_REJECTED', 'NGO_SUSPENDED', 'NGO_DELETED',
    'SETTINGS_UPDATED'
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Audit Logs</h1>
          <p className="text-gray-500 text-sm">System-wide admin activity tracking</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Filter className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <select 
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="input pl-9 py-2 text-sm w-full sm:w-auto bg-white/[0.02] border-white/10 focus:border-violet-500"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Admin</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No audit logs found.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-white font-medium">{new Date(log.timestamp).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {log.adminId ? (
                        <div>
                          <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Shield className="w-3 h-3 text-red-400" />
                            {log.adminId.name}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{log.adminId.email}</p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-gray-500 italic">System</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-gray-400 mr-2 bg-white/5 px-1.5 py-0.5 rounded">{log.targetType}</span>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <pre className="mt-2 text-[10px] text-gray-400 bg-black/40 p-2 rounded-lg overflow-x-auto max-w-xs border border-white/5">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                        {log.campaignId && <p className="text-[10px] text-gray-500 truncate max-w-[200px]">Campaign: {log.campaignId.title}</p>}
                        {log.userId && <p className="text-[10px] text-gray-500 truncate max-w-[200px]">User: {log.userId.email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono text-gray-500">{log.ip || 'Unknown'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLogs;
