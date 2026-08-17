export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;
  avatarColor: string;
}

export type AuditAction =
  | 'transaction.completed'
  | 'transaction.voided'
  | 'transaction.refunded'
  | 'inventory.adjustment'
  | 'inventory.created'
  | 'inventory.updated'
  | 'inventory.deleted'
  | 'discount.applied'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'staff.login';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  action: AuditAction;
  target: string;
  detail?: string;
}

export interface SessionUser {
  id: string;
  name: string;
  role: StaffRole;
}
