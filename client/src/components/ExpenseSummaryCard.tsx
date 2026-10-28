import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ExpenseSummaryCardProps {
  title: string;
  amount: number;
  currency?: string;
  subtitle: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeType?: 'blue' | 'pink' | 'yellow' | 'mint' | 'lavender' | 'amber';
  trend?: string;
}

export const ExpenseSummaryCard: React.FC<ExpenseSummaryCardProps> = ({
  title,
  amount,
  currency = 'INR',
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'blue',
  trend
}) => {
  const badgeStyles: Record<string, string> = {
    blue: 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border-[#3984F5]/30',
    pink: 'bg-[#F472B6]/10 text-[#DB2777] dark:text-[#F9A8D4] border-[#F472B6]/30',
    yellow: 'bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] border-[#FACC15]/40',
    amber: 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30',
    mint: 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border-[#3984F5]/30',
    lavender: 'bg-[#F472B6]/10 text-[#DB2777] dark:text-[#F9A8D4] border-[#F472B6]/30',
  };

  const iconContainerStyles: Record<string, string> = {
    blue: 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA]',
    pink: 'bg-[#F472B6]/15 text-[#DB2777] dark:text-[#F9A8D4]',
    yellow: 'bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047]',
    amber: 'bg-[#EF4444]/10 text-[#EF4444]',
    mint: 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA]',
    lavender: 'bg-[#F472B6]/15 text-[#DB2777] dark:text-[#F9A8D4]',
  };

  return (
    <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between space-y-4">
      
      {/* Top Header Row with Icon & Badge */}
      <div className="flex items-center justify-between">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${iconContainerStyles[badgeType] || iconContainerStyles.blue}`}>
          <Icon className="w-5 h-5" />
        </div>

        {badgeText && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeStyles[badgeType] || badgeStyles.blue}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Main Metric Figure */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#B6C2D6]">
          {title}
        </span>
        <p className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-[#F1F5F9] font-mono tracking-tight">
          {currency} {amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Footer Subtitle & Trend */}
      <div className="pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-medium">
        <span>{subtitle}</span>
        {trend && (
          <span className="font-bold text-[#3984F5] dark:text-[#60A5FA]">{trend}</span>
        )}
      </div>

    </div>
  );
};
