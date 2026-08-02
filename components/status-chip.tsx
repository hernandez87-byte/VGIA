interface StatusChipProps {
  tone: "danger" | "warning" | "success" | "neutral";
  children: React.ReactNode;
}

export function StatusChip({ tone, children }: StatusChipProps) {
  return <span className={`status-chip status-${tone}`}>{children}</span>;
}
