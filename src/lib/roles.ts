export type Role = 'owner' | 'manager' | 'staff' | 'cashier' | 'viewer';

export const can = {
  manageProducts: (r: Role) => r === 'owner' || r === 'manager' || r === 'staff',
  editPrice: (r: Role) => r === 'owner' || r === 'manager',
  deleteProduct: (r: Role) => r === 'owner' || r === 'manager',
  adjustStock: (r: Role) => r !== 'viewer' && r !== 'cashier',
  manageOrders: (r: Role) => ['owner', 'manager', 'staff', 'cashier'].includes(r),
  refund: (r: Role) => r === 'owner' || r === 'manager',
  viewAnalytics: (r: Role) => r === 'owner' || r === 'manager' || r === 'staff',
  manageSettings: (r: Role) => r === 'owner',
  manageStaff: (r: Role) => r === 'owner',
};
