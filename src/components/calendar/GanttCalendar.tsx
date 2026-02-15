import { useState, useMemo } from 'react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend, parseISO, differenceInDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ProjectFieldWithDetails, WorkType } from '@/types/database'

interface GanttCalendarProps {
  projectFields: ProjectFieldWithDetails[]
  workTypes: WorkType[]
  onAssignmentClick?: (assignmentId: string) => void
}

const DAY_WIDTH = 32
const FIELD_LABEL_WIDTH = 120

export function GanttCalendar({ projectFields, workTypes, onAssignmentClick }: GanttCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const goToToday = () => setCurrentMonth(new Date())

  // 圃場を農家番号・圃場番号でソート
  const sortedFields = useMemo(() => {
    return [...projectFields].sort((a, b) => {
      const aLabel = `${a.field.farmer.farmer_number}-${a.field.field_number}`
      const bLabel = `${b.field.farmer.farmer_number}-${b.field.field_number}`
      return aLabel.localeCompare(bLabel, 'ja', { numeric: true })
    })
  }, [projectFields])

  return (
    <div className="bg-white rounded-lg border">
      {/* ヘッダー: 月ナビゲーション */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[140px] text-center">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          今日
        </Button>
      </div>

      {/* カレンダー本体 */}
      <ScrollArea className="w-full">
        <div className="min-w-max">
          {/* 日付ヘッダー */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div
              className="flex-shrink-0 border-r bg-gray-50 p-2 font-medium text-sm"
              style={{ width: FIELD_LABEL_WIDTH }}
            >
              圃場
            </div>
            <div className="flex">
              {daysInMonth.map((day) => {
                const isToday = isSameDay(day, new Date())
                const weekend = isWeekend(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'flex-shrink-0 text-center text-xs py-1 border-r',
                      weekend && 'bg-gray-50',
                      isToday && 'bg-primary/10'
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    <div className={cn('font-medium', weekend && 'text-red-500')}>
                      {format(day, 'd')}
                    </div>
                    <div className={cn('text-muted-foreground', weekend && 'text-red-400')}>
                      {format(day, 'E', { locale: ja })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 圃場行 */}
          <TooltipProvider>
            {sortedFields.map((projectField) => {
              const fieldLabel = `${projectField.field.farmer.farmer_number}-${projectField.field.field_number}`

              return (
                <div key={projectField.id} className="flex border-b hover:bg-gray-50">
                  {/* 圃場ラベル */}
                  <div
                    className="flex-shrink-0 border-r p-2 bg-gray-50"
                    style={{ width: FIELD_LABEL_WIDTH }}
                  >
                    <div className="font-medium text-sm">{fieldLabel}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {projectField.field.farmer.name}
                    </div>
                  </div>

                  {/* カレンダーセル */}
                  <div className="flex relative" style={{ minHeight: 48 }}>
                    {/* 日付の背景グリッド */}
                    {daysInMonth.map((day) => {
                      const isToday = isSameDay(day, new Date())
                      const weekend = isWeekend(day)
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            'flex-shrink-0 border-r',
                            weekend && 'bg-gray-50',
                            isToday && 'bg-primary/5'
                          )}
                          style={{ width: DAY_WIDTH }}
                        />
                      )
                    })}

                    {/* 作業バー（予定と実績） */}
                    {projectField.assignments.map((assignment, idx) => {
                      const workType = workTypes.find(wt => wt.id === assignment.work_type_id)
                      const bars: React.ReactNode[] = []

                      // 予定バー
                      if (assignment.planned_start && assignment.planned_end) {
                        const startDate = parseISO(assignment.planned_start)
                        const endDate = parseISO(assignment.planned_end)

                        if (!(endDate < monthStart || startDate > monthEnd)) {
                          const displayStart = startDate < monthStart ? monthStart : startDate
                          const displayEnd = endDate > monthEnd ? monthEnd : endDate
                          const offsetDays = differenceInDays(displayStart, monthStart)
                          const durationDays = differenceInDays(displayEnd, displayStart) + 1

                          bars.push(
                            <Tooltip key={`${assignment.id}-planned`}>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute h-3 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-medium border-2 border-dashed"
                                  style={{
                                    left: offsetDays * DAY_WIDTH + 2,
                                    width: durationDays * DAY_WIDTH - 4,
                                    top: 4 + idx * 2,
                                    backgroundColor: 'transparent',
                                    borderColor: workType?.color || '#6B7280',
                                  }}
                                  onClick={() => onAssignmentClick?.(assignment.id)}
                                />
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{workType?.name}（予定）</p>
                                  <p>{assignment.planned_start} 〜 {assignment.planned_end}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        }
                      }

                      // 実績バー
                      if (assignment.actual_start) {
                        const startDate = parseISO(assignment.actual_start)
                        const endDate = assignment.actual_end
                          ? parseISO(assignment.actual_end)
                          : new Date() // 完了日がなければ今日まで

                        if (!(endDate < monthStart || startDate > monthEnd)) {
                          const displayStart = startDate < monthStart ? monthStart : startDate
                          const displayEnd = endDate > monthEnd ? monthEnd : endDate
                          const offsetDays = differenceInDays(displayStart, monthStart)
                          const durationDays = differenceInDays(displayEnd, displayStart) + 1

                          bars.push(
                            <Tooltip key={`${assignment.id}-actual`}>
                              <TooltipTrigger asChild>
                                <div
                                  className="absolute h-5 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-medium shadow-sm"
                                  style={{
                                    left: offsetDays * DAY_WIDTH + 2,
                                    width: durationDays * DAY_WIDTH - 4,
                                    top: 12 + idx * 2,
                                    backgroundColor: workType?.color || '#6B7280',
                                  }}
                                  onClick={() => onAssignmentClick?.(assignment.id)}
                                >
                                  {durationDays >= 3 && (
                                    <span className="truncate px-1">
                                      {workType?.name} {assignment.progress_pct}%
                                    </span>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="text-sm">
                                  <p className="font-medium">{workType?.name}（実績）</p>
                                  <p>{assignment.actual_start} 〜 {assignment.actual_end || '作業中'}</p>
                                  <p>進捗: {assignment.progress_pct}%</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )
                        }
                      }

                      // 予定も実績もない場合は何も表示しない
                      if (bars.length === 0) return null

                      return bars
                    })}
                  </div>
                </div>
              )
            })}
          </TooltipProvider>

          {/* 圃場がない場合 */}
          {sortedFields.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              表示する圃場がありません
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* 工種凡例 */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-3 rounded border-2 border-dashed border-gray-500" />
            <span className="text-sm text-muted-foreground">予定</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded bg-gray-500" />
            <span className="text-sm text-muted-foreground">実績</span>
          </div>
          <div className="border-l h-4 mx-2" />
          {workTypes.map((wt) => (
            <div key={wt.id} className="flex items-center gap-1.5">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: wt.color || '#6B7280' }}
              />
              <span className="text-sm">{wt.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
