export interface User {
  id: number;
  name: string;
  email: string;
  preferred_currency: string;
  preferred_travel_style: string;
  preferred_interests: string; // JSON string or array
}

export interface WeatherInfo {
  temperature_c: number;
  humidity_pct: number;
  condition: string;
  description: string;
  icon: string;
  is_raining: boolean;
  has_precipitation_risk?: boolean;
  wind_speed_kmh: number;
  source: string;
  retrieved_at: string;
}

export interface ItineraryActivity {
  id: number;
  day_id: number;
  trip_id: number;
  name: string;
  description: string;
  category: string;
  time_slot: string;
  duration_hours: number;
  estimated_entry_cost: number;
  estimated_transport_cost: number;
  visit_order: number;
  interest_match_reason: string;
  location_name?: string;
  map_query?: string;
  is_active: number;
  opening_hours?: string;
  weather_suitability?: string;
  transit_time_mins?: number;
  match_score?: number;
  score_rationale?: string;
  image_url?: string;
  photo_attribution?: string;
  latitude?: number;
  longitude?: number;
  place_id?: string;
  source_url?: string;
  verification_status?: 'verified' | 'unverified_estimate' | 'scheduled_break' | string;
  last_verified?: string;
}

export interface ItineraryDay {
  id: number;
  trip_id: number;
  day_number: number;
  date: string;
  title: string;
  activities: ItineraryActivity[];
}

export interface Expense {
  id: number;
  trip_id: number;
  title: string;
  category: 'transport' | 'accommodation' | 'food' | 'sightseeing' | 'miscellaneous' | string;
  amount: number;
  currency: string;
  date: string;
  notes?: string;
  receipt_filename?: string;
  payer_name: string;
  is_shared: number;
  is_verified_price?: number;
  receipt_url?: string;
}

export interface GroupMember {
  id: number;
  trip_id: number;
  name: string;
  email?: string;
}

export interface Trip {
  id: number;
  user_id: number;
  title: string;
  starting_city: string;
  destination: string;
  start_date: string;
  end_date: string;
  travelers: number;
  total_budget: number;
  currency: string;
  travel_style: 'budget' | 'balanced' | 'comfort' | string;
  interests: string[];
  accommodation_pref: string;
  dietary_pref: string;
  accessibility_pref: string;
  cover_image?: string;
  status: string;
  total_spent: number;
  remaining_budget: number;
  budget_utilization_pct: number;
  days?: ItineraryDay[];
  expenses?: Expense[];
  group_members?: GroupMember[];
  days_count?: number;
  weather?: WeatherInfo;
  daily_budget_target?: number;
  seasonal_advisory?: string;
}

export interface ForecastConfidence {
  level: string;
  description: string;
  formula: string;
}

export interface BudgetSummary {
  total_budget: number;
  total_spent: number;
  remaining_budget: number;
  utilization_pct: number;
  currency: string;
  actual_by_category: Record<string, number>;
  planned_by_category: Record<string, number>;
  estimated_future_commitments: number;
  projected_final_spending: number;
  projected_variance: number;
  forecast_confidence: ForecastConfidence;
  daily_spent: { date: string; total: number }[];
  warnings: string[];
  expense_detective_insights: {
    category: string;
    level: string;
    title: string;
    message: string;
    recommendation: string;
    estimated_saving_impact?: number;
  }[];
}

export interface GroupBalance {
  name: string;
  paid: number;
  fair_share: number;
  net_balance: number;
  status: 'gets_back' | 'owes' | 'settled';
}

export interface Settlement {
  from_user: string;
  to_user: string;
  amount: number;
  currency: string;
}

export interface GroupSummaryResponse {
  trip_id: number;
  currency: string;
  total_shared_spent: number;
  members_count: number;
  fair_share_per_person: number;
  balances: GroupBalance[];
  settlements: Settlement[];
  shared_expenses_count: number;
  mathematical_reconciliation?: {
    reconciled: boolean;
    sum_of_net_balances: number;
    algorithm: string;
  };
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant' | 'system';
  message: string;
  action_type?: string;
  action_payload?: any;
  created_at?: string;
}

export interface AlternativeOption {
  name: string;
  cost: number;
  match_score: number;
  description: string;
}

export interface ProposedChange {
  activity_id: number;
  day_number: number;
  original_name: string;
  original_cost: number;
  original_duration?: number;
  replacement_name?: string;
  replacement_description?: string;
  replacement_category?: string;
  replacement_time_slot?: string;
  replacement_duration_hours?: number;
  replacement_entry_cost?: number;
  replacement_transport_cost?: number;
  new_cost?: number;
  cost_difference?: number;
  action?: 'remove' | 'replace';
  match_score?: number;
  score_components?: {
    interest_alignment: number;
    budget_fit: number;
    weather_safety: number;
    time_efficiency: number;
    weights: string;
    explanation: string;
  };
  pros?: string[];
  cons?: string[];
  assumptions?: string;
  tradeoff_explanation: string;
  alternative_options?: AlternativeOption[];
}

export interface AdaptationProposal {
  scenario: string;
  summary: string;
  total_savings: number;
  currency: string;
  constraints_audit?: {
    budget_constraint: {
      total_budget: number;
      spent_so_far: number;
      remaining_funds: number;
      status: string;
    };
    weather_constraint: {
      current_condition: string;
      temperature_c: number;
      precipitation_alert: boolean;
      data_source: string;
      retrieved_at: string;
    };
    schedule_constraint: {
      total_days: number;
      recommended_daily_hours: string;
    };
  };
  proposed_changes: ProposedChange[];
  applied: boolean;
  notice: string;
}

export interface ItineraryRevision {
  id: number;
  trip_id: number;
  scenario: string;
  summary: string;
  total_savings: number;
  currency: string;
  applied_at: string;
  can_undo: number;
  changes_applied: ProposedChange[];
}

export interface Receipt {
  id: number;
  user_id: number;
  trip_id?: number | null;
  expense_id?: number | null;
  title: string;
  merchant_name?: string;
  amount: number;
  currency: string;
  date: string;
  category: 'food' | 'transport' | 'accommodation' | 'shopping' | 'activities' | 'other' | string;
  payment_method?: 'cash' | 'credit_card' | 'debit_card' | 'upi' | 'net_banking' | 'other' | string;
  notes?: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_url: string;
  ocr_applied: number;
  ocr_extracted_data?: Record<string, any>;
  is_expense_created: number;
  trip_title?: string;
  trip_destination?: string;
  linked_expense_id?: number | null;
  linked_expense_title?: string;
  linked_expense_amount?: number;
  created_at: string;
  updated_at: string;
}

export interface ReceiptSummary {
  total_amount: number;
  total_count: number;
  by_category: Record<string, number>;
  linked_count: number;
  unlinked_count: number;
  currencies: string[];
}

export interface ReceiptUploadResult {
  message: string;
  file_token: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  ocr_applied: boolean;
  extracted_data: Record<string, any>;
  notice: string;
}
