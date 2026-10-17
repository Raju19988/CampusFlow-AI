import { Link } from 'react-router-dom';
import { BarChart3, CheckCircle2, CircleDashed, Clock, LineChart, Plus, TriangleAlert } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EmptyState, ErrorState, PageHeader, StatCard } from '@/components/common';
import { useAssignmentStats, useCompletionTrend, useSubjectRows } from '@/hooks/useAssignments';
import { formatDate } from '@/lib/format';

const STATUS_COLORS = { Completed: '#10b981', 'In progress': '#2563eb', Pending: '#f59e0b' };

export default function AnalyticsPage() {
  const { stats, isLoading, isError, error, refetch } = useAssignmentStats();
  const { rows: subjectRows, isLoading: loadingSubjects, isError: subjectError, refetch: refetchSubjects } = useSubjectRows();
  const { rows: trendRows, isLoading: loadingTrend, isError: trendError, refetch: refetchTrend } = useCompletionTrend();

  const statusData = [
    { name: 'Completed', value: stats.completed },
    { name: 'In progress', value: stats.inProgress },
    { name: 'Pending', value: stats.pending },
  ].filter((entry) => entry.value > 0);

  const subjectData = subjectRows.slice(0, 8);
  const trendData = trendRows.map((row) => ({ ...row, label: formatDate(row.bucket) }));
  const hasTrend = trendData.length >= 2;

  if (isError) {
    return (
      <div>
        <PageHeader title="Analytics" description="Your academic workload, measured from real saved records." />
        <ErrorState onRetry={refetch} description={error?.message || 'We could not load your analytics.'} />
      </div>
    );
  }

  if (!isLoading && stats.total === 0) {
    return (
      <div>
        <PageHeader title="Analytics" description="Your academic workload, measured from real saved records." />
        <EmptyState
          icon={BarChart3}
          title="No data to analyse yet"
          body="Analytics appear as soon as you add assignments — completion rates, subject spread, and weekly progress all come from your own records."
          action={
            <Button asChild className="gap-2">
              <Link to="/assignments?new=1">
                <Plus className="h-4 w-4" /> Add your first assignment
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Your academic workload, measured from real saved records — nothing here is estimated."
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link to="/assignments">
              <Plus className="h-4 w-4" /> Manage assignments
            </Link>
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total assignments" value={stats.total} icon={BarChart3} tone="violet" isLoading={isLoading} />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} tone="emerald" isLoading={isLoading} />
        <StatCard
          label="Pending"
          value={stats.pending + stats.inProgress}
          icon={CircleDashed}
          tone="blue"
          isLoading={isLoading}
          hint={`${stats.inProgress} in progress`}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          icon={TriangleAlert}
          tone="rose"
          isLoading={isLoading}
          hint={stats.overdue ? 'Past their deadline' : 'All deadlines on track'}
        />
      </section>

      <section className="cf-card p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-semibold">Completion rate</h2>
            <p className="text-xs text-muted-foreground">
              {stats.completed} of {stats.total} assignments completed
            </p>
          </div>
          <p className="font-heading text-3xl font-bold tabular-nums text-primary">{stats.completionRate}%</p>
        </div>
        <Progress value={stats.completionRate} className="mt-4 h-2.5" />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="cf-card p-5">
          <h2 className="font-heading text-lg font-semibold">Status breakdown</h2>
          <p className="text-xs text-muted-foreground">Where your assignments stand right now.</p>
          {statusData.length ? (
            <div className="mt-2 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3} strokeWidth={0}>
                    {statusData.map((entry) => (
                      <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={32} />
                  <Tooltip formatter={(value, name) => [`${value} assignments`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No assignment data yet.</p>
          )}
        </div>

        <div className="cf-card p-5">
          <h2 className="font-heading text-lg font-semibold">Assignments per subject</h2>
          <p className="text-xs text-muted-foreground">Which courses are carrying the most work.</p>
          {loadingSubjects ? (
            <div className="mt-6 h-[240px] animate-pulse rounded-xl bg-muted" />
          ) : subjectError ? (
            <ErrorState title="Subject data unavailable" onRetry={refetchSubjects} />
          ) : subjectData.length ? (
            <div className="mt-2 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 12, right: 8, left: -18, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e9f2" />
                  <XAxis dataKey="subject" tick={{ fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={56} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`${value} assignments`, 'Total']} />
                  <Bar dataKey="count" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Add assignments with a subject to see this breakdown.</p>
          )}
        </div>
      </section>

      <section className="cf-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <LineChart className="h-[18px] w-[18px]" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold">Weekly completions</h2>
            <p className="text-xs text-muted-foreground">Weeks are bucketed from the completion time Base44 stamps on each assignment.</p>
          </div>
        </div>

        {loadingTrend ? (
          <div className="mt-6 h-[220px] animate-pulse rounded-xl bg-muted" />
        ) : trendError ? (
          <div className="mt-4">
            <ErrorState title="Trend data unavailable" onRetry={refetchTrend} />
          </div>
        ) : hasTrend ? (
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -18, bottom: 4 }}>
                <defs>
                  <linearGradient id="cfTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e9f2" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} completed`, 'Week']} />
                <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2.5} fill="url(#cfTrendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-border px-5 py-8 text-center">
            <Clock className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-sm font-medium">Not enough history yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete assignments across a couple of weeks and this chart will show your real weekly momentum.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
