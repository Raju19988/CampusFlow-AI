import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Loader2, Plus, Search, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState, ErrorState, ListSkeleton, PageHeader } from '@/components/common';
import AssignmentRow from '@/components/AssignmentRow';
import AssignmentDialog from '@/components/AssignmentDialog';
import { fetchAssignment } from '@/api/assignments';
import { useAssignmentList, useSubjectOptions } from '@/hooks/useAssignments';
import { SORT_OPTIONS } from '@/lib/format';
import { loadPreferences } from '@/lib/preferences';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'completed', label: 'Completed' },
];

export default function Assignments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState('all');
  const [subject, setSubject] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sort, setSort] = useState(() => loadPreferences().defaultSort || 'due');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loadingTarget, setLoadingTarget] = useState(false);

  const { subjects } = useSubjectOptions();
  const { assignments, isLoading, isFetching, isError, error, refetch } = useAssignmentList({
    tab,
    subject,
    priority,
    search,
    sort,
  });

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const newParam = searchParams.get('new');
  const editParam = searchParams.get('edit');

  useEffect(() => {
    if (!newParam) return;
    setEditing(null);
    setDialogOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newParam]);

  useEffect(() => {
    if (!editParam) return;
    let active = true;
    const existing = assignments.find((item) => item.id === editParam);
    if (existing) {
      setEditing(existing);
      setDialogOpen(true);
      return undefined;
    }
    setLoadingTarget(true);
    fetchAssignment(editParam)
      .then((record) => {
        if (!active || !record) return;
        setEditing(record);
        setDialogOpen(true);
      })
      .catch(() => {
        if (active) setEditing(null);
      })
      .finally(() => {
        if (active) setLoadingTarget(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editParam]);

  const closeDialog = (open) => {
    setDialogOpen(open);
    if (!open) {
      setEditing(null);
      if (searchParams.get('edit')) {
        const next = new URLSearchParams(searchParams);
        next.delete('edit');
        setSearchParams(next, { replace: true });
      }
    }
  };

  const activeFilters = useMemo(
    () => [tab !== 'all', subject !== 'all', priority !== 'all', Boolean(search)].filter(Boolean).length,
    [tab, subject, priority, search],
  );

  const resetFilters = () => {
    setTab('all');
    setSubject('all');
    setPriority('all');
    setSearchInput('');
    setSearch('');
  };

  return (
    <div>
      <PageHeader
        title="My Assignments"
        description="Every deadline in one place. Search, filter, and update progress as you work."
        actions={
          <Button className="gap-2 rounded-xl" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Assignment
          </Button>
        }
      />

      <div className="cf-card mb-5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search assignments by title…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search assignments by title"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger aria-label="Filter by subject">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any priority</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger aria-label="Sort assignments">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setTab(item.value)}
              className={cn(
                'cf-focus-ring rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
                tab === item.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
          {activeFilters ? (
            <Button variant="ghost" size="sm" className="ml-auto gap-1.5 text-muted-foreground" onClick={resetFilters}>
              <Filter className="h-3.5 w-3.5" /> Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        {isFetching && !isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        <span>
          {isLoading ? 'Loading assignments…' : `${assignments.length} ${assignments.length === 1 ? 'assignment' : 'assignments'}`}
          {activeFilters ? ' after filtering' : ''}
        </span>
        {loadingTarget ? <span className="text-xs">· opening assignment…</span> : null}
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} description={error?.message || 'We could not load your assignments.'} />
      ) : isLoading ? (
        <ListSkeleton rows={5} />
      ) : assignments.length ? (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <AssignmentRow
              key={assignment.id}
              assignment={assignment}
              now={new Date()}
              onEdit={(item) => {
                setEditing(item);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      ) : activeFilters ? (
        <EmptyState
          icon={SearchX}
          title="No assignments match these filters"
          description="Try a different subject, priority, or search term."
          action={
            <Button variant="outline" onClick={resetFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Plus}
          title="No assignments yet"
          body="Add your first assignment with a deadline and CampusFlow will start tracking it."
          action={
            <Button className="gap-2" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Assignment
            </Button>
          }
        />
      )}

      <AssignmentDialog open={dialogOpen} onOpenChange={closeDialog} assignment={editing} />
    </div>
  );
}
