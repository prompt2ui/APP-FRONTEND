/** Case Builder categories — aligned with `prompt.py` vocabulary */

export function categoryBadgeClass(categoryKey: string): string {
  switch (categoryKey) {
    case "functional":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/35"
    case "visual":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/35"
    case "performance":
      return "bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-500/35"
    case "error handling":
      return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/35"
    default:
      return "bg-muted text-muted-foreground border border-border"
  }
}

export function normalizeCategoryKey(raw: string): string {
  const t = raw.trim().toLowerCase()
  if (t === "error handling") return "error handling"
  if (t === "functional" || t === "visual" || t === "performance") return t
  return ""
}

export function formatCategoryLabel(raw: string): string {
  const t = raw.trim()
  if (!t) return ""
  if (t.toLowerCase() === "error handling") return "Error handling"
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}
