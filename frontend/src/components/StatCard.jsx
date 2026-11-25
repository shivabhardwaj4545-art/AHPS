import React from 'react';

export const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  badgeText,
  badgeColor = 'slate',
  trend,
}) => {
  const colorMap = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100',
    },
    orange: {
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-100',
    },
  };

  const badgeColorMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    indigo: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    slate: 'bg-slate-100 text-slate-600 border border-slate-200/60',
  };

  const currentTheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </p>
        <div className={`p-2.5 rounded-lg ${currentTheme.iconBg}`}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold font-sans text-slate-900 tracking-tight">
            {value}
          </h3>
          {trend && (
            <span className="text-xs font-semibold text-emerald-600 inline-flex items-center">
              {trend}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {badgeText && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColorMap[badgeColor] || badgeColorMap.slate
                }`}
            >
              {badgeText}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};
