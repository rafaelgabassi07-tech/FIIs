
import React from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="p-6 bg-base-200 border-b border-base-300">
      <h1 className="text-3xl font-bold text-content-100">{title}</h1>
      {subtitle && <p className="text-md text-content-200 mt-1">{subtitle}</p>}
    </div>
  );
};

export default ScreenHeader;
