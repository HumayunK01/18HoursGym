export type Role = 'MEMBER' | 'TRAINER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type PassStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
export type ClassStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED' | 'NO_SHOW';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  created_at?: string;
  activePass?: PassPurchase | null;
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string;
  duration_in_days: number;
  price: string | number;
  is_active: boolean;
  features?: string[] | null;
}

export interface PassPurchase {
  id: string;
  user_id: string;
  plan_id: string;
  start_date: string;
  end_date: string;
  status: PassStatus;
  amount_paid: string | number;
  created_at: string;
  plan?: MembershipPlan;
}

export interface TrainerProfile {
  id: string;
  user_id: string;
  bio?: string | null;
  specialization?: string | null;
  years_experience?: number;
  avatar_url?: string | null;
  user?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface WorkoutClass {
  id: string;
  trainer_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  capacity: number;
  status: ClassStatus;
  trainer?: TrainerProfile;
  _count?: {
    bookings: number;
  };
  spots_left?: number;
  is_booked_by_me?: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  status: BookingStatus;
  booked_at: string;
  class?: WorkoutClass;
}

export interface Payment {
  id: string;
  user_id: string;
  pass_purchase_id: string;
  amount: string | number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_ref: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface AdminOverview {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number | string;
  upcomingClassesCount: number;
  totalBookings?: number;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    requestId?: string;
    details?: Array<{ field?: string; message: string }>;
  };
}
