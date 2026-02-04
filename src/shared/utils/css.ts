export function cssVars(style: Record<string, string>): React.CSSProperties {
  return style as unknown as React.CSSProperties;
}
