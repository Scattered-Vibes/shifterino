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
import { updateRequirement } from '../actions';
import { useToast } from '@/components/ui/use-toast';
import { RequirementForm } from './requirement-form';
import type { StaffingRequirement, UpdateStaffingRequirementInput, CreateStaffingRequirementInput } from '@/types/models/staffing';
import { Edit } from 'lucide-react';

interface EditRequirementDialogProps {
  requirement: StaffingRequirement;
}

export function EditRequirementDialog({ requirement }: EditRequirementDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async (data: UpdateStaffingRequirementInput | CreateStaffingRequirementInput) => {
    try {
      // Since we're in edit mode, we know this will be an UpdateStaffingRequirementInput
      await updateRequirement(requirement.id, data as UpdateStaffingRequirementInput);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Staffing requirement updated successfully',
      });
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update staffing requirement',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Staffing Requirement</DialogTitle>
        </DialogHeader>
        <RequirementForm 
          onSubmit={handleUpdate}
          initialData={{
            time_block_start: requirement.time_block_start,
            time_block_end: requirement.time_block_end,
            min_employees: requirement.min_employees,
            requires_supervisor: requirement.requires_supervisor,
            crosses_midnight: requirement.crosses_midnight,
          }}
          mode="update"
          requirementId={requirement.id}
        />
      </DialogContent>
    </Dialog>
  );
} 