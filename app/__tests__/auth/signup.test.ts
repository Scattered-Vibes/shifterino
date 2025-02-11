import { signup } from '@/app/(auth)/actions'
import { createClient } from '@/app/lib/supabase/server'

describe('Signup Flow', () => {
  const testUser = {
    email: 'test.dispatcher@shifterino.com',
    password: 'testpassword123',
    confirmPassword: 'testpassword123',
    first_name: 'Test',
    last_name: 'Dispatcher',
    role: 'DISPATCHER' as const
  }

  it('should create both auth user and employee record', async () => {
    // Attempt signup
    await signup(testUser)
    
    // Get Supabase client
    const supabase = createClient()
    
    // Check auth user
    const { data: authUser } = await supabase.auth.admin.listUsers()
    const user = authUser?.users.find(u => u.email === testUser.email)
    expect(user).toBeTruthy()
    
    // Check employee record
    const { data: employee } = await supabase
      .from('employees')
      .select('*')
      .eq('email', testUser.email)
      .single()
      
    expect(employee).toBeTruthy()
    if (employee) {
      expect(employee.first_name).toBe(testUser.first_name)
      expect(employee.last_name).toBe(testUser.last_name)
      expect(employee.role).toBe(testUser.role.toLowerCase())
    }
  })
}) 