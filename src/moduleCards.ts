import { ClipboardCheck, Landmark, Mail, Receipt, Scale, Table2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Module } from './types';

export type ModuleCard = {
  id: Module;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const MODULE_CARDS: ModuleCard[] = [
  {
    id: 'lc-tracking',
    title: 'LC Tracking',
    description: 'Export L/C scrutiny, realization tracking, overdue interest, and maturity alerts.',
    icon: Table2,
  },
  {
    id: 'email-generation',
    title: 'Email Generation',
    description: 'Fill in and print formal bank correspondence — starting with the Mobile Bill Allowance disbursement letter to Bank Asia.',
    icon: Mail,
  },
  {
    id: 'loan-management',
    title: 'Loan Management',
    description: 'STL, UPAS, OD, and EDF facility register — sanctioned limits, outstanding, and overdue interest.',
    icon: Landmark,
  },
  {
    id: 'bank-charges',
    title: 'Bank Charge Preparation',
    description: 'Compute LC-related bank charges (commission, SWIFT, courier, VAT) and generate a printable voucher.',
    icon: Receipt,
  },
  {
    id: 'yarn-costing',
    title: 'Yarn Costing & Profitability',
    description: 'Daily closing workflow, costing, production, wastage, sales, estimated-vs-actual variance, profitability, and management analytics.',
    icon: Scale,
  },
  {
    id: 'lc-scrutiny',
    title: 'LC Scrutiny',
    description: 'Verify LC clauses against the PI — banking, shipment, payment, and compliance — with automatic discrepancy alerts.',
    icon: ClipboardCheck,
  },
];
