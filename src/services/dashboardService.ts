// Dashboard service - aggregates data for the dashboard view

import { swapRequestsService } from './swapRequestsService';
import { leaveRequestsService } from './leaveRequestsService';
import type { SwapRequest, LeaveRequest, User } from '../types';

export interface SwapRequestWithUsers extends SwapRequest {
  requester: User;
  target_user: User;
}

export interface LeaveRequestWithUser extends LeaveRequest {
  user: User;
}

export interface DashboardData {
  swapRequests: SwapRequestWithUsers[];
  leaveRequests: LeaveRequestWithUser[];
}

export const dashboardService = {
  /**
   * Get pending items for the dashboard
   * Fetches recent swap and leave requests, filtered and sorted by user role
   * Limited to 10 most recent items for performance
   *
   * @param userId - Current user's ID
   * @param isManager - Whether the user is a manager (TL or WFM)
   * @returns Dashboard data with recent swap and leave requests
   */
  async getPendingItems(userId: string, isManager: boolean): Promise<DashboardData> {
    // Fetch all requests using services
    const [allSwapRequests, allLeaveRequests] = await Promise.all([
      swapRequestsService.getSwapRequests(),
      leaveRequestsService.getLeaveRequests(),
    ]);

    // Filter and sort swap requests
    let filteredSwaps = isManager
      ? allSwapRequests
      : allSwapRequests.filter((r) => r.requester_id === userId || r.target_user_id === userId);

    if (isManager) {
      filteredSwaps = [...filteredSwaps].sort((a, b) => {
        const aPending = a.status.startsWith('pending');
        const bPending = b.status.startsWith('pending');
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Limit to 10 most recent items
    const limitedSwaps = filteredSwaps.slice(0, 10);

    // Map the data to match the expected interface structure
    // Service returns 'target' but interface expects 'target_user'
    const mappedSwaps = limitedSwaps.map((swap) => ({
      ...swap,
      requester: (swap as SwapRequestWithUsers).requester,
      target_user:
        (swap as SwapRequestWithUsers & { target?: User }).target ||
        (swap as SwapRequestWithUsers).target_user,
    })) as SwapRequestWithUsers[];

    // Filter and sort leave requests
    let filteredLeaves = isManager
      ? allLeaveRequests
      : allLeaveRequests.filter((r) => r.user_id === userId);

    if (isManager) {
      filteredLeaves = [...filteredLeaves].sort((a, b) => {
        const aPending = a.status.startsWith('pending');
        const bPending = b.status.startsWith('pending');
        if (aPending && !bPending) return -1;
        if (!aPending && bPending) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }

    // Limit to 10 most recent items
    const limitedLeaves = filteredLeaves.slice(0, 10);

    // Map the data to match the expected interface structure
    // Service returns 'users' (plural) but interface expects 'user' (singular)
    const mappedLeaves = limitedLeaves.map((leave) => ({
      ...leave,
      user:
        (leave as LeaveRequestWithUser & { users?: User }).users ||
        (leave as LeaveRequestWithUser).user,
    })) as LeaveRequestWithUser[];

    return {
      swapRequests: mappedSwaps,
      leaveRequests: mappedLeaves,
    };
  },
};
