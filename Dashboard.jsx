import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, CalendarClock, CalendarDays, CheckCircle2, CircleDashed, ListChecks, Plus, TriangleAlert } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorState, ListSkeleton, StatCard } from '@/components/common';
import { PriorityBadge, UrgencyPill } from '@/components/AssignmentBadges';
import { useAssignmentStats, useCurrentUser, useDueSoon } from '@/hooks/useAssignments';
import { formatDueLabel, formatLongDate, greeting, firstName } from '@/lib/format';
import { prioritize, urgencyOf } from '@/lib/urgency';

const CHART_COLORS = ['#7c3aed', '#2563eb', '#f59e0b'];

const MOTIVATION = [
  'Small steps today beat a panic tomorrow.',
  'Pick the hardest task first — everything after feels easier.',
  'One deadline at a time. You have got this.',
  'A little progress every day adds up fast.',
  'Plan the week, then work the plan.',
  'Finish one thing before you start the next.',
  'Your future self will thank you for starting now.',
];

function motivationForToday() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  return MOTIVATION[dayOfYear % MOTIVATION.length];
}

const QUICK_ACTIONS = [
  { to: '/assignments?new=1', label: 'Add Assignment', icon: Plus },
  { to: '/assignments', label: 'All Assignments', icon: ListChecks },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

export default function Dashboard() {
  const { data: user } = useCurrentUser();
  const { stats, isLoading, isError, refetch } = useAssignmentStats();
  const { assignments: dueSoon, isLoading: loadingDue, isError: dueError, refetch: refetchDue } = useDueSoon(6);

  const now = new Date();
  const urgentFirst = prioritize(dueSoon, now);
  const hasAny = stats.total > 0;

  const donutData = [
    { name: 'Completed', value: stats.completed },
    { name: 'In progress', value: stats.inProgress },
    { name: 'Pending', value: stats.pending },
  ].filter((entry) => entry.value > 0);

  return (
    <div className="space-y-6">
      <section className="cf-card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-16 -top-24 h-60 w-60 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{formatLongDate(now)}</p>
            <h1 className="mt-1.5 font-heading text-2xl font-bold sm:text-3xl">
              {greeting(now)}, <span className="cf-brand-text">{firstName(user?.full_name || user?.email)}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{motivationForToday()}</p>
          </div>
          <Button asChild size="lg" className="gap-2 rounded-xl">
            <Link to="/assignments?new=1">
              <Plus className="h-4 w-4" /> Add Assignment
            </Link>
          </Button>
        </div>
      </section>

      {isError ? (
        <ErrorState onRetry={refetch} description="We could not reach your assignment data. Your records are safe in Base44." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total assignments" value={stats.total} icon={ListChecks} tone="violet" isLoading={isLoading} hint="Tracked in your schedule" />
          <StatCard
            label="Pending"
            value={stats.pending + stats.inProgress}
            icon={CircleDashed}
            tone="blue"
            isLoading={isLoading}
            hint={stats.inProgress ? `${stats.inProgress} in progress` : 'Nothing started yet'}
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            tone="emerald"
            isLoading={isLoading}
            hint={`${stats.completionRate}% completion rate`}
          />
          <StatCard
            label="Overdue"
            value={stats.overdue}
            icon={TriangleAlert}
            tone="rose"
            isLoading={isLoading}
            hint={stats.overdue ? 'Needs attention today' : 'All deadlines on track'}
          />
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="cf-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg font-semibold">Upcoming deadlines</h2>
              <p className="text-xs text-muted-foreground">Sorted by what needs you first — overdue, then nearest deadline.</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/assignments">View all</Link>
            </Button>
          </div>

          {loadingDue ? (
            <ListSkeleton rows={3} />
          ) : dueError ? (
            <ErrorState title="Deadlines unavailable" onRetry={refetchDue} description="We could not load your upcoming work." />
          ) : urgentFirst.length ? (
            <ul className="space-y-3">
              {urgentFirst.map((assignment) => {
                const urgency = urgencyOf(assignment, now);
                return (
                  <li key={assignment.id}>
                    <Link
                      to={`/assignments?edit=${assignment.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-3.5 transition hover:border-primary/40 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{assignment.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {assignment.subject} · {formatDueLabel(assignment.due_date)}
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">{urgency.explanation}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={assignment.priority} />
                        <UrgencyPill assignment={assignment} now={now} />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : hasAny ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-8 text-center">
              <p className="font-medium">Nothing pending — every deadline is done.</p>
              <p className="mt-1 text-sm text-muted-foreground">Add the next assignment when it lands.</p>
            </div>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No deadlines yet"
              body="Create your first assignment and CampusFlow will flag it before it becomes urgent."
            />
          )}
        </div>

        <div className="cf-card p-5">
          <h2 className="font-heading text-lg font-semibold">Productivity overview</h2>
          <p className="text-xs text-muted-foreground">Live from your saved assignments.</p>

          {isLoading ? (
            <div className="mt-6 space-y-3">
              <div className="mx-auto h-[170px] w-[170px] animate-pulse rounded-full bg-muted" />
            </div>
          ) : stats.total > 0 ? (
            <>
              <div className="relative mx-auto mt-2 h-[190px] w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={58} outerRadius={86} paddingAngle={3} strokeWidth={0}>
                      {donutData.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value} assignments`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-heading text-3xl font-bold tabular-nums">{stats.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">completed</p>
                </div>
              </div>

              <ul className="mt-2 space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-violet-600" /> Completed
                  </span>
                  <span className="font-medium tabular-nums">{stats.completed}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> In progress
                  </span>
                  <span className="font-medium tabular-nums">{stats.inProgress}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pending
                  </span>
                  <span className="font-medium tabular-nums">{stats.pending}</span>
                </li>
              </ul>
            </>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Add your first assignment to see completion progress here.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-semibold">Quick actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="cf-card cf-card-hover flex items-center gap-3 p-4 text-sm font-medium"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                {action.label}
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
