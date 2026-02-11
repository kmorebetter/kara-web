export interface PerformerInfo {
  name: string;
  citizenship: string;
  phone: string;
  email: string;
  address: string;
  postal_code: string;
  dob: string;
  passport: string;
  sin: string;
  gst: string;
  ubcp_number: string;
  cavco: string;
  bc_resident: boolean;
  us_citizen: boolean;
  us_resident: boolean;
  minor: boolean;
}

export interface AgentInfo {
  name: string;
  agency: string;
  agency_address_line1: string;
  agency_address_line2: string;
  cell: string;
  email: string;
  phone: string;
}

export interface DealInfo {
  role: string;
  role_number: string;
  form_of_hire: string;
  daily_rate: string;
  hourly_rate: string;
  ot_15x: string;
  ot_20x: string;
  guaranteed_dates: string;
  num_days: string;
  outside_dates: string;
  per_diem: string;
  credit: string;
  dressing_facility: string;
  location: string;
  transportation: string;
  other_contractual: string;
  salary_line: string;
}

export interface ContractConfig {
  performer: PerformerInfo;
  agent: AgentInfo;
  deal: DealInfo;
  memo_date: string;
  production_title: string;
}

export interface GeneratedFiles {
  dealMemo: { blob: Blob; filename: string };
  contract: { blob: Blob; filename: string };
}

export interface PerformerEntry {
  id: string;
  config: ContractConfig | null;
  files: GeneratedFiles | null;
  status: "parsing" | "generating" | "ready" | "error";
  error: string | null;
}
