import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  iconColorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, subValue, iconColorClass = 'text-brand-primary' }) => (
  <div className="bg-base-200 p-4 rounded-xl shadow-lg flex items-start space-x-3 sm:space-x-4">
    <div className={`p-2 bg-base-300 rounded-lg ${iconColorClass} flex-shrink-0`}>
      <Icon size={24} />
    </div>
    <div className="min-w-0">
      <p className="text-sm text-content-200 truncate">{label}</p>
      <p className="text-xl font-bold text-content-100 truncate">{value}</p>
      {subValue && <p className="text-xs text-content-200 mt-1 truncate">{subValue}</p>}
    </div>
  </div>
);

export default StatCard;