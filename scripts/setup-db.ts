import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase/database';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Ensure required environment variables are set
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

// Constants
const DEFAULT_TEAM_ID = process.env.DEFAULT_TEAM_ID || '00000000-0000-0000-0000-000000000001';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Create Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

// Helper to wait between retries
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Reset database using supabase CLI
async function resetDatabase() {
  console.log('\n🔄 Resetting database...');
  try {
    execSync('supabase db reset --debug', { stdio: 'inherit' });
    console.log('✅ Database reset successful');
  } catch (error) {
    console.error('❌ Failed to reset database:', error);
    throw error;
  }
}

// Generate TypeScript types
async function generateTypes() {
  console.log('\n📝 Generating TypeScript types...');
  try {
    execSync('supabase gen types typescript --local > types/supabase/database.ts', { stdio: 'inherit' });
    console.log('✅ Type generation successful');
  } catch (error) {
    console.error('❌ Failed to generate types:', error);
    throw error;
  }
}

// Verify database connection and required data
async function verifyDatabaseSetup(retries = MAX_RETRIES): Promise<boolean> {
  console.log('\n🔍 Verifying database setup...');
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Check team exists
      const { data: team, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('id, name')
        .eq('id', DEFAULT_TEAM_ID)
        .single();

      if (teamError || !team) {
        throw new Error(`Team check failed: ${teamError?.message || 'Not found'}`);
      }
      console.log('✅ Team verified');

      // Check shift options exist
      const { data: shifts, error: shiftsError } = await supabaseAdmin
        .from('shift_options')
        .select('id');

      if (shiftsError || !shifts || shifts.length === 0) {
        throw new Error(`Shift options check failed: ${shiftsError?.message || 'None found'}`);
      }
      console.log('✅ Shift options verified');

      // Check employees exist
      const { data: employees, error: empError } = await supabaseAdmin
        .from('employees')
        .select('id');

      if (empError || !employees || employees.length === 0) {
        throw new Error(`Employees check failed: ${empError?.message || 'None found'}`);
      }
      console.log('✅ Employees verified');

      return true;
    } catch (error) {
      console.warn(`⚠️ Verification attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) {
        console.error('❌ Database verification failed after all retries');
        throw error;
      }
      console.log(`Waiting ${RETRY_DELAY}ms before next attempt...`);
      await wait(RETRY_DELAY);
    }
  }
  return false;
}

// Create test users
async function createTestUsers() {
  console.log('\n👥 Creating test users...');
  const testUsers = [
    {
      id: '00000000-0000-0000-0000-000000000010',
      email: 'manager@example.com',
      password: 'Password@123',
      firstName: 'Test',
      lastName: 'Manager',
      role: 'manager' as const,
      shiftPattern: '4x10' as const
    },
    {
      id: '00000000-0000-0000-0000-000000000011',
      email: 'supervisor@example.com',
      password: 'Password@123',
      firstName: 'Test',
      lastName: 'Supervisor',
      role: 'supervisor' as const,
      shiftPattern: '3x12_plus_4' as const
    },
    {
      id: '00000000-0000-0000-0000-000000000012',
      email: 'dispatcher@example.com',
      password: 'Password@123',
      firstName: 'Test',
      lastName: 'Dispatcher',
      role: 'dispatcher' as const,
      shiftPattern: '4x10' as const
    }
  ];

  const results = [];

  try {
    for (const testUser of testUsers) {
      console.log(`[createTestUsers] Processing user: ${testUser.email}`);

      // First try to get the existing user
      const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

      if (searchError) {
        console.error(`[createTestUsers] Error fetching users:`, searchError);
        continue;
      }

      let userData = existingUsers?.users.find(user => user.email === testUser.email);

      if (!userData) {
        // User doesn't exist, create them
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true,
          user_metadata: {
            first_name: testUser.firstName,
            last_name: testUser.lastName,
            role: testUser.role,
            shift_pattern: testUser.shiftPattern,
          }
        });

        if (error) {
          console.error(`[createTestUsers] Error creating user ${testUser.email}:`, error);
          continue;
        }

        userData = data.user;
      } else {
        console.log(`[createTestUsers] User ${testUser.email} already exists`);
      }

      if (userData?.id) {
        console.log(`[createTestUsers] Creating/updating employee record for ${testUser.email}`);

        const now = new Date().toISOString();

        // Get the preferred shift category based on shift pattern
        const preferred_shift_category = testUser.shiftPattern === '4x10' ? 'day' : 'swing';

        // Create employee insert data with correct types
        const employeeData = {
          id: testUser.id,
          auth_id: userData.id,
          email: testUser.email,
          first_name: testUser.firstName,
          last_name: testUser.lastName,
          role: testUser.role,
          shift_pattern: testUser.shiftPattern,
          default_weekly_hours: 40,
          weekly_hours_cap: 40,
          max_overtime_hours: 0,
          overtime_hours: 0,
          profile_incomplete: false,
          preferred_shift_category,
          organization_id: '00000000-0000-0000-0000-000000000002',
          team_id: DEFAULT_TEAM_ID,
          created_at: now,
          updated_at: now,
          created_by: userData.id,
          updated_by: userData.id
        } as const;

        // Perform the upsert
        const { data: newEmployee, error: employeeError } = await supabaseAdmin
          .from('employees')
          .upsert(employeeData)
          .select('id')
          .single();

        if (employeeError) {
          console.error(
            `[createTestUsers] Employee creation error for ${testUser.email}:`,
            employeeError
          );
          continue;
        }

        if (!newEmployee?.id) {
          console.error(`[createTestUsers] No employee ID returned for ${testUser.email}`);
          continue;
        }

        // Update user metadata with employee ID
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userData.id,
          {
            user_metadata: {
              ...userData.user_metadata,
              employee_id: newEmployee.id,
            }
          }
        );

        if (updateError) {
          console.error(`[createTestUsers] Error updating user metadata for ${testUser.email}:`, updateError);
          continue;
        }

        results.push({
          email: testUser.email,
          userId: userData.id,
          employeeId: newEmployee.id,
          success: true,
        });
      }
    }

    console.log(`[createTestUsers] Completed creating test users:`, results);
    return { data: results, error: null };
  } catch (error) {
    console.error(`[createTestUsers] Unexpected error:`, error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred'),
    };
  }
}

// Main setup function
async function setupDatabase() {
  try {
    console.log('\n🚀 Starting database setup...');

    // Reset database and apply migrations/seeds
    await resetDatabase();

    // Verify Supabase is running
    console.log('\nVerifying Supabase status...');
    execSync('supabase status', { stdio: 'inherit' });

    // Create test users first
    console.log('\nCreating test users...');
    const { data: users, error: userError } = await createTestUsers();
    if (userError) {
      throw userError;
    }
    
    if (!users || users.length === 0) {
      throw new Error('No test users were created');
    }

    // Then verify database setup
    const isSetupValid = await verifyDatabaseSetup();
    if (!isSetupValid) {
      throw new Error('Database setup verification failed');
    }

    // Generate types
    await generateTypes();

    console.log('\n✨ Database setup completed successfully');
    console.log('\nTest Credentials:');
    console.log('Manager: manager@example.com / Password@123');
    console.log('Supervisor: supervisor@example.com / Password@123');
    console.log('Dispatcher: dispatcher@example.com / Password@123');
  } catch (error) {
    console.error('\n💥 Database setup failed:', error);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (import.meta.url.endsWith('setup-db.ts')) {
  setupDatabase();
}

// Export functions for use in other scripts
export { setupDatabase, resetDatabase, generateTypes, verifyDatabaseSetup };