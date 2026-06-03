import type { Role } from '../types';

export function canManageMembers(role: Role | undefined): boolean {
  return role === 'admin';
}

export function canManagePayments(role: Role | undefined): boolean {
  return role === 'admin' || role === 'treasurer';
}

export function canManageInvestments(role: Role | undefined): boolean {
  return role === 'admin' || role === 'treasurer';
}

export function canManageLoans(role: Role | undefined): boolean {
  return role === 'admin' || role === 'treasurer';
}

export function canUpdateFundValues(role: Role | undefined): boolean {
  return role === 'admin' || role === 'treasurer';
}
