'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createRequirement } from '../actions';
import { useToast } from '@/components/ui/use-toast';
import { RequirementForm } from './requirement-form';
import type { CreateStaffingRequirementInput, UpdateStaffingRequirementInput } from '@/types/models/staffing';
import { Plus } from 'lucide-react';

export function CreateRequirementDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleCreate = async (data: CreateStaffingRequirementInput | UpdateStaffingRequirementInput) => {
    try {
      // Since we're in create mode, we know this will be a CreateStaffingRequirementInput
      await createRequirement(data as CreateStaffingRequirementInput);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Staffing requirement created successfully',
      });
    } catch (error) {
      console.error('Error creating requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to create staffing requirement',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Staffing Requirement</DialogTitle>
        </DialogHeader>
        <RequirementForm 
          onSubmit={handleCreate}
          initialData={{
            time_block_start: '',
            time_block_end: '',
            min_employees: 1,
            requires_supervisor: true,
            crosses_midnight: false,
          }}
          mode="create"
        />
      </DialogContent>
    </Dialog>
  );
} 