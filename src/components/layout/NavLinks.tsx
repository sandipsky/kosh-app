import { NavLink } from '@mantine/core';
import {
  IconChartLine,
  IconHome2,
  IconPlus,
  IconRocket,
  IconTable,
  IconUsers,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Dashboard', icon: IconHome2 },
  { to: '/members', label: 'Members', icon: IconUsers },
  { to: '/contributions', label: 'Contributions', icon: IconTable },
  { to: '/payments', label: 'Payments', icon: IconPlus },
  { to: '/investments', label: 'Investments', icon: IconChartLine },
  { to: '/strategy', label: 'Strategy', icon: IconRocket },
];

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
        return (
          <NavLink
            key={item.to}
            label={item.label}
            active={active}
            leftSection={<Icon size={18} stroke={1.7} />}
            onClick={() => {
              navigate(item.to);
              onNavigate?.();
            }}
          />
        );
      })}
    </>
  );
}
