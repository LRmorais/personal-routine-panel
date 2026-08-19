import { addDays, shortWeekdayLabel, weekdayNumber } from '../../lib/dates'
import { categorizeTask, categoryLabel, categoryType, type CategoryType } from './categories'
import type { TaskItem } from '../replanning/useTasks'

export type WeekdayStats = {
  weekday: number // 0=domingo .. 6=sábado
  label: string
  total: number
  done: number
  hours: number
}

export type CategoryStats = {
  id: string
  label: string
  type: CategoryType
  total: number
  done: number
  notDone: number
  hours: number
  completionRate: number
}

export type ReportStats = {
  periodStart: string
  periodEnd: string
  totalTasks: number
  doneCount: number
  notDoneCount: number
  openCount: number // pending + in_progress
  completionRate: number // doneCount / totalTasks, 0 when totalTasks === 0
  totalHours: number
  tasksWithDuration: number
  avgHoursPerDoneTask: number | null
  byWeekday: WeekdayStats[]
  busiestWeekday: { weekday: number; label: string; hours: number } | null
  byCategory: CategoryStats[]
}

export function computeReportStats(
  tasks: TaskItem[],
  periodStart: string,
  periodEnd: string,
): ReportStats {
  const byWeekday: WeekdayStats[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    label: shortWeekdayLabel(referenceDateForWeekday(periodStart, weekday)),
    total: 0,
    done: 0,
    hours: 0,
  }))

  let doneCount = 0
  let notDoneCount = 0
  let openCount = 0
  let totalHours = 0
  let tasksWithDuration = 0

  const categoryTotals = new Map<string, { total: number; done: number; notDone: number; hours: number }>()

  for (const task of tasks) {
    const weekday = weekdayNumber(task.planDate)
    const bucket = byWeekday[weekday]
    bucket.total += 1

    const categoryId = categorizeTask(task)
    const category = categoryTotals.get(categoryId) ?? { total: 0, done: 0, notDone: 0, hours: 0 }
    category.total += 1

    if (task.status === 'done') {
      doneCount += 1
      bucket.done += 1
      category.done += 1
    } else if (task.status === 'not_done') {
      notDoneCount += 1
      category.notDone += 1
    } else {
      openCount += 1
    }

    if (typeof task.durationHours === 'number') {
      totalHours += task.durationHours
      tasksWithDuration += 1
      bucket.hours += task.durationHours
      category.hours += task.durationHours
    }

    categoryTotals.set(categoryId, category)
  }

  const totalTasks = tasks.length
  const busiestWeekday = byWeekday.reduce<WeekdayStats | null>(
    (best, current) => (current.hours > (best?.hours ?? 0) ? current : best),
    null,
  )

  const byCategory: CategoryStats[] = Array.from(categoryTotals.entries())
    .map(([id, c]) => ({
      id,
      label: categoryLabel(id),
      type: categoryType(id),
      total: c.total,
      done: c.done,
      notDone: c.notDone,
      hours: c.hours,
      completionRate: c.total > 0 ? c.done / c.total : 0,
    }))
    .sort((a, b) => b.hours - a.hours || b.total - a.total)

  return {
    periodStart,
    periodEnd,
    totalTasks,
    doneCount,
    notDoneCount,
    openCount,
    completionRate: totalTasks > 0 ? doneCount / totalTasks : 0,
    totalHours,
    tasksWithDuration,
    avgHoursPerDoneTask: doneCount > 0 ? totalHours / doneCount : null,
    byWeekday,
    busiestWeekday:
      busiestWeekday && busiestWeekday.hours > 0
        ? { weekday: busiestWeekday.weekday, label: busiestWeekday.label, hours: busiestWeekday.hours }
        : null,
    byCategory,
  }
}

// byWeekday buckets need a label; any date string that falls on that weekday works,
// so we walk forward from periodStart within the same week.
function referenceDateForWeekday(periodStart: string, weekday: number): string {
  const startWeekday = weekdayNumber(periodStart)
  const offset = (weekday - startWeekday + 7) % 7
  return addDays(periodStart, offset)
}

export type StatsComparison = {
  completionRateDelta: number
  totalHoursDelta: number
  doneCountDelta: number
  notDoneCountDelta: number
  trend: 'up' | 'down' | 'flat'
}

export function compareStats(current: ReportStats, previous: ReportStats): StatsComparison {
  const completionRateDelta = current.completionRate - previous.completionRate
  const totalHoursDelta = current.totalHours - previous.totalHours
  const doneCountDelta = current.doneCount - previous.doneCount
  const notDoneCountDelta = current.notDoneCount - previous.notDoneCount

  let trend: StatsComparison['trend'] = 'flat'
  if (completionRateDelta > 0.02) trend = 'up'
  else if (completionRateDelta < -0.02) trend = 'down'

  return { completionRateDelta, totalHoursDelta, doneCountDelta, notDoneCountDelta, trend }
}

export function statsFingerprint(stats: ReportStats): string {
  const categoryPart = stats.byCategory
    .map((c) => `${c.id}:${c.total}:${c.done}:${c.hours.toFixed(2)}`)
    .join(',')
  return [
    stats.totalTasks,
    stats.doneCount,
    stats.notDoneCount,
    stats.openCount,
    stats.totalHours.toFixed(2),
    categoryPart,
  ].join('|')
}
