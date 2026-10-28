import React from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Plane,
  PlusCircle,
  History,
  PiggyBank,
  PieChart,
  ArrowRightLeft,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  Compass,
  Sparkles,
  Receipt as ReceiptIcon
} from 'lucide-react';

export type DashboardTab =
  | 'overview'
  | 'trips'
  | 'receipts'
  | 'add_expense'
  | 'history'
  | 'budget_planner'
  | 'analytics'
  | 'converter'
  | 'goals'
  | 'settings';

interface NavigationSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  tripsCount?: number;
  receiptsCount?: number;
  expensesCount?: number;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  tripsCount = 0,
  expensesCount = 0,
  receiptsCount = 0
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, color: 'text-[#3984F5] dark:text-[#60A5FA]' },
    { id: 'trips', label: 'My Trips', icon: Plane, count: tripsCount, color: 'text-[#3984F5] dark:text-[#60A5FA]' },
    { id: 'receipts', label: 'Receipt Vault', icon: ReceiptIcon, count: receiptsCount, color: 'text-[#F472B6] dark:text-[#F9A8D4]' },
    { id: 'add_expense', label: 'Add Expense', icon: PlusCircle, isAction: true, color: 'text-[#FACC15] dark:text-[#FDE047]' },
    { id: 'history', label: 'Expense History', icon: History, count: expensesCount, color: 'text-[#3984F5] dark:text-[#60A5FA]' },
    { id: 'budget_planner', label: 'Budget Planner', icon: PiggyBank, color: 'text-[#FACC15] dark:text-[#FDE047]' },
    { id: 'analytics', label: 'Analytics & Reports', icon: PieChart, color: 'text-[#F472B6] dark:text-[#F9A8D4]' },
    { id: 'converter', label: 'Currency Converter', icon: ArrowRightLeft, color: 'text-[#3984F5] dark:text-[#60A5FA]' },
    { id: 'goals', label: 'Travel Goals', icon: Target, color: 'text-[#F472B6] dark:text-[#F9A8D4]' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-[#64748B] dark:text-[#B6C2D6]' },
  ];

  return (
    <aside
      className={`bg-white dark:bg-[#121D33] border-r border-[#DCE6F5] dark:border-[#2A3A56] transition-all duration-300 flex flex-col justify-between shrink-0 shadow-xs select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand / Sidebar Header */}
      <div>
        <div className="p-4 border-b border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3984F5] via-[#F472B6] to-[#FACC15] flex items-center justify-center text-white shadow-xs">
                <Compass className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm text-[#172554] dark:text-[#F1F5F9] tracking-tight">
                  TravelWise
                </span>
                <span className="text-[10px] text-[#3984F5] dark:text-[#60A5FA] font-bold -mt-0.5">AI Travel Intelligence</span>
              </div>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id as DashboardTab)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#3984F5]/10 dark:bg-[#60A5FA]/15 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 dark:border-[#60A5FA]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#3984F5] dark:text-[#60A5FA]' : item.color}`} />
                
                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {!isCollapsed && item.count !== undefined && item.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224]'
                      : 'bg-[#DCE6F5] dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9]'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom User / Quick Action Pill */}
      <div className="p-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
        <Link
          to="/create-trip"
          className={`w-full py-2.5 px-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] dark:text-[#0B1224] font-bold text-xs shadow-sm shadow-[#3984F5]/20 flex items-center justify-center gap-2 hover:opacity-95 transition-all ${
            isCollapsed ? 'p-2' : ''
          }`}
          title="Plan New Journey"
        >
          <Sparkles className="w-4 h-4 shrink-0 text-[#FACC15] dark:text-[#0B1224]" />
          {!isCollapsed && <span>+ Plan New Journey</span>}
        </Link>
      </div>
    </aside>
  );
};
