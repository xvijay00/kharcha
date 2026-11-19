import type { BusinessType } from '@/types';

/**
 * Returns default income and expense category names for a given business type.
 */
export function getDefaultCategories(businessType: BusinessType): {
  income: string[];
  expense: string[];
} {
  // Common categories shared by every business type
  const income: string[] = ['Sales', 'Service Income', 'Other Income'];
  const expense: string[] = [
    'Purchase',
    'Rent',
    'Salary',
    'Electricity',
    'Other Expense',
  ];

  // Type-specific additions
  switch (businessType) {
    case 'grocery':
      expense.push('Transport', 'Packaging', 'Wastage');
      break;

    case 'medical':
      income.push('Prescription Sales', 'OTC Sales');
      expense.push('Medicine Purchase', 'Lab Supplies');
      break;

    case 'hotel':
      income.push('Room Rent', 'Food & Beverage');
      expense.push('Housekeeping', 'Laundry', 'Food Supplies');
      break;

    case 'restaurant':
      income.push('Dine-in', 'Takeaway', 'Delivery');
      expense.push('Raw Materials', 'Kitchen Gas', 'Packaging');
      break;

    case 'sweet_shop':
      income.push('Counter Sales', 'Bulk Orders', 'Catering');
      expense.push('Raw Materials', 'Packaging', 'Wastage');
      break;

    case 'mobile_shop':
      income.push('Device Sales', 'Repair Income', 'Accessories');
      expense.push('Parts & Accessories', 'Repair Parts');
      break;
  }

  return { income, expense };
}

/**
 * Returns the default measurement units for a given business type.
 */
export function getDefaultUnits(businessType: BusinessType): string[] {
  switch (businessType) {
    case 'grocery':
      return ['kg', 'g', 'ltr', 'ml', 'pcs', 'dozen', 'packet', 'bundle'];

    case 'medical':
      return ['pcs', 'strip', 'bottle', 'tube', 'box', 'vial', 'sachet'];

    case 'hotel':
      return ['room', 'night', 'pcs'];

    case 'restaurant':
      return ['plate', 'half', 'full', 'pcs', 'glass', 'bottle'];

    case 'sweet_shop':
      return ['kg', 'g', 'pcs', 'box', 'plate', 'dozen'];

    case 'mobile_shop':
      return ['pcs', 'unit', 'set'];
  }
}
