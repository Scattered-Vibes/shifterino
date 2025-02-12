"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2 } from "lucide-react"

import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Database } from "@/types/supabase/database"

interface ConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => void
  trigger: React.ReactNode
}

interface ShiftSwapRequest {
  id: string
  status: string
  requesting_shift_id: string
  target_shift_id: string
}

function ConfirmDialog({ title, description, onConfirm, trigger }: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function ShiftSwapsPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([])
  const router = useRouter()
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { toast } = useToast()

  const fetchSwapRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("shift_swap_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setSwapRequests(data || [])
    } catch (error) {
      console.error("Error fetching swap requests:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch swap requests. Please try again.",
      })
    }
  }, [supabase, toast])

  useEffect(() => {
    void fetchSwapRequests()

    const channel = supabase
      .channel("shift-swap-requests")
      .on(
        "postgres_changes" as "system",
        {
          event: "*",
          schema: "public",
          table: "shift_swap_requests",
        },
        (payload: { new: ShiftSwapRequest }) => {
          console.log("Change received!", payload)
          void fetchSwapRequests()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, fetchSwapRequests])

  async function handleApproveSwap(requestingShiftId: string, targetShiftId: string) {
    try {
      setIsLoading(true)
      const { error } = await supabase.rpc("swap_shifts", {
        requesting_shift_id: requestingShiftId,
        target_shift_id: targetShiftId,
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Shift swap approved successfully.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error approving swap:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve shift swap. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRejectSwap(swapRequestId: string) {
    try {
      setIsLoading(true)
      const { error } = await supabase
        .from("shift_swap_requests")
        .update({ status: "rejected" })
        .eq("id", swapRequestId)

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Shift swap rejected successfully.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error rejecting swap:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject shift swap. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="mb-8 text-2xl font-bold">Shift Swap Requests</h1>
      {isLoading && (
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}
      <div className="grid gap-4">
        {swapRequests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-lg bg-white p-6 shadow"
          >
            <div>
              <h3 className="font-semibold">
                Swap Request #{request.id.slice(0, 8)}
              </h3>
              <p className="text-gray-600">
                Status: <span className="capitalize">{request.status}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {request.status === "pending" && (
                <>
                  <ConfirmDialog
                    title="Approve Shift Swap"
                    description="Are you sure you want to approve this shift swap request?"
                    onConfirm={() =>
                      handleApproveSwap(
                        request.requesting_shift_id,
                        request.target_shift_id
                      )
                    }
                    trigger={
                      <Button variant="default" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    }
                  />
                  <ConfirmDialog
                    title="Reject Shift Swap"
                    description="Are you sure you want to reject this shift swap request?"
                    onConfirm={() => handleRejectSwap(request.id)}
                    trigger={
                      <Button variant="destructive" disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Reject"
                        )}
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>
        ))}
        {swapRequests.length === 0 && !isLoading && (
          <p className="text-center text-gray-600">No shift swap requests found.</p>
        )}
      </div>
    </div>
  )
} 