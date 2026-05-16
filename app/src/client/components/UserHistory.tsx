import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, TrendingDown, Calendar, MessageSquare } from 'lucide-react';
import type { UserProfile } from '../../shared/api';

interface UserHistoryProps {
  username: string;
  loading?: boolean;
}

const getRiskColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300';
    case 'medium':
      return 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300';
    case 'high':
      return 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300';
  }
};

const getRiskBadgeColor = (riskLevel: 'low' | 'medium' | 'high') => {
  switch (riskLevel) {
    case 'low':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    case 'medium':
      return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200';
    case 'high':
      return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  }
};

const formatAccountAge = (accountAge: number | null) => {
  if (accountAge === null) {
    return 'N/A';
  }

  if (accountAge >= 365) {
    const years = accountAge / 365;
    return `${years.toFixed(1)} year${years >= 2 ? 's' : ''}`;
  }

  return `${accountAge} day${accountAge === 1 ? '' : 's'}`;
};

export const UserHistory: React.FC<UserHistoryProps> = ({ username, loading = false }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/user/${encodeURIComponent(username)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load user history');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  if (isLoading || loading) {
    return (
      <div className="card">
        <div className="text-center p-6">
          <div className="animate-spin mb-3 text-2xl">⏳</div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading user history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
        <p className="text-sm text-red-600 dark:text-red-400 p-6">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { reputation, modHistory, riskLevel } = profile;
  const suspensionWarning = reputation.isSuspended && (
    <div className="mb-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-950/30 p-3 dark:border-red-900">
      <p className="text-sm font-semibold text-red-700 dark:text-red-300">⚠️ Account Suspended</p>
    </div>
  );

  return (
    <div className="card overflow-hidden">
      {suspensionWarning}

      {/* Header with Risk Level */}
      <div className="card-header">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">User Reputation</h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getRiskBadgeColor(riskLevel)}`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400">u/{reputation.username}</p>
      </div>

      {/* Account Stats */}
      <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-white dark:bg-slate-700/50 p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Account Age</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {formatAccountAge(reputation.accountAge)}
            </p>
          </div>
          <div className="rounded-lg bg-white dark:bg-slate-700/50 p-3">
            <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold">Karma</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-1">
              {(reputation.commentKarma + reputation.linkKarma).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Moderation History */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-4">Moderation History</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-900">
            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs text-red-600 dark:text-red-400">Removed</p>
              <p className="text-base font-bold text-red-900 dark:text-red-200">{modHistory.totalRemoved}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-900">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-orange-600 dark:text-orange-400">Warnings</p>
              <p className="text-base font-bold text-orange-900 dark:text-orange-200">{modHistory.totalWarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Removals */}
      {modHistory.recentRemovals.length > 0 && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Recent Removals</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {modHistory.recentRemovals.slice(0, 3).map((removal) => (
              <div key={removal.postId} className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 border-l-4 border-red-400 dark:border-red-700">
                <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold line-clamp-2">
                  {removal.title}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {new Date(removal.removedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap gap-2">
        {reputation.isVerified && (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200 dark:border-blue-900">
            <Shield className="w-3.5 h-3.5" />
            Verified
          </span>
        )}
        {modHistory.totalRemoved > 0 && (
          <span className="inline-flex items-center gap-1.5 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-900">
            <AlertTriangle className="w-3.5 h-3.5" />
            Previous Removals
          </span>
        )}
      </div>
    </div>
  );
};
