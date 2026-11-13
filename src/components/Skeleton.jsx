import React from 'react';

export const Shimmer = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700/70 dark:to-slate-800 rounded-lg ${className}`}
  />
);

export const ListItemSkeleton = () => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1 w-full sm:w-auto">
      <Shimmer className="w-10 h-10 rounded-full shrink-0" />
      <div className="min-w-0 flex-1 space-y-2 w-full">
        <Shimmer className="h-4 w-48 rounded-md" />
        <Shimmer className="h-3 w-32 rounded-md" />
      </div>
    </div>
    <div className="w-full sm:w-auto flex items-center gap-3">
      <Shimmer className="h-2 w-32 rounded-full hidden sm:block" />
      <Shimmer className="h-8 w-20 rounded-xl" />
    </div>
  </div>
);

export default { Shimmer, ListItemSkeleton };

