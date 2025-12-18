interface TechStackBadgesProps {
  technologies: string[]
}

export function TechStackBadges({ technologies }: TechStackBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {technologies.map((tech, idx) => (
        <span
          key={idx}
          className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
        >
          {tech}
        </span>
      ))}
    </div>
  )
}
