export interface User {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "CLIENT";
  business_name: string;
  business_details: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  included_minutes: number;
  duration_months: number;
  response_target: string;
  active: number;
}

export interface Project {
  id: string;
  client_id: string;
  title: string;
  description: string;
  status: string;
  halt_reason: string;
}

export interface Phase {
  id: string;
  project_id: string;
  title: string;
  due_date: string;
  amount_cents: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_reference: string;
  position: number;
}

export interface Task {
  id: string;
  project_id: string;
  phase_id: string | null;
  title: string;
  description: string;
  status: string;
}

export interface Comment {
  id: string;
  task_id: string;
  author: string;
  body: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  task_id: string;
  filename: string;
}

export interface Ledger {
  id: string;
  minutes: number;
  description: string;
  expires_at: string;
  available_at: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan_name: string;
  starts_at: string;
  ends_at: string;
  included_minutes: number;
  price_cents: number;
}

export interface Request {
  quoted_price_cents: number | null;
  quoted_minutes: number | null;
  quoted_months: number | null;
  id: string;
  client_id: string;
  username: string;
  kind: string;
  title: string;
  body: string;
  status: string;
  minutes: number;
  admin_note: string;
  created_at: string;
}

export interface Workspace {
  plans: Plan[];
  projects: Project[];
  phases: Phase[];
  tasks: Task[];
  comments: Comment[];
  attachments: Attachment[];

  ledger: Ledger[];
  subscriptions: Subscription[];
  requests: Request[];
  clients?: User[];

  balance_minutes: number;
  payment_instructions: string;
  email_configured: boolean;

  audit?: {
    id: number;
    username: string;
    action: string;
    created_at: string;
  }[];

  email_queue?: {
    id: string;
    subject: string;
    recipient: string;
    attempts: number;
    sent_at: string;
    last_error: string;
  }[];
}
