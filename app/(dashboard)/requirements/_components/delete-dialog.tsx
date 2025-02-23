'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteRequirement } from '../actions';
import { useToast } from '@/components/ui/use-toast';
import type { StaffingRequirement } from '@/types/models/staffing';
import { Trash2 } from 'lucide-react';

interface DeleteRequirementDialogProps {
  requirement: StaffingRequirement;
}

export function DeleteRequirementDialog({ requirement }: DeleteRequirementDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteRequirement(requirement.id);
      setOpen(false);
      toast({
        title: 'Success',
        description: 'Staffing requirement deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting requirement:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete staffing requirement',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Staffing Requirement</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this staffing requirement? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 