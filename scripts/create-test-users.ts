import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const supabaseAdmin = createClient(
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

async function createTestUsers() {
  // Read user data from JSON file
  const userDataPath = path.join(__dirname, 'test-users.json');
  const userData = JSON.parse(await fs.readFile(userDataPath, 'utf-8'));

  for (const user of userData) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Important: Confirm the email immediately
      user_metadata: { role: user.role }
    });

    if (error) {
      console.error(`Error creating user ${user.email}:`, error);
      continue;
    }
    console.log("user created: ", data.user?.email)

    const { error: insertError } = await supabaseAdmin
      .from('employees')
      .insert([
        {
          auth_id: data.user?.id,
          employee_id: user.employeeId,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
          shift_pattern: user.shiftPattern,
          team_id: '00000000-0000-0000-0000-000000000001' // Default team ID
        },
      ]);

    if (insertError) {
      console.error(`Error inserting employee data for ${user.email}:`, insertError);
    }
  }
}
createTestUsers().catch(console.error); 