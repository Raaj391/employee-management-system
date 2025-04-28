import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { surveyRates, type SurveyType } from "@shared/schema";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'PPP');
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toFixed(2)}`;
}

export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getRandomColor(seed: string): string {
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-purple-100 text-purple-800',
    'bg-amber-100 text-amber-800',
    'bg-red-100 text-red-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800'
  ];
  
  // Use a simple hash function to get a consistent color based on the seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export function getSurveyTypeData(type: SurveyType) {
  const data = {
    yours: {
      name: 'Yours Surveys',
      rate: surveyRates.yours,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-800',
      accentColor: 'text-blue-600'
    },
    yoursinternational: {
      name: 'Yours Surveys International',
      rate: surveyRates.yoursinternational,
      bgColor: 'bg-green-50',
      textColor: 'text-green-800',
      accentColor: 'text-green-600'
    },
    ssi: {
      name: 'SSI',
      rate: surveyRates.ssi,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-800',
      accentColor: 'text-purple-600'
    },
    dynata: {
      name: 'Dynata',
      rate: surveyRates.dynata,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-800',
      accentColor: 'text-amber-600'
    }
  };
  
  return data[type];
}

export function calculateSurveyRevenue(type: SurveyType, count: number): number {
  return surveyRates[type] * count;
}

export function getDaysInMonth(month: string): number {
  const [year, monthNum] = month.split('-').map(Number);
  return new Date(year, monthNum, 0).getDate();
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;
}

export function getLeaveStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
}
