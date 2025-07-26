export interface Question {
  id: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  points: number;
  expected_sql?: string;
  expected_laravel?: string;
  hint?: string;
  hint_penalty?: number;
  completed?: boolean;
}

export interface QueryResult {
  is_correct: boolean;
  expected_result: any[];
  user_result: any[];
  points_earned: number;
  message: string;
  error_details?: any;
}

export interface TableColumn {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: string | null;
  Extra: string;
}

export interface TableSchema {
  [tableName: string]: TableColumn[];
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
    expires_at?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export interface QuestionSolution {
  question_id: number;
  title: string;
  sql_solution: string;
  laravel_solution: string;
}