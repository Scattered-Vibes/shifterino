'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { CreateStaffingRequirementInput, UpdateStaffingRequirementInput } from '@/types/models/staffing';

const requirementFormSchema = z.object({
  time_block_start: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  time_block_end: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  min_employees: z.number().min(1, 'Must have at least 1 employee'),
  requires_supervisor: z.boolean(),
  crosses_midnight: z.boolean(),
});

type RequirementFormValues = z.infer<typeof requirementFormSchema>;

interface RequirementFormProps {
  onSubmit: (data: CreateStaffingRequirementInput | UpdateStaffingRequirementInput) => Promise<void>;
  initialData?: Partial<CreateStaffingRequirementInput>;
  mode?: 'create' | 'update';
  requirementId?: string;
}

export function RequirementForm({ onSubmit, initialData, mode = 'create', requirementId }: RequirementFormProps) {
  const form = useForm<RequirementFormValues>({
    resolver: zodResolver(requirementFormSchema),
    defaultValues: {
      time_block_start: initialData?.time_block_start || '',
      time_block_end: initialData?.time_block_end || '',
      min_employees: initialData?.min_employees || 1,
      requires_supervisor: initialData?.requires_supervisor || true,
      crosses_midnight: initialData?.crosses_midnight || false,
    },
  });

  const handleSubmit = async (data: RequirementFormValues) => {
    if (mode === 'update' && requirementId) {
      await onSubmit({ ...data, id: requirementId });
    } else {
      await onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="time_block_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Time (HH:mm)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="09:00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="time_block_end"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Time (HH:mm)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="17:00" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="min_employees"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Employees</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  {...field} 
                  onChange={e => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requires_supervisor"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Requires Supervisor</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crosses_midnight"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>Crosses Midnight</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Save Requirement
        </Button>
      </form>
    </Form>
  );
} 