import { useState, useRef, useEffect } from 'react'
import { useSkills } from '../../hooks/useSkills'

interface SkillsMultiSelectProps {
  selectedSkillIds: string[]
  onChange: (skillIds: string[]) => void
  label?: string
  placeholder?: string
}

export default function SkillsMultiSelect({
  selectedSkillIds,
  onChange,
  label = 'Skills',
  placeholder = 'Select skills...'
}: SkillsMultiSelectProps) {
  const { skills, isLoading } = useSkills(true) // Only active skills
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedSkills = skills.filter(skill => selectedSkillIds.includes(skill.id))

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      onChange(selectedSkillIds.filter(id => id !== skillId))
    } else {
      onChange([...selectedSkillIds, skillId])
    }
  }

  const removeSkill = (skillId: string) => {
    onChange(selectedSkillIds.filter(id => id !== skillId))
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      {/* Selected skills badges */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedSkills.map(skill => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
              style={{ backgroundColor: skill.color }}
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="hover:bg-black hover:bg-opacity-20 rounded-full p-0.5"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-left flex items-center justify-between"
      >
        <span className="text-gray-500 text-sm">
          {selectedSkills.length > 0 
            ? `${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} selected`
            : placeholder
          }
        </span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-gray-500">Loading skills...</div>
          ) : skills.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No skills available</div>
          ) : (
            <div className="py-1">
              {skills.map(skill => (
                <label
                  key={skill.id}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedSkillIds.includes(skill.id)}
                    onChange={() => toggleSkill(skill.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-3"
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded border border-gray-300" 
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
  )
}
