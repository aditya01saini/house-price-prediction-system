/** Consistent page/section heading block. */
export default function SectionHeading({ eyebrow, title, description, align = 'left' }) {
  const alignment = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';
  return (
    <div className={`flex max-w-2xl flex-col gap-2 ${alignment}`}>
      {eyebrow && (
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/90">{eyebrow}</span>
      )}
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {description && <p className="text-sm leading-relaxed text-slate-400 sm:text-base">{description}</p>}
    </div>
  );
}
