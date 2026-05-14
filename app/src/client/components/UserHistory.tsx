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
      <div className="rounded-lg border border-gray-300 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin mb-2">⏳</div>
          <p className="text-xs text-gray-600 dark:text-gray-400">Loading user history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-gray-300 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-xs text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const { reputation, modHistory, riskLevel } = profile;
  const suspensionWarning = reputation.isSuspended && (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-800 dark:bg-red-900/30">
      <p className="text-xs font-semibold text-red-700 dark:text-red-300">⚠️ Account Suspended</p>
    </div>
  );

  return (
    <div className="rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
      {suspensionWarning}

      {/* Header with Risk Level */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">User Reputation</h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getRiskBadgeColor(riskLevel)}`}>
            {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} Risk
          </span>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">u/{reputation.username}</p>
      </div>

      {/* Account Stats */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Account Age</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              {reputation.accountAge} days
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">Karma</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
              {(reputation.commentKarma + reputation.linkKarma).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Moderation History */}
      <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Moderation History</h4>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Removed</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{modHistory.totalRemoved}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Warnings</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{modHistory.totalWarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Removals */}
      {modHistory.recentRemovals.length > 0 && (
        <div className="px-4 py-3">
          <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-2">Recent Removals</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {modHistory.recentRemovals.slice(0, 3).map((removal) => (
              <div key={removal.postId} className="bg-red-50 dark:bg-red-900/20 rounded p-2 border-l-2 border-red-300 dark:border-red-700">
                <p className="text-xs text-gray-900 dark:text-gray-100 font-semibold line-clamp-2">
                  {removal.title}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {new Date(removal.removedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700 flex gap-2 text-xs">
        {reputation.isVerified && (
          <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
            <Shield className="w-3 h-3" />
            Verified
          </span>
        )}
        {modHistory.totalRemoved > 0 && (
          <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3" />
            Previous Removals
          </span>
        )}
      </div>
    </div>
  );
};
