/**
 * Shown when a section has no rows. Says what would appear here rather than
 * just "No data", so an empty screen still explains itself.
 */
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
