import type { Skill } from '../../types'

interface SkillsBadgesProps {
  skills: Skill[]
  className?: string
}

export default function SkillsBadges({ skills, className = '' }: SkillsBadgesProps) {
  if (!skills || skills.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {skills.map(skill => (
        <span
          key={skill.id}
          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white"
          style={{ backgroundColor: skill.color }}
          title={skill.description || skill.name}
        >
          {skill.name}
        </span>
      ))}
    </div>
  )
}
