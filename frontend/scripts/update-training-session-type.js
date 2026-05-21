// Script pour mettre a jour le type TrainingSession
const fs = require('fs');
const path = require('path');

const typesPath = path.join(__dirname, '..', 'src', 'types', 'index.ts');
let content = fs.readFileSync(typesPath, 'utf8');

// Ancienne definition
const oldDefinition = `export interface TrainingSession {
  id: string;
  day: number;
  type: string;
  title: string;
  description: string;
  completed: boolean;
  steps: WorkoutStep[];
}`;

// Nouvelle definition avec feedback et result
const newDefinition = `export interface TrainingSession {
  id: string;
  day: number;
  type: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  steps: WorkoutStep[];
  feedback?: {
    difficulty: 'easy' | 'normal' | 'hard';
    rpe: number;
    hasPain: boolean;
    painLocation?: string;
    notes?: string;
  };
  result?: 'success' | 'failed' | 'partial' | 'skipped';
}`;

content = content.replace(oldDefinition, newDefinition);

fs.writeFileSync(typesPath, content, 'utf8');
console.log('✅ TrainingSession type updated successfully');
