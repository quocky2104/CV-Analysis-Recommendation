export type MatchStatus = 'match' | 'partial_match' | 'not_evidenced';
export type Priority = 'required' | 'preferred' | 'nice_to_have';

export interface WorkExperience {
  company?: string | null;
  title?: string | null;
  dates?: string | null;
  responsibilities: string[];
  achievements: string[];
}

export interface Project {
  name?: string | null;
  description?: string | null;
  technologies: string[];
  contributions: string[];
}

export interface Education {
  institution?: string | null;
  degree?: string | null;
  field?: string | null;
  dates?: string | null;
}

export interface CVProfile {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  summary?: string | null;
  skills: string[];
  work_experience: WorkExperience[];
  projects: Project[];
  education: Education[];
  certifications: string[];
  languages: string[];
  links: string[];
}

export interface JDRequirement {
  id: string;
  description: string;
  priority: Priority;
  category: string;
  source_context?: string | null;
}

export interface JDAnalysis {
  job_title?: string | null;
  seniority?: string | null;
  industry?: string | null;
  requirements: JDRequirement[];
}

export interface RequirementMatch {
  requirement_id: string;
  requirement: string;
  priority: Priority;
  category: string;
  status: MatchStatus;
  reason: string;
  evidence: string | null;
  evidence_section: string | null;
  is_verified_quote: boolean;
}

export interface ScoreBreakdown {
  overall_score: number;
  total_requirements: number;
  matched: number;
  partial: number;
  not_evidenced: number;
  required_score: number;
  preferred_score: number;
  nice_to_have_score: number;
  critical_gaps: string[];
}

export interface QualityItem {
  score: number;
  reason: string;
  examples: string[];
}

export interface CVQualityReview {
  clarity: QualityItem;
  relevance: QualityItem;
  impact_evidence: QualityItem;
  structure: QualityItem;
  overall_quality_score: number;
}

export interface RevisionSuggestion {
  id: string;
  section: string;
  original_text: string | null;
  proposed_text: string;
  reason: string;
  related_requirement_ids: string[];
  evidence_basis: string | null;
  needs_user_input: boolean;
  priority: 'high' | 'medium' | 'low' | string;
}

export interface KeywordGap {
  keyword: string;
  importance: 'high' | 'medium' | 'low' | string;
  reason: string;
}

export interface TermEquivalent {
  jd_term: string;
  cv_term: string;
  notes: string | null;
}

export interface KeywordAnalysis {
  found_in_cv: string[];
  missing_from_cv: KeywordGap[];
  terminology_equivalents: TermEquivalent[];
}

export interface AnalysisResponse {
  analysis_id: string;
  timestamp: string;
  job_title: string | null;
  provider: string;
  is_demo_mode: boolean;
  scores: ScoreBreakdown;
  requirement_matches: RequirementMatch[];
  strengths: string[];
  gaps: string[];
  keyword_analysis: KeywordAnalysis;
  quality_review: CVQualityReview;
  suggestions: RevisionSuggestion[];
  cv_profile: CVProfile;
  jd_analysis: JDAnalysis;
  warnings: string[];
  scoring_explanation: string;
}

export interface AnalysisSummary {
  id: string;
  timestamp: string;
  job_title: string | null;
  candidate_name: string | null;
  overall_score: number;
  total_requirements: number;
  matched: number;
  partial: number;
  not_evidenced: number;
  provider: string;
  is_demo_mode: boolean;
}

export interface HealthResponse {
  status: string;
  provider: string;
  is_demo: boolean;
  environment: string;
}

export interface ReportExportRequest {
  analysis_data: AnalysisResponse;
}

export interface CVExportRequest {
  cv_profile: CVProfile;
  approved_suggestion_ids: string[];
  suggestions: RevisionSuggestion[];
}

export type SuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'edited';

export interface UserSuggestionState {
  status: SuggestionStatus;
  editedText?: string;
}
