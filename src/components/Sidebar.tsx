import { LayoutGrid, LogOut, ShieldCheck } from 'lucide-react';
import type { Module } from '../types';
import { MODULE_CARDS } from '../moduleCards';

export default function Sidebar({
  activeModule,
  onSelect,
  onLogout,
}: {
  activeModule: Module;
  onSelect: (module: Module) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="no-print sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-white">
          <ShieldCheck size={16} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">Ahmed Group</p>
          <p className="truncate text-[11px] text-slate-400">AI Project</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <button
          onClick={() => onSelect('hub')}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition ${
            activeModule === 'hub' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <LayoutGrid size={16} />
          All Modules
        </button>

        <div className="my-1.5 border-t border-slate-100" />

        {MODULE_CARDS.map(({ id, title, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium transition ${
              activeModule === id ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Icon size={16} />
            {title}
          </button>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-2">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
