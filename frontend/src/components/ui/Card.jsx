/** Shared card shells used across pages. */

export function Card({ children, className = '', as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`glass-card p-5 sm:p-6 ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

/** Card header with title + optional description. */
export function CardHeader({ title, description, action = null, id }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 id={id} className="text-base font-semibold text-white">
          {title}
        </h3>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
