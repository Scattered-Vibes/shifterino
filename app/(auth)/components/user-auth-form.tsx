'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/app/lib/supabase/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { loginSchema, signupSchema, type SignupInput } from '@/app/lib/validations/auth'
import { handleError } from '@/app/lib/utils/error-handler'

interface UserAuthFormProps {
  className?: string
}

export function UserAuthForm({ className }: UserAuthFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()
  const [isLoading, setIsLoading] = React.useState(false)

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'EMPLOYEE',
    },
  })

  async function onSignIn(data: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        const appError = handleError(error)
        toast({
          title: 'Error',
          description: appError.message,
          variant: 'destructive',
        })
        return
      }

      router.refresh()
      router.push('/overview')
      
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      })
    } catch (error) {
      const appError = handleError(error)
      toast({
        title: 'Error',
        description: appError.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function onSignUp(data: z.infer<typeof signupSchema>) {
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        const appError = handleError(error)
        toast({
          title: 'Error',
          description: appError.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Check your email',
        description: 'We sent you a confirmation link to complete your registration.',
      })
    } catch (error) {
      const appError = handleError(error)
      toast({
        title: 'Error',
        description: appError.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tabs defaultValue="signin" className={className}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Sign Up</TabsTrigger>
      </TabsList>
      
      <TabsContent value="signin">
        <Form {...loginForm}>
          <form onSubmit={loginForm.handleSubmit(onSignIn)} className="space-y-4">
            <FormField
              control={loginForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={loginForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Form>
      </TabsContent>

      <TabsContent value="signup">
        <Form {...signupForm}>
          <form onSubmit={signupForm.handleSubmit(onSignUp)} className="space-y-4">
            <FormField
              control={signupForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="name@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={signupForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signupForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={signupForm.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border px-3 py-2"
                    >
                      <option value="EMPLOYEE">Employee</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  )
} 