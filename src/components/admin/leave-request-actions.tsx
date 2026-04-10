'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LeaveApprovalDialog } from '@/components/admin/leave-approval-dialog';
import { type LeaveRequest } from '@/services/database/leave-requests';

export function LeaveRequestActions({ request }: { request: LeaveRequest }) {
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setApprovalDialogOpen(true)}
      >
        Review
      </Button>
      <LeaveApprovalDialog
        request={request}
        open={approvalDialogOpen}
        onOpenChange={setApprovalDialogOpen}
        onSuccess={() => window.location.reload()}
      />
    </>
  );
}
