import type { Role } from '../types';

export const ROLES: Role[] = ['admin', 'treasurer', 'member'];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  treasurer: 'Treasurer',
  member: 'Member',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full access — manage members, payments, investments',
  treasurer: 'Record payments and investments',
  member: 'View-only access',
};

export const ROLE_OPTIONS = ROLES.map((r) => ({
  value: r,
  label: ROLE_LABELS[r],
}));

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
