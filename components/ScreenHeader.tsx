
import React from 'react';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="p-6 bg-base-200 border-b border-base-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-content-100">{title}</h1>
          {subtitle && <p className="text-md text-content-200 mt-1">{subtitle}</p>}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export default ScreenHeader;