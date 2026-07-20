import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CSSProperties, ReactNode } from 'react'

type UseSortableReturn = ReturnType<typeof useSortable>

export type DragHandleProps = {
  ref: UseSortableReturn['setActivatorNodeRef']
  attributes: UseSortableReturn['attributes']
  listeners: UseSortableReturn['listeners']
}

function SortableRow<T extends { id: string }>({
  item,
  className,
  children,
}: {
  item: T
  className?: string
  children: (item: T, dragHandleProps: DragHandleProps) => ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : undefined,
    position: 'relative',
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(item, { ref: setActivatorNodeRef, attributes, listeners })}
    </div>
  )
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  rowClassName,
  children,
}: {
  items: T[]
  onReorder: (fromIndex: number, toIndex: number) => void
  rowClassName?: string | ((item: T) => string)
  children: (item: T, dragHandleProps: DragHandleProps) => ReactNode
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const fromIndex = items.findIndex((i) => i.id === active.id)
    const toIndex = items.findIndex((i) => i.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    onReorder(fromIndex, toIndex)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableRow
            key={item.id}
            item={item}
            className={typeof rowClassName === 'function' ? rowClassName(item) : rowClassName}
          >
            {children}
          </SortableRow>
        ))}
      </SortableContext>
    </DndContext>
  )
}

export function DragHandle({ dragHandleProps }: { dragHandleProps: DragHandleProps }) {
  return (
    <button
      ref={dragHandleProps.ref}
      {...dragHandleProps.attributes}
      {...dragHandleProps.listeners}
      type="button"
      aria-label="Arrastar para reordenar"
      className="shrink-0 touch-none cursor-grab px-1 text-lg leading-none text-slate-500 active:cursor-grabbing active:text-slate-300"
    >
      ⠿
    </button>
  )
}
