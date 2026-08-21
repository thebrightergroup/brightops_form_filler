import React from 'react';
import { FieldType } from '../types';
import {
  Type,
  AlignLeft,
  CheckSquare,
  Circle,
  Calendar,
  ListFilter,
  PenTool,
  Hash,
  DollarSign,
  Mail,
  Phone,
  Plus,
  Bookmark,
} from 'lucide-react';

interface FieldToolbarProps {
  onAddField: (type: FieldType) => void;
}

export const FieldToolbar: React.FC<FieldToolbarProps> = ({ onAddField }) => {
  const tools: { type: FieldType; label: string; icon: React.ReactNode }[] = [
    { type: 'text', label: 'Single Text', icon: <Type className="w-4 h-4" /> },
    { type: 'multiline', label: 'Multiline Text', icon: <AlignLeft className="w-4 h-4" /> },
    { type: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
    { type: 'date', label: 'Date Input', icon: <Calendar className="w-4 h-4" /> },
    { type: 'select', label: 'Dropdown', icon: <ListFilter className="w-4 h-4" /> },
    { type: 'signature', label: 'Signature', icon: <PenTool className="w-4 h-4 text-sky-600" /> },
    { type: 'initials', label: 'Initials', icon: <Bookmark className="w-4 h-4 text-indigo-600" /> },
    { type: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { type: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
    { type: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { type: 'currency', label: 'Currency ($)', icon: <DollarSign className="w-4 h-4 text-emerald-600" /> },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-md p-3 flex flex-col gap-2 w-48 select-none">
      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-100">
        <span>Add Field</span>
        <Plus className="w-3.5 h-3.5 text-slate-400" />
      </div>

      <div className="grid grid-cols-1 gap-1 max-h-[380px] overflow-y-auto pr-1">
        {tools.map((tool) => (
          <button
            key={tool.type}
            onClick={() => onAddField(tool.type)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-[#F4F8FC] hover:text-[#006CA3] border border-transparent hover:border-[#669FD5]/40 transition-all text-left group"
          >
            <span className="p-1 rounded bg-slate-100 group-hover:bg-sky-100 text-slate-600 group-hover:text-[#006CA3] transition-colors">
              {tool.icon}
            </span>
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-100">
        Click tool or click on PDF page
      </div>
    </div>
  );
};
