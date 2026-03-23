import { LanguageConfig, SupportedLanguage } from '../types';

export const LANGUAGE_CONFIGS: Record<SupportedLanguage, LanguageConfig> = {
  javascript: {
    image: 'collab-executor-js:latest',
    filename: 'solution.js',
    runCmd: ['node', '--max-old-space-size=128', 'solution.js'],
    fileExtension: 'js',
  },
  typescript: {
    image: 'collab-executor-js:latest',
    filename: 'solution.ts',
    compileCmd: ['npx', 'ts-node', '--transpile-only', 'solution.ts'],
    runCmd: ['npx', 'ts-node', '--transpile-only', 'solution.ts'],
    fileExtension: 'ts',
  },
  python: {
    image: 'collab-executor-python:latest',
    filename: 'solution.py',
    runCmd: ['python3', '-u', 'solution.py'],
    fileExtension: 'py',
  },
  java: {
    image: 'collab-executor-java:latest',
    filename: 'Solution.java',
    compileCmd: ['javac', 'Solution.java'],
    runCmd: ['java', '-Xmx128m', '-Xss4m', 'Solution'],
    fileExtension: 'java',
  },
  cpp: {
    image: 'collab-executor-cpp:latest',
    filename: 'solution.cpp',
    compileCmd: ['g++', '-O2', '-std=c++17', '-o', 'solution', 'solution.cpp'],
    runCmd: ['./solution'],
    fileExtension: 'cpp',
  },
};
