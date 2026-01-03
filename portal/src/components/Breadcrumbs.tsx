import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  path?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null

  return (
    <nav className="flex items-center gap-2 text-sm text-slate-600 mb-4">
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isClickable = item.path && !isLast

        return (
          <div key={index} className="flex items-center gap-2">
            {isClickable ? (
              <Link
                to={item.path!}
                className="hover:text-slate-900 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-900 font-medium' : ''}>
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

