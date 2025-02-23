'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { StaffingRequirement } from '@/types/models/staffing';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { EditRequirementDialog } from './edit-dialog';
import { DeleteRequirementDialog } from './delete-dialog';
import { CreateRequirementDialog } from './create-dialog';

export default function RequirementsDataTable() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: requirements = [] } = useQuery({
    queryKey: ['staffing_requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staffing_requirements')
        .select('*')
        .order('time_block_start');
      
      if (error) throw error;
      return data as StaffingRequirement[];
    },
  });

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('staffing_requirements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'staffing_requirements',
        },
        () => {
          void queryClient.refetchQueries({ queryKey: ['staffing_requirements'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateRequirementDialog />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time Block</TableHead>
            <TableHead>Minimum Staff</TableHead>
            <TableHead>Supervisor Required</TableHead>
            <TableHead>Crosses Midnight</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requirements.map((requirement) => (
            <TableRow key={requirement.id}>
              <TableCell>
                {format(new Date(`2000-01-01T${requirement.time_block_start}`), 'h:mm a')} - 
                {format(new Date(`2000-01-01T${requirement.time_block_end}`), 'h:mm a')}
              </TableCell>
              <TableCell>{requirement.min_employees}</TableCell>
              <TableCell>{requirement.requires_supervisor ? 'Yes' : 'No'}</TableCell>
              <TableCell>{requirement.crosses_midnight ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <EditRequirementDialog requirement={requirement} />
                  <DeleteRequirementDialog requirement={requirement} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 