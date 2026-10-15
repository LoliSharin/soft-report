import type { AppScreen } from './screen.types';

interface SidebarItem {
  id: AppScreen;
  label: string;
}

interface SidebarProps {
  items: SidebarItem[];
  activeItem: AppScreen;
  onSelect: (screen: AppScreen) => void;
}

export function Sidebar({ items, activeItem, onSelect }: SidebarProps) {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {items.map((item) => (
          <button
            key={item.id}
            className={
              item.id === activeItem
                ? 'sidebar__link sidebar__link--active'
                : 'sidebar__link'
            }
            onClick={() => onSelect(item.id)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
