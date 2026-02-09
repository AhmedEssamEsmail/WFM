@echo off
echo Running tests...
call npm test -- --run

echo.
echo Adding files to git...
git add src/pages/SwapRequests/SwapRequestDetail.tsx
git add src/services/swapRequestsService.ts
git add supabase/schema.sql
git add supabase/migrations/012_tl_view_agent_leave_balances.sql

echo.
echo Committing changes...
git commit -m "Fix swap request timeline to show rejection at correct stage

- Prioritize status over timestamps in timeline display
- Show rejection indicator at the correct approval stage (Target/TL/WFM)
- Target decline: red X at Target Acceptance
- TL reject: red X at TL Approval with green at Target
- WFM reject: red X at WFM Approval with green at Target and TL
- Clear approval timestamps when revoking to reset timeline
- Use updated request object when executing swap"

echo.
echo Pushing to remote...
git push

echo.
echo Done!
pause
