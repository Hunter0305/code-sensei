/**
 * cn — className utility (clsx-like without the dependency)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
