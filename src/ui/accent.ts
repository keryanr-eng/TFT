export function withAlpha(color: string, alpha: number): string {
  const normalized = color.trim();

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((value) => `${value}${value}`)
            .join("")
        : hex;

    if (expanded.length === 6) {
      const r = Number.parseInt(expanded.slice(0, 2), 16);
      const g = Number.parseInt(expanded.slice(2, 4), 16);
      const b = Number.parseInt(expanded.slice(4, 6), 16);

      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  return `rgba(96, 165, 250, ${alpha})`;
}
