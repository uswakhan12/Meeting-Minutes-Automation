export default function SectionHeader({ icon: Icon, title, description, accent }) {
  const accentClass =
    accent === 'amber'
      ? 'text-amber-600 dark:text-amber-400'
      : accent === 'indigo'
        ? 'text-indigo-600 dark:text-indigo-400'
        : 'text-slate-500 dark:text-slate-400'

  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${accentClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      )}
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}
