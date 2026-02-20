import { format, addDays, subDays } from 'date-fns';
import { BUTTON_STYLES } from '../../lib/designSystem';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const handlePrevious = () => {
    onDateChange(subDays(currentDate, 1));
  };

  const handleNext = () => {
    onDateChange(addDays(currentDate, 1));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
      <button
        onClick={handlePrevious}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        aria-label="Previous day"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
        {!isToday && (
          <button onClick={handleToday} className={`${BUTTON_STYLES.secondary} px-3 py-1 text-xs`}>
            Today
          </button>
        )}
      </div>

      <button
        onClick={handleNext}
        className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        aria-label="Next day"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
