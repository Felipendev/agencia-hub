export function Table({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto rounded-[var(--hub-radius-lg)] border border-[var(--hub-border)] shadow-[var(--hub-shadow-xs)] ${className}`}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-[var(--hub-border)] bg-[var(--hub-bg-subtle)] px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--hub-text-muted)] ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={`border-b border-[var(--hub-border)] px-4 py-3 text-[var(--hub-text-primary)] last-of-type:border-0 ${className}`}>
      {children}
    </td>
  );
}

export function Tr({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <tr className={`transition-colors hover:bg-[var(--hub-bg-subtle)]/60 ${className}`}>
      {children}
    </tr>
  );
}
