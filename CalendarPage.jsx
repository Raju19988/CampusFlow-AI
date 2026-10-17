import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, PageHeader } from '@/components/common';
import { PriorityBadge, UrgencyPill } from '@/components/AssignmentBadges';
import { useAssignmentsInRange, useDueSoon } from '@/hooks/useAssignments';
import { formatDayHeading, formatDueLabel } from '@/lib/format';
import { dayKey, groupByDay, isCompleted, isOverdue, monthMatrix, monthRange, prioritize, urgencyOf } from '@/lib/urgency';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function sameMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export default function CalendarPage() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(() => dayKey(today));

  const range = useMemo(() => monthRange(cursor.year, cursor.month), [cursor]);
  const { assignments, isLoading, isError, error, refetch } = useAssignmentsInRange(range.from, range.to);
  const { assignments: dueSoon, isLoading: loadingDue } = useDueSoon(5);

  const byDay = useMemo(() => groupByDay(assignments), [assignments]);
  const weeks = useMemo(() => monthMatrix(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const selectedItems = useMemo(() => {
    const items = byDay.get(selected) || [];
    return prioritize(items);
  }, [byDay, selected]);

  const shiftMonth = (delta) => {
    const next = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: next.getFullYear(), month: next.getMonth() });
  };

  const goToday = () => {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
    setSelected(dayKey(now));
  };

  const monthIsEmpty = !isLoading && assignments.length === 0;

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Every deadline on the day it lands. Completed work is struck through, overdue work is flagged."
        actions={
          <Button asChild className="gap-2 rounded-xl">
            <Link to="/assignments?new=1">
              <Plus className="h-4 w-4" /> Add Assignment
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="cf-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="ml-1 font-heading text-lg font-semibold">{monthLabel}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={goToday}>
              Today
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <div key={day} className="py-1.5">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day[0]}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weeks.flat().map((day) => {
              const key = dayKey(day);
              const items = byDay.get(key) || [];
              const inMonth = sameMonth(day, cursor.year, cursor.month);
              const isToday = key === dayKey(today);
              const isSelected = key === selected;
              const hasOverdue = items.some((item) => isOverdue(item));
              const allDone = items.length > 0 && items.every((item) => isCompleted(item));

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    'cf-focus-ring flex min-h-[74px] flex-col rounded-xl border p-1.5 text-left transition sm:min-h-[104px]',
                    inMonth ? 'border-border bg-card' : 'border-transparent bg-muted/40 text-muted-foreground',
                    isSelected && 'border-primary ring-1 ring-primary/30',
                    !isSelected && inMonth && 'hover:border-primary/40',
                  )}
                  aria-label={`${day.toDateString()}${items.length ? `, ${items.length} deadlines` : ''}`}
                >
                  <span className="flex items-center justify-between">
                    <span
                      className={cn(
                        'grid h-6 w-6 place-items-center rounded-full text-xs font-semibold tabular-nums',
                        isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {hasOverdue ? <span className="h-2 w-2 rounded-full bg-rose-500" /> : null}
                    {!hasOverdue && allDone ? <span className="h-2 w-2 rounded-full bg-emerald-500" /> : null}
                  </span>

                  <span className="mt-1 space-y-1">
                    {items.slice(0, 2).map((item) => (
                      <span
                        key={item.id}
                        className={cn(
                          'block truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                          isCompleted(item)
                            ? 'bg-emerald-50 text-emerald-700 line-through'
                            : isOverdue(item)
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-primary/10 text-primary',
                        )}
                      >
                        {item.title}
                      </span>
                    ))}
                    {items.length > 2 ? (
                      <span className="block px-1.5 text-[10px] font-medium text-muted-foreground">
                        +{items.length - 2} more
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          {isError ? (
            <div className="mt-4">
              <ErrorState title="Calendar unavailable" onRetry={refetch} description={error?.message} />
            </div>
          ) : isLoading ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 animate-pulse" /> Loading this month…
            </p>
          ) : monthIsEmpty ? (
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
              No deadlines in {monthLabel}. Use the arrows to look at another month.
            </p>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="cf-card p-5">
            <h2 className="font-heading text-base font-semibold">{formatDayHeading(selected)}</h2>
            {selectedItems.length ? (
              <ul className="mt-3 space-y-3">
                {selectedItems.map((assignment) => (
                  <li key={assignment.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/assignments?edit=${assignment.id}`}
                        className={cn('font-medium hover:text-primary', isCompleted(assignment) && 'text-muted-foreground line-through')}
                      >
                        {assignment.title}
                      </Link>
                      <UrgencyPill assignment={assignment} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assignment.subject} · {formatDueLabel(assignment.due_date)}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">{urgencyOf(assignment).explanation}</p>
                    <div className="mt-2">
                      <PriorityBadge priority={assignment.priority} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Nothing due on this day. Pick another date to see what is planned.</p>
            )}
          </div>

          <div className="cf-card p-5">
            <h2 className="font-heading text-base font-semibold">Next up</h2>
            {loadingDue ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading upcoming deadlines…</p>
            ) : dueSoon.length ? (
              <ul className="mt-3 space-y-2.5">
                {prioritize(dueSoon).map((assignment) => (
                  <li key={assignment.id} className="flex items-start justify-between gap-3 text-sm">
                    <Link to={`/assignments?edit=${assignment.id}`} className="min-w-0 hover:text-primary">
                      <span className="block truncate font-medium">{assignment.title}</span>
                      <span className="block text-xs text-muted-foreground">{formatDueLabel(assignment.due_date)}</span>
                    </Link>
                    <UrgencyPill assignment={assignment} />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={CalendarDays} title="Nothing pending" description="Every assignment on your list is completed." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
