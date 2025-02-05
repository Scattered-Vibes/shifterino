#!/usr/bin/env ts-node
/**
 * Script to generate TypeScript types from Supabase database
 * Run with: npm run generate-types
 */

import { execSync } from 'child_process'
import * as fs from 'fs'

const TYPES_PATH = 'types/database.ts'
const TYPES_DIR = 'types'

// Ensure types directory exists
if (!fs.existsSync(TYPES_DIR)) {
  fs.mkdirSync(TYPES_DIR, { recursive: true })
}

try {
  console.log('🔄 Generating Supabase types...')
  
  // Generate types using Supabase CLI
  execSync('npx supabase gen types typescript --local > ' + TYPES_PATH, {
    stdio: 'inherit',
  })

  // Add export statement at the beginning of the file
  const typesContent = fs.readFileSync(TYPES_PATH, 'utf8')
  const exportStatement = 'export '
  if (!typesContent.startsWith(exportStatement)) {
    fs.writeFileSync(
      TYPES_PATH,
      exportStatement + typesContent
    )
  }

  console.log('✅ Types generated successfully!')
} catch (error) {
  console.error('❌ Error generating types:', error)
  process.exit(1)
} 