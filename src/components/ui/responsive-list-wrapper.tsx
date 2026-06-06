import React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableHeader } from "@/components/ui/table"

interface ResponsiveListWrapperProps<T> {
  items: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  renderTableHeader: () => React.ReactNode
  renderTableRow: (item: T, index: number) => React.ReactNode
  emptyState: React.ReactNode
  className?: string
}

export function ResponsiveListWrapper<T>({
  items,
  renderCard,
  renderTableHeader,
  renderTableRow,
  emptyState,
  className,
}: ResponsiveListWrapperProps<T>) {
  if (items.length === 0) return <>{emptyState}</>

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile Card List View (Visible only on screens < sm) */}
      <div className="flex flex-col gap-4 sm:hidden">
        {items.map((item, index) => renderCard(item, index))}
      </div>

      {/* Desktop Rich Table View (Visible on screens >= sm) */}
      <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            {renderTableHeader()}
          </TableHeader>
          <TableBody className="divide-y divide-border/60">
            {items.map((item, index) => renderTableRow(item, index))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
