@echo off
git add src/pages/SwapRequests/SwapRequestDetail.tsx
git add src/services/swapRequestsService.ts
git add supabase/schema.sql
git add supabase/migrations/012_tl_view_agent_leave_balances.sql
git commit -m "Fix swap request approval timeline and leave balance visibility

- Clear approval timestamps when revoking swap requests to fix timeline display
- Use updated request object when executing swap to prevent validation errors
- Add RLS policy to allow TLs to view all agent leave balances
- Add clearApprovalTimestamps method to swap requests service"
git push
