// Base44 data-access layer. Every database call for CampusFlow AI goes through this module
// so UI components never talk to the SDK directly.

import { base44 } from '@/api/base44Client';
import { statsFromRows } from '@/lib/urgency';

export const ENTITY = 'Assignment';
export const LIST_LIMIT = 200;

export function nowIso(now = new Date()) {
  return now.toISOString();
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Builds the Base44 query for the assignment list (tab + subject + priority + search). */
export function buildListQuery({ tab = 'all', subject = 'all', priority = 'all', search = '', now = new Date() } = {}) {
  const query = {};
  if (subject && subject !== 'all') query.subject = subject;
  if (priority && priority !== 'all') query.priority = priority;

  const term = String(search || '').trim();
  if (term) query.title = { $regex: escapeRegex(term), $options: 'i' };

  const stamp = nowIso(now);
  if (tab === 'pending') query.status = 'pending';
  else if (tab === 'in_progress') query.status = 'in_progress';
  else if (tab === 'completed') query.status = 'completed';
  else if (tab === 'overdue') {
    query.status = { $ne: 'completed' };
    query.due_date = { $lt: stamp };
  } else if (tab === 'upcoming') {
    query.status = { $ne: 'completed' };
    query.due_date = { $gte: stamp };
  }

  return query;
}

export const SORT_BY_KEY = {
  due: 'due_date',
  updated: '-updated_date',
  created: '-created_date',
};

function pickFields(values = {}) {
  const record = {};
  ['title', 'description', 'subject', 'priority', 'status'].forEach((field) => {
    if (values[field] !== undefined) record[field] = values[field];
  });
  if (values.due_date !== undefined) record.due_date = values.due_date;
  if (record.status !== undefined) {
    record.completed_at = record.status === 'completed' ? new Date().toISOString() : null;
  }
  return record;
}

export async function fetchAssignments({ query = {}, sort = 'due_date', limit = LIST_LIMIT } = {}) {
  const page = await base44.entities[ENTITY].filter(query, { sort, limit });
  return page?.items || [];
}

export async function fetchAssignment(id) {
  return base44.entities[ENTITY].get(id);
}

/** Dashboard + analytics counters, computed by the backend rather than by loading records. */
export async function fetchStats(now = new Date()) {
  const [grouped, overdue] = await Promise.all([
    base44.entities[ENTITY].aggregate({ groupBy: 'status' }),
    base44.entities[ENTITY].count({ status: { $ne: 'completed' }, due_date: { $lt: nowIso(now) } }),
  ]);
  return statsFromRows(grouped?.rows || [], Number(overdue) || 0);
}

export async function fetchDueSoon(limit = 6) {
  const page = await base44.entities[ENTITY].filter({ status: { $ne: 'completed' } }, { sort: 'due_date', limit });
  return page?.items || [];
}

export async function fetchSubjects() {
  const page = await base44.entities[ENTITY].list({ distinct: 'subject' });
  return (page?.items || []).filter(Boolean);
}

export async function fetchSubjectRows() {
  const result = await base44.entities[ENTITY].aggregate({ groupBy: 'subject' });
  return (result?.rows || []).map((row) => ({ subject: row.subject || 'Unassigned', count: Number(row.count) || 0 }));
}

function bucketKey(row) {
  if (!row) return '';
  const key = Object.keys(row).find((field) => field !== 'count' && field !== '_id');
  return key ? row[key] : '';
}

/**
 * Weekly completions. Base44 can only bucket the built-in timestamp fields, so weeks are grouped
 * on `updated_date` — the timestamp stamped by the same write that marks an assignment completed.
 */
export async function fetchCompletionTrend() {
  const result = await base44.entities[ENTITY].aggregate({
    query: { status: 'completed' },
    dateBucket: { field: 'updated_date', unit: 'week' },
  });
  return (result?.rows || [])
    .map((row) => ({ bucket: bucketKey(row), count: Number(row.count) || 0 }))
    .filter((row) => row.bucket)
    .sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());
}

export async function fetchRange(from, to, limit = LIST_LIMIT) {
  const page = await base44.entities[ENTITY].filter(
    { due_date: { $gte: nowIso(from), $lte: nowIso(to) } },
    { sort: 'due_date', limit },
  );
  return page?.items || [];
}

export async function createAssignment(values) {
  return base44.entities[ENTITY].create(pickFields(values));
}

export async function updateAssignment(id, values) {
  return base44.entities[ENTITY].update(id, pickFields(values));
}

export async function updateAssignmentStatus(id, status) {
  return base44.entities[ENTITY].update(id, pickFields({ status }));
}

export async function deleteAssignment(id) {
  return base44.entities[ENTITY].delete(id);
}

/* ---- session ---- */

export async function fetchCurrentUser() {
  try {
    return await base44.auth.me();
  } catch (e) {
    return null;
  }
}
