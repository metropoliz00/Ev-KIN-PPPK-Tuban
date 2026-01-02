
import React from 'react';

interface InputSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const InputSection: React.FC<InputSectionProps> = ({ title, description, children }) => {
  return (
    <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-8 mb-6 transition-all hover:shadow-lg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
      <h3 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-3">
        {title}
      </h3>
      {description && <p className="text-sm font-medium text-slate-400 mb-6">{description}</p>}
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );
};

export default InputSection;
