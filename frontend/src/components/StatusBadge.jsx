import React from 'react';

export const StatusBadge = ({ status }) => {
  const getStyle = () => {
    switch (status) {
      case 'PRESENT':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'LATE':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      case 'HALF_DAY':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200/80',
          dot: 'bg-purple-500',
        };
      case 'ABSENT':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      case 'ON_LEAVE':
        return {
          bg: 'bg-sky-50 text-sky-800 border-sky-200/80',
          dot: 'bg-sky-500',
        };
      case 'HOLIDAY':
        return {
          bg: 'bg-teal-50 text-teal-800 border-teal-200/80',
          dot: 'bg-teal-500',
        };
      case 'WEEKLY_OFF':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
      case 'MISSING_PUNCH':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200/80 animate-pulse',
          dot: 'bg-orange-500',
        };
      case 'APPROVED':
      case 'PAID':
      case 'ONLINE':
      case 'ACTIVE':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'PENDING':
      case 'REVIEWED':
      case 'DRAFT':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      case 'REJECTED':
      case 'OFFLINE':
      case 'ERROR':
      case 'INACTIVE':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const { bg, dot } = getStyle();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${bg} transition-colors tracking-wide`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      <span>{status?.replace(/_/g, ' ') || 'N/A'}</span>
    </span>
  );
};
