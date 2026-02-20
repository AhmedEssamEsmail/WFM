import { useState, useRef, useEffect } from 'react';
import { useSkills } from '../../hooks/useSkills';

interface SkillsFilterProps {
  selectedSkillIds: string[];
  onChange: (skillIds: string[]) => void;
}

export default function SkillsFilter({ selectedSkillIds, onChange }: SkillsFilterProps) {
  const { skills, isLoading } = useSkills(true); // Only active skills
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedSkills = skills.filter((skill) => selectedSkillIds.includes(skill.id));

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      onChange(selectedSkillIds.filter((id) => id !== skillId));
    } else {
      onChange([...selectedSkillIds, skillId]);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label htmlFor="skills-filter" className="mb-1 block text-sm font-medium text-gray-700">
        Filter by Skills
      </label>

      {/* Dropdown trigger */}
      <button
        type="button"
        id="skills-filter"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-left text-sm shadow-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
      >
        <span className="text-gray-700">
          {selectedSkills.length > 0
            ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
            : 'All skills'}
        </span>
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180 transform' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No skills available</div>
          ) : (
            <div className="py-1">
              {skills.map((skill) => (
                <label
                  key={skill.id}
                  className="flex cursor-pointer items-center px-3 py-2 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="mr-3 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex flex-1 items-center gap-2">
                    <div
                      className="h-3 w-3 rounded border border-gray-300"
                      style={{ backgroundColor: skill.color }}
                    />
                    <span className="text-sm text-gray-900">{skill.name}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
