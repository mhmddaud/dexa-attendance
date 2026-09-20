import { NavLink } from 'react-router-dom';

export interface NavItem {
  to: string;
  label: string;
  icon?: string;
}

interface SidebarProps {
  items: NavItem[];
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ items, open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform border-r border-slate-200 bg-white pt-16 transition-transform lg:static lg:translate-x-0 lg:pt-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.icon && <span>{item.icon}</span>}
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
