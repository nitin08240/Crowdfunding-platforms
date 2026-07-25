import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';

const AdminDonationsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-donations', page, statusFilter],
    queryFn: () => 
      api.get(`/admin/donations?page=${page}&limit=10${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`)
         .then((r) => r.data.data),
  });

  const donations = data?.donations || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-2xl text-white mb-1">Platform Donations</h1>
          <p className="text-gray-500 text-sm">View all transactions and revenue</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input py-2 text-sm w-full sm:w-auto bg-white/[0.02] border-white/10 focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="created">Created (Pending)</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Donor</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-400 text-xs uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500"><div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
              ) : donations.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No donations found.</td></tr>
              ) : (
                donations.map((d: any) => (
                  <tr key={d._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-xs font-mono text-gray-400 font-medium tracking-wide bg-white/5 px-2 py-1 rounded w-fit">{d.razorpayOrderId || d._id}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{new Date(d.createdAt).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      {d.isAnonymous ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-500 shrink-0">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-gray-400 italic text-sm">Anonymous</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {d.donor?.avatar ? (
                            <img src={d.donor.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-xs text-blue-300 font-bold shrink-0">
                              {d.donor?.name?.[0]?.toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white text-sm">{d.donor?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-gray-500">{d.donor?.email}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/campaigns/${d.campaign?.slug}`} target="_blank" className="hover:underline text-violet-400 text-sm max-w-[200px] truncate block font-medium">
                        {d.campaign?.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                        d.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        d.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                        d.status === 'refunded' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold text-lg ${d.status === 'paid' ? 'text-pink-400' : 'text-gray-500'}`}>
                        ₹{d.amount?.toLocaleString()}
                      </span>
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

export default AdminDonationsTab;
