import { SupportedLanguage } from '../types/room';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'javascript', 'typescript', 'python', 'java', 'cpp',
  'go', 'rust', 'html', 'css', 'json', 'markdown'
];

export const EXECUTABLE_LANGUAGES: SupportedLanguage[] = [
  'javascript', 'typescript', 'python', 'java', 'cpp'
];

export function isSupportedLanguage(lang: string): lang is SupportedLanguage {
  return SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
}

export function isExecutableLanguage(lang: string): boolean {
  return EXECUTABLE_LANGUAGES.includes(lang as SupportedLanguage);
}

export function sanitizeUserName(name: string): string {
  return name.trim().slice(0, 32).replace(/[<>&"']/g, '');
}

export function getLanguageFromFilename(filename: string): SupportedLanguage {
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, SupportedLanguage> = {
    js: 'javascript', jsx: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp', cc: 'cpp', cxx: 'cpp', c: 'cpp',
    go: 'go',
    rs: 'rust',
    html: 'html', htm: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown',
  };
  return map[ext ?? ''] ?? 'javascript';
}
