import { ArrowRight } from 'lucide-react';
import type { Module } from '../types';
import { MODULE_CARDS } from '../moduleCards';

export default function ModuleHub({ onSelect }: { onSelect: (module: Module) => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800">Modules</h2>
        <p className="text-sm text-slate-500">Select a module to continue.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULE_CARDS.map(({ id, title, description, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="group flex flex-col items-start rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:border-slate-300 hover:shadow-sm"
          >
            <div className="flex w-full items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white">
                <Icon size={18} />
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                Active
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>
            <span className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-600 group-hover:text-slate-800">
              Open module <ArrowRight size={13} />
            </span>
          </button>
        ))}

        <div className="flex flex-col items-start rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-5 text-left">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
            <ArrowRight size={18} />
          </span>
          <h3 className="mt-3 text-sm font-semibold text-slate-500">More modules</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Additional modules for the group's finance operations will be added here over time.
          </p>
        </div>
      </div>
    </div>
  );
}
