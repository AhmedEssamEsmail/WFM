import { useQuery } from '@tanstack/react-query';
import { shiftConfigurationsService } from '../services/shiftConfigurationsService';
import type { ShiftType } from '../types';

export function useShiftConfigurations() {
  const { data: shiftConfigurations = [], isLoading } = useQuery({
    queryKey: ['shift-configurations'],
    queryFn: () => shiftConfigurationsService.getActiveShiftConfigurations(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  /**
   * Get shift display information from database configuration
   */
  const getShiftDisplay = (shiftType: ShiftType) => {
    const config = shiftConfigurations.find((s) => s.shift_code === shiftType);

    if (!config) {
      // Fallback to basic display
      return {
        name: shiftType,
        timeRange: '',
        color: 'bg-gray-100 text-gray-900',
      };
    }

    // Format time range
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };

    const timeRange =
      config.shift_code === 'OFF'
        ? ''
        : `${formatTime(config.start_time)} - ${formatTime(config.end_time)}`;

    // Map shift codes to colors
    const colorMap: Record<string, string> = {
      AM: 'bg-sky-100 text-sky-900 border-sky-200',
      BET: 'bg-orange-100 text-orange-900 border-orange-200',
      PM: 'bg-purple-100 text-purple-900 border-purple-200',
      OFF: 'bg-gray-200 text-gray-900 border-gray-300',
    };

    return {
      name: config.shift_label,
      timeRange,
      color: colorMap[config.shift_code] || 'bg-gray-100 text-gray-900',
    };
  };

  return {
    shiftConfigurations,
    isLoading,
    getShiftDisplay,
  };
}
