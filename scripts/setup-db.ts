// scripts/setup-db.ts
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { execSync, exec } from 'child_process'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase/database'
import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import util from 'util'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Ensure required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

// Constants
const DEFAULT_TEAM_ID = process.env.DEFAULT_TEAM_ID || '00000000-0000-0000-0000-000000000001'
const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000002'
const SUPABASE_RESTART_WAIT = 5000 // 5 seconds wait after restart
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

// Add custom RPC types
type CustomRPCResponse = {
  data: null
  error: null | {
    message: string
    details: string
  }
}

// Extend the Database type to include our custom functions
interface ExtendedDatabase extends Database {
  public: Database['public'] & {
    Functions: Database['public']['Functions'] & {
      execute_sql: {
        Args: { query: string }
        Returns: void
      }
      begin_transaction: {
        Args: Record<string, never>
        Returns: boolean
      }
      commit_transaction: {
        Args: Record<string, never>
        Returns: boolean
      }
      rollback_transaction: {
        Args: Record<string, never>
        Returns: boolean
      }
      set_my_claim: {
        Args: { uid: string; claim: string; value: string }
        Returns: boolean
      }
    }
  }
}

const supabaseAdmin = createClient<ExtendedDatabase>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
)

const execAsync = util.promisify(exec)

async function ensureSupabaseRunning() {
  console.log('🔍 Checking Supabase status...')
  try {
    // Try to get Supabase status
    const { stdout } = await execAsync('npx supabase status')
    if (stdout.includes('not running')) {
      console.log('🚀 Starting Supabase...')
      await execAsync('npx supabase start')
      
      // Wait for services to initialize
      const initWaitTime = 15
      console.log(`⏳ Waiting ${initWaitTime} seconds for services to initialize...`)
      await new Promise(resolve => setTimeout(resolve, initWaitTime * 1000))
    } else {
      console.log('✅ Supabase is already running')
    }
  } catch (error) {
    // If status check fails, assume not running and try to start
    console.log('🚀 Starting Supabase...')
    try {
      await execAsync('npx supabase start')
      
      // Wait for services to initialize
      const initWaitTime = 15
      console.log(`⏳ Waiting ${initWaitTime} seconds for services to initialize...`)
      await new Promise(resolve => setTimeout(resolve, initWaitTime * 1000))
    } catch (startError) {
      console.error('❌ Failed to start Supabase:', startError)
      throw new Error('Failed to start Supabase services')
    }
  }
}

async function resetDatabase() {
  console.log('♻️ Resetting database...')
  try {
    // Ensure Supabase is running first
    await ensureSupabaseRunning()

    // Drop schema and recreate it
    const resetSql = `
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      DROP TABLE IF EXISTS employees CASCADE;
      GRANT ALL ON SCHEMA public TO postgres;
      GRANT ALL ON SCHEMA public TO anon;
      GRANT ALL ON SCHEMA public TO authenticated;
      GRANT ALL ON SCHEMA public TO service_role;
    `

    // First try to reset via SQL
    try {
      const { error: sqlError } = await supabaseAdmin.rpc('execute_sql', {
        query: resetSql
      })
      
      if (sqlError) {
        console.warn('⚠️ SQL reset failed, falling back to CLI reset:', sqlError)
        throw sqlError
      }
      
      console.log('✅ Database reset via SQL completed.')
    } catch (error) {
      // Fall back to CLI reset if SQL reset fails
      console.log('🔄 Falling back to CLI reset...')
      execSync('npx supabase db reset --debug', { stdio: 'inherit' })
      console.log('✅ Database reset via CLI completed.')
    }

    // Verify the reset was successful by checking schema cache
    console.log('🔍 Verifying database reset...')
    const isSchemaReady = await verifySchemaCache()
    
    if (!isSchemaReady) {
      throw new Error('Database reset verification failed: Schema cache not ready')
    }

    console.log('✅ Database reset verified.')
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    throw error
  }
}

async function verifySchemaCache(): Promise<boolean> {
  const maxAttempts = 3;
  const waitTimeSeconds = 5;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`🔍 Verifying schema cache (attempt ${attempt}/${maxAttempts})...`);
      
      // Try multiple queries to verify schema
      const queries = [
        'SELECT column_name FROM information_schema.columns WHERE table_name = \'employees\'',
        'SELECT * FROM employees LIMIT 1',
        'SELECT current_database()'
      ];
      
      for (const query of queries) {
        try {
          await supabaseAdmin.from('employees').select('created_by').limit(1);
          console.log('✅ Schema cache verified successfully');
          return true;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.log(`⚠️ Query failed: ${errorMessage}`);
          // Continue to next query
        }
      }
      
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${waitTimeSeconds} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, waitTimeSeconds * 1000));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Schema verification error: ${errorMessage}`);
      if (attempt < maxAttempts) {
        console.log(`⏳ Waiting ${waitTimeSeconds} seconds before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, waitTimeSeconds * 1000));
      }
    }
  }
  
  return false;
}

async function restartSupabase() {
  console.log('🔄 Restarting Supabase services...');
  
  try {
    // Stop services with --no-backup to skip backup
    console.log('Stopping Supabase services...');
    await execAsync('npx supabase stop --no-backup');
    console.log('✅ Services stopped');
    
    // Small delay to ensure clean shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start services
    console.log('Starting Supabase services...');
    await execAsync('npx supabase start');
    console.log('✅ Services started');
    
    // Wait for services to initialize
    const initWaitTime = 15;
    console.log(`⏳ Waiting ${initWaitTime} seconds for services to initialize...`);
    await new Promise(resolve => setTimeout(resolve, initWaitTime * 1000));
    
    // Verify schema cache
    console.log('Verifying schema cache...');
    const isSchemaReady = await verifySchemaCache();
    
    if (!isSchemaReady) {
      throw new Error(
        'Schema cache failed to refresh. Please try:\n' +
        '1. Running `npx supabase stop` then `npx supabase start`\n' +
        '2. Checking Supabase logs with `npx supabase logs`\n' +
        '3. Verifying database connectivity\n' +
        '4. Ensuring all migrations completed successfully'
      );
    }
    
    console.log('✅ Supabase services restarted successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to restart Supabase services:', errorMessage);
    throw new Error('Failed to restart Supabase services. Please try restarting manually.');
  }
}

async function recreateHelperFunctions() {
  console.log('🛠️ Recreating helper functions...')
  try {
    // First, create the execute_sql function
    const createExecuteSql = `
      CREATE OR REPLACE FUNCTION execute_sql(query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $$
      BEGIN
          EXECUTE query;
      END;
      $$;

      GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;
    `

    const { error: execSqlError } = await supabaseAdmin.rpc('execute_sql', {
      query: createExecuteSql
    })

    if (execSqlError) {
      throw new Error(`Failed to create execute_sql function: ${execSqlError.message}`)
    }

    // Now create the other helper functions
    const sqlFilePath = path.resolve(__dirname, '../supabase/migrations/20240322000005_rls_policies.sql')
    const sqlContent = await fsPromises.readFile(sqlFilePath, 'utf8')

    // Extract and execute only the helper functions (is_manager, is_supervisor_or_above, get_team_members)
    const helperFunctions = [
      extractFunction(sqlContent, 'is_manager'),
      extractFunction(sqlContent, 'is_supervisor_or_above'),
      extractFunction(sqlContent, 'get_team_members')
    ]

    for (const func of helperFunctions) {
      if (!func) continue
      
      const { error } = await supabaseAdmin.rpc('execute_sql', {
        query: func
      })

      if (error) {
        throw new Error(`Failed to execute SQL: ${error.message}\nStatement: ${func}`)
      }
    }

    console.log('✅ Helper functions recreated successfully')
  } catch (error) {
    console.error('❌ Failed to recreate helper functions:', error)
    throw error
  }
}

// Helper function to extract a function definition from SQL content
function extractFunction(sqlContent: string, functionName: string): string | null {
  const regex = new RegExp(`CREATE OR REPLACE FUNCTION ${functionName}[\\s\\S]*?\\$\\$;`, 'i')
  const match = sqlContent.match(regex)
  return match ? match[0] : null
}

function generatePassword() {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
  const length = 16 // Increased for better security
  return Array.from(
    { length },
    () => charset.charAt(Math.floor(Math.random() * charset.length))
  ).join('')
}

async function verifyTeamExists() {
  console.log('\n🔍 Verifying default team exists...')
  try {
    const { data: team, error } = await supabaseAdmin
      .from('teams')
      .select('id, name')
      .eq('id', DEFAULT_TEAM_ID)
      .single()

    if (error) {
      throw new Error(`Failed to verify team: ${error.message}`)
    }

    if (!team) {
      throw new Error(`Default team (${DEFAULT_TEAM_ID}) not found. Please ensure migrations have been run.`)
    }

    if (team.name !== '911 Dispatch') {
      throw new Error(`Team name mismatch. Expected '911 Dispatch' but found '${team.name}'`)
    }

    console.log('✅ Default team verified')
    return team.id
  } catch (error) {
    console.error('❌ Team verification failed:', error)
    throw error
  }
}

type UserRole = Database['public']['Enums']['employee_role']
type ShiftPattern = Database['public']['Enums']['shift_pattern']

interface TestUser {
  email: string
  role: UserRole
  first_name: string
  last_name: string
  shift_pattern: ShiftPattern
}

async function createOrganization() {
  console.log('\n🏢 Creating organization...')
  try {
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .insert({
        id: DEFAULT_ORG_ID,
        name: '911 Dispatch Center',
        contact_info: {
          address: '123 Emergency St',
          phone: '555-0911',
          email: 'admin@911dispatch.com'
        }
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log('✅ Organization created successfully')
    return org.id
  } catch (error) {
    console.error('❌ Failed to create organization:', error)
    throw error
  }
}

async function createTestUsers() {
  console.log('👥 Creating test users...')

  // Verify schema cache before proceeding
  const isReady = await verifySchemaCache()
  if (!isReady) {
    throw new Error('Schema cache not ready. Cannot create test users.')
  }

  // Create organization first
  const orgId = await createOrganization()

  const users: TestUser[] = [
    { email: 'manager@example.com', role: 'manager', first_name: 'Manager', last_name: 'User', shift_pattern: '4x10' },
    { email: 'supervisor@example.com', role: 'supervisor', first_name: 'Supervisor', last_name: 'User', shift_pattern: '4x10' },
    { email: 'dispatcher1@example.com', role: 'dispatcher', first_name: 'Dispatcher', last_name: 'One', shift_pattern: '4x10' },
    { email: 'dispatcher2@example.com', role: 'dispatcher', first_name: 'Dispatcher', last_name: 'Two', shift_pattern: '3x12_plus_4' },
  ]

  // Verify team exists first
  await verifyTeamExists()

  let createdUsers = 0
  for (const user of users) {
    const password = generatePassword()
    console.log(`\n📝 Creating user: ${user.email}`)
    console.log(`  Password: ${password}`)

    let retries = MAX_RETRIES
    let success = false

    while (retries > 0 && !success) {
      try {
        // Create auth user first
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: password,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
          },
        })

        if (authError) throw authError
        if (!authUser.user) throw new Error('No user data returned')

        console.log(`  ✅ Auth user created: ${authUser.user.id}`)

        // Create employee record with retry logic for UUID generation
        let employeeCreated = false
        let employeeRetries = 3

        while (!employeeCreated && employeeRetries > 0) {
          const employeeId = randomUUID()
          const { error: employeeError } = await supabaseAdmin
            .from('employees')
            .insert({
              id: employeeId,
              auth_id: authUser.user.id,
              organization_id: orgId,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
              shift_pattern: user.shift_pattern,
              team_id: DEFAULT_TEAM_ID,
              weekly_hours_cap: 40,
              created_by: authUser.user.id,
              updated_by: authUser.user.id,
              profile_incomplete: false,
            })

          if (!employeeError) {
            employeeCreated = true
            console.log(`  ✅ Employee record created: ${employeeId}`)
          } else if (employeeError.code === '23505') { // Unique violation
            employeeRetries--
            console.log(`  ⚠️ UUID collision, retrying... (${employeeRetries} attempts remaining)`)
            await new Promise(resolve => setTimeout(resolve, 100))
          } else {
            // If employee creation fails, delete the auth user
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
            throw employeeError
          }
        }

        if (!employeeCreated) {
          // If we couldn't create the employee after all retries, delete the auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          throw new Error('Failed to create employee record after multiple attempts')
        }

        console.log(`  ✨ User setup completed successfully`)
        success = true
        createdUsers++
      } catch (error) {
        retries--
        if (retries > 0) {
          console.warn(`  ⚠️ Error creating user, retrying... (${retries} attempts remaining):`, error)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        } else {
          console.error(`❌ Failed to create user ${user.email} after all retries:`, error)
        }
      }
    }
  }

  if (createdUsers === 0) {
    throw new Error('Failed to create any users')
  }

  console.log(`\n✅ Created ${createdUsers} test users successfully`)
}

async function setup() {
  try {
    console.log('\n🚀 Starting database setup...')

    // Phase 1: Schema Setup
    console.log('\n📦 Phase 1: Setting up schema...')
    await resetDatabase()
    await restartSupabase()
    await recreateHelperFunctions()
    
    // Generate types immediately after schema is ready
    console.log('\n📝 Generating updated types...')
    execSync('npx supabase gen types typescript --project-id dvnzmtowppsbfxkwgnod > types/supabase/database.ts', { stdio: 'inherit' })
    console.log('✅ Types generated successfully')
    
    // Small delay to ensure types are written to disk
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Phase 2: Data Setup
    console.log('\n🔄 Phase 2: Setting up initial data...')
    await createTestUsers()

    console.log('\n✨ Database setup complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n💥 Database setup failed:', error)
    process.exit(1)
  }
}

// Run setup only if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setup()
}

// Export for programmatic usage
export { setup }