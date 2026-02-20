import { useState, useRef, useEffect } from 'react';
import { BreakType, ValidationViolation } from '../../types';
import { cn } from '../../lib/designSystem';

interface BreakCellProps {
  breakType: BreakType | null;
  onClick?: (breakType: BreakType) => void;
  isSelected?: boolean;
  violations?: ValidationViolation[];
  isEditable?: boolean;
}

const BREAK_COLORS: Record<BreakType, string> = {
  HB1: 'bg-blue-100 text-blue-900 border-blue-300',
  B: 'bg-green-100 text-green-900 border-green-300',
  HB2: 'bg-purple-100 text-purple-900 border-purple-300',
  IN: 'bg-gray-50 text-gray-700 border-gray-200',
};

const BREAK_LABELS: Record<BreakType, string> = {
  HB1: 'HB1',
  B: 'B',
  HB2: 'HB2',
  IN: 'IN',
};

const BREAK_OPTIONS: BreakType[] = ['IN', 'HB1', 'B', 'HB2'];

export default function BreakCell({
  breakType,
  onClick,
  isSelected = false,
  violations = [],
  isEditable = false,
}: BreakCellProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hasErrors = violations.some((v) => v.severity === 'error');
  const hasWarnings = violations.some((v) => v.severity === 'warning');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleCellClick = () => {
    if (isEditable) {
      setShowDropdown(!showDropdown);
    }
  };

  const handleOptionClick = (option: BreakType) => {
    onClick?.(option);
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={cn(
          'relative rounded border px-2 py-1 text-center text-xs font-medium transition-colors',
          breakType ? BREAK_COLORS[breakType] : 'border-gray-200 bg-white text-gray-400',
          isEditable && 'cursor-pointer hover:opacity-80',
          isSelected && 'ring-2 ring-primary-500 ring-offset-1',
          hasErrors && 'border-2 border-red-500',
          hasWarnings && !hasErrors && 'border-2 border-yellow-500'
        )}
        onClick={handleCellClick}
        role={isEditable ? 'button' : undefined}
        tabIndex={isEditable ? 0 : -1}
        onKeyDown={(e) => {
          if (isEditable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleCellClick();
          }
        }}
        aria-label={
          breakType
            ? `Break type ${BREAK_LABELS[breakType]}${isSelected ? ', selected' : ''}${
                hasErrors ? ', has errors' : hasWarnings ? ', has warnings' : ''
              }`
            : 'No break scheduled'
        }
        title={violations.length > 0 ? violations.map((v) => v.message).join(', ') : undefined}
      >
        {breakType ? BREAK_LABELS[breakType] : '-'}
        {hasErrors && (
          <span
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500"
            aria-hidden="true"
          />
        )}
        {hasWarnings && !hasErrors && (
          <span
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-500"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Dropdown menu */}
      {showDropdown && isEditable && (
        <div className="absolute z-50 mt-1 min-w-[80px] rounded-md border border-gray-300 bg-white shadow-lg">
          {BREAK_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              className={cn(
                'w-full px-3 py-2 text-left text-xs transition-colors hover:bg-gray-100',
                option === breakType && 'bg-gray-50 font-semibold',
                'first:rounded-t-md last:rounded-b-md'
              )}
            >
              <span className={cn('inline-block w-full', BREAK_COLORS[option].split(' ')[1])}>
                {BREAK_LABELS[option]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
