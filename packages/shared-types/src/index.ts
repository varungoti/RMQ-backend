// packages/shared-types/src/index.ts

// Example User Type (Expand later)
export interface User {
  id: string; // Assuming UUID or similar
  email: string;
  name?: string;
  // Add roles, profile info, etc.
}

// Example Assessment Result Type (Expand later)
export interface AssessmentResult {
  sessionId: string;
  studentId: string;
  overallLevel: 1 | 2 | 3 | 4; // Using the 4-level scale
  skillScores: Record<string, { level: 1 | 2 | 3 | 4; notes?: string }>; // e.g., { "math.fractions.equivalence": { level: 1 } }
  cognitiveScores: Record<string, { level: 1 | 2 | 3 | 4; notes?: string }>;
  diagnosticInsights?: string[];
  recommendations?: string[];
  timestamp: Date;
}

// Example Skill Definition (Expand later)
export interface Skill {
  id: string; // e.g., "math.fractions.equivalence"
  name: string; // e.g., "Equivalent Fractions"
  subject: 'Math' | 'English' | 'Science' | 'Cognitive';
  description?: string;
}

// Add other shared types (Question, TestSession, Course, etc.) here

console.log('Shared types package loaded'); // Basic log 