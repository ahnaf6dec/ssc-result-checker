import React, { useCallback, useEffect, useState } from 'react';
import { type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  ExternalLinkIcon,
  FilePlus2Icon,
  Loader2Icon,
  LogOutIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  RefreshCwIcon,
  Settings2Icon,
  ShieldCheckIcon,
  Trash2Icon,
  XIcon } from
'lucide-react';
import { Link } from 'react-router-dom';
import {
  ApiError,
  createResult,
  deleteResult,
  listResults,
  updateResult } from
'../lib/api';
import { updateMaintenanceFlag, useMaintenanceFlag } from '../lib/maintenance';
import { logout, useAuth } from '../lib/auth';
import { AdminLogin } from '../components/AdminLogin';
import type {
  ExamName,
  ResultRecord,
  ResultType,
  SubjectGrade } from
'../types/results';
type AdminView = 'records' | 'editor' | 'features' | 'status';
type FeatureKey = 'analytics' | 'bengali' | 'registration';
const EXAM_OPTIONS: ExamName[] = ['SSC', 'DAKHIL', 'HSC', 'ALIM', 'JSC', 'JDC'];
const BOARD_OPTIONS = [
'DHAKA',
'CHITTAGONG',
'COMILLA',
'JASHORE',
'RAJSHAHI',
'BARISAL',
'SYLHET',
'DINAJPUR',
'MYMENSINGH',
'MADRASAH',
'TECHNICAL'];

const TYPE_OPTIONS: ResultType[] = ['REGULAR', 'IRREGULAR'];
const emptySubject = (): SubjectGrade => ({
  code: '',
  name: '',
  grade: '',
  marks: undefined
});
function createEmptyRecord(): ResultRecord {
  return {
    roll: '',
    registration: '',
    studentName: '',
    fatherName: '',
    motherName: '',
    examination: 'SSC',
    year: '2025',
    board: 'DHAKA',
    session: '',
    group: '',
    resultType: 'REGULAR',
    gender: 'Male',
    dateOfBirth: '',
    gpa: '',
    institute: '',
    subjects: [emptySubject()],
    continuousAssessments: [emptySubject()]
  };
}
function copyRecord(record: ResultRecord): ResultRecord {
  return {
    ...record,
    subjects: record.subjects.map((subject) => ({
      ...subject
    })),
    continuousAssessments: record.continuousAssessments.map((subject) => ({
      ...subject
    }))
  };
}
export function AdminPage() {
  const authed = useAuth();
  // Auth gate — nothing in the panel renders until the admin signs in.
  if (!authed) {
    return <AdminLogin onSuccess={() => {}} />;
  }
  return <AdminPanel />;
}
function AdminPanel() {
  const [activeView, setActiveView] = useState<AdminView>('records');
  const [records, setRecords] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<ResultRecord>(createEmptyRecord);
  const [editingRoll, setEditingRoll] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [editorError, setEditorError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingRoll, setDeletingRoll] = useState<string | null>(null);
  const maintenanceMode = useMaintenanceFlag();
  const [maintenanceBusy, setMaintenanceBusy] = useState(false);
  const [features, setFeatures] = useState<Record<FeatureKey, boolean>>({
    analytics: true,
    bengali: true,
    registration: true
  });
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await listResults();
      setRecords(data);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ?
        err.message :
        'Unable to load student records.'
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);
  function openNewRecord() {
    setDraft(createEmptyRecord());
    setEditingRoll(null);
    setStatusMessage('');
    setEditorError('');
    setActiveView('editor');
  }
  function openEditRecord(record: ResultRecord) {
    setDraft(copyRecord(record));
    setEditingRoll(record.roll);
    setStatusMessage('');
    setEditorError('');
    setActiveView('editor');
  }
  async function handleDeleteRecord(roll: string) {
    if (
    !window.confirm(
      'Are you sure you want to permanently delete this student record?'
    ))
    {
      return;
    }
    setDeletingRoll(roll);
    setStatusMessage('');
    try {
      await deleteResult(roll);
      setRecords((current) => current.filter((record) => record.roll !== roll));
      setStatusMessage(`Record ${roll} was deleted.`);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ?
        err.message :
        `Failed to delete record ${roll}.`
      );
    } finally {
      setDeletingRoll(null);
    }
  }
  function updateDraftField(
  event: ChangeEvent<HTMLInputElement | HTMLSelectElement>)
  {
    const { name, value } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: value
    }));
  }
  function updateSubject(
  group: 'subjects' | 'continuousAssessments',
  index: number,
  field: keyof SubjectGrade,
  value: string)
  {
    setDraft((current) => ({
      ...current,
      [group]: current[group].map((subject, subjectIndex) => {
        if (subjectIndex !== index) return subject;
        if (field === 'marks') {
          return {
            ...subject,
            marks: value === '' ? undefined : Number(value)
          };
        }
        return {
          ...subject,
          [field]: value
        };
      })
    }));
  }
  function addSubject(group: 'subjects' | 'continuousAssessments') {
    setDraft((current) => ({
      ...current,
      [group]: [...current[group], emptySubject()]
    }));
  }
  function removeSubject(
  group: 'subjects' | 'continuousAssessments',
  index: number)
  {
    setDraft((current) => ({
      ...current,
      [group]: current[group].filter(
        (_, subjectIndex) => subjectIndex !== index
      )
    }));
  }
  async function saveRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError('');
    const normalizedDraft: ResultRecord = {
      ...draft,
      studentName: draft.studentName.trim().toUpperCase(),
      fatherName: draft.fatherName.trim().toUpperCase(),
      motherName: draft.motherName.trim().toUpperCase(),
      board: draft.board.trim().toUpperCase(),
      group: draft.group.trim().toUpperCase(),
      institute: draft.institute.trim(),
      gpa: Number(draft.gpa || 0).toFixed(2),
      subjects: draft.subjects.filter(
        (subject) => subject.code && subject.name
      ),
      continuousAssessments: draft.continuousAssessments.filter(
        (subject) => subject.code && subject.name
      )
    };
    setSaving(true);
    try {
      if (editingRoll) {
        const updated = await updateResult(editingRoll, normalizedDraft);
        setRecords((current) =>
        current.map((record) =>
        record.roll === editingRoll ? updated : record
        )
        );
        setStatusMessage(`Record ${updated.roll} was updated successfully.`);
      } else {
        const created = await createResult(normalizedDraft);
        setRecords((current) => [created, ...current]);
        setStatusMessage(`Record ${created.roll} was added successfully.`);
      }
      setDraft(createEmptyRecord());
      setEditingRoll(null);
      setActiveView('records');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setEditorError(
          `A record already exists for roll ${normalizedDraft.roll}.`
        );
      } else if (err instanceof ApiError) {
        setEditorError(err.message);
      } else {
        setEditorError('Failed to save the record. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }
  function toggleFeature(feature: FeatureKey) {
    setFeatures((current) => ({
      ...current,
      [feature]: !current[feature]
    }));
  }
  async function enableMaintenance() {
    setMaintenanceBusy(true);
    try {
      await updateMaintenanceFlag(true);
    } finally {
      setMaintenanceBusy(false);
    }
  }
  async function disableMaintenance() {
    setMaintenanceBusy(true);
    try {
      await updateMaintenanceFlag(false);
    } finally {
      setMaintenanceBusy(false);
      setActiveView('records');
    }
  }
  return (
    <main className="min-h-screen w-full bg-[#f8f9fa] text-slate-800">
      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-4 bg-[#0b6623] px-4 py-3 text-white shadow-sm sm:px-6">
        <div className="flex items-center gap-2 font-medium">
          <ShieldCheckIcon
            className="h-5 w-5 text-amber-300"
            aria-hidden="true" />
          

          <span>Education Board Portal — Control Panel</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded bg-white px-2 py-1 text-xs font-medium text-slate-800 sm:inline">
            Session: 2026
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1 rounded border border-white/80 px-3 py-1.5 text-xs font-medium hover:bg-white hover:text-[#0b6623] focus:outline-none focus:ring-2 focus:ring-white">
            
            <ExternalLinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
            View Portal
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1 rounded border border-white/80 px-3 py-1.5 text-xs font-medium hover:bg-white hover:text-[#0b6623] focus:outline-none focus:ring-2 focus:ring-white">
            
            <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Sign Out
          </button>
        </div>
      </header>

      {maintenanceMode &&
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 border-b border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 sm:px-6">
        
          <span className="inline-flex items-center gap-2 font-medium">
            <AlertTriangleIcon className="h-4 w-4" aria-hidden="true" />
            The public portal is currently OFFLINE (maintenance mode).
          </span>
          <button
          type="button"
          onClick={disableMaintenance}
          disabled={maintenanceBusy}
          className="inline-flex items-center gap-1.5 rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-60">
          
            {maintenanceBusy ?
          <Loader2Icon
            className="h-3.5 w-3.5 animate-spin"
            aria-hidden="true" /> :


          <PowerIcon className="h-3.5 w-3.5" aria-hidden="true" />
          }
            Bring Website Online
          </button>
        </div>
      }

      <div className="mx-auto flex max-w-[1600px] flex-col md:flex-row">
        <aside className="w-full border-b border-slate-200 bg-white md:min-h-[calc(100vh-56px)] md:w-64 md:border-b-0 md:border-r">
          <nav
            className="flex overflow-x-auto py-2 md:flex-col md:py-3"
            aria-label="Admin sections">
            
            <AdminNavButton
              active={activeView === 'records'}
              label="Manage Results"
              icon={<ClipboardListIcon className="h-4 w-4" />}
              onClick={() => setActiveView('records')} />
            

            <AdminNavButton
              active={activeView === 'editor'}
              label="Input Student Result"
              icon={<FilePlus2Icon className="h-4 w-4" />}
              onClick={openNewRecord} />
            

            <AdminNavButton
              active={activeView === 'features'}
              label="Manage Site Features"
              icon={<Settings2Icon className="h-4 w-4" />}
              onClick={() => setActiveView('features')} />
            

            <AdminNavButton
              active={activeView === 'status'}
              danger
              label="System Status"
              icon={<AlertTriangleIcon className="h-4 w-4" />}
              onClick={() => setActiveView('status')} />
            
          </nav>
        </aside>

        <section className="min-w-0 flex-1 p-4 sm:p-6">
          {statusMessage &&
          <div
            role="status"
            className="mb-5 flex items-center gap-2 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            
              <CheckCircle2Icon
              className="h-4 w-4 shrink-0"
              aria-hidden="true" />
            

              {statusMessage}
            </div>
          }

          {activeView === 'records' &&
          <RecordsView
            records={records}
            loading={loading}
            error={loadError}
            deletingRoll={deletingRoll}
            onReload={loadRecords}
            onAdd={openNewRecord}
            onDelete={handleDeleteRecord}
            onEdit={openEditRecord} />

          }

          {activeView === 'editor' &&
          <RecordEditor
            draft={draft}
            editing={Boolean(editingRoll)}
            saving={saving}
            error={editorError}
            onAddSubject={addSubject}
            onCancel={() => {
              setDraft(createEmptyRecord());
              setEditingRoll(null);
              setEditorError('');
              setActiveView('records');
            }}
            onChange={updateDraftField}
            onRemoveSubject={removeSubject}
            onSave={saveRecord}
            onSubjectChange={updateSubject} />

          }

          {activeView === 'features' &&
          <FeatureView features={features} onToggle={toggleFeature} />
          }

          {activeView === 'status' &&
          <section className="max-w-2xl">
              <div className="mb-4 border-b border-slate-300 pb-3">
                <h1 className="text-xl font-semibold text-red-700">
                  Emergency System Operations
                </h1>
              </div>
              <div className="rounded border border-red-300 bg-white shadow-sm">
                <div className="bg-red-600 px-5 py-3 font-bold text-white">
                  Server Mode Status Configuration
                </div>
                <div className="p-5">
                  <h2 className="font-semibold">Broadcasting Control Toggle</h2>
                  <p className="mt-2 leading-6 text-slate-600">
                    Activating Maintenance Mode drops incoming traffic and
                    displays a standard 503 downtime message instead of the
                    public query page.
                  </p>

                  <div className="my-5 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    <span className="font-medium text-slate-600">
                      Current status:
                    </span>
                    {maintenanceMode ?
                  <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 font-bold text-red-700">
                        <AlertTriangleIcon
                      className="h-3.5 w-3.5"
                      aria-hidden="true" />
                    
                        OFFLINE
                      </span> :

                  <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 font-bold text-green-700">
                        <CheckCircle2Icon
                      className="h-3.5 w-3.5"
                      aria-hidden="true" />
                    
                        ONLINE
                      </span>
                  }
                  </div>

                  <div className="my-5 flex gap-3 rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm text-amber-900">
                    <AlertTriangleIcon
                    className="h-5 w-5 shrink-0"
                    aria-hidden="true" />
                  

                    <p>
                      <strong>Warning:</strong> Turning this function on changes
                      public visibility behavior instantly.
                    </p>
                  </div>

                  {maintenanceMode ?
                <button
                  type="button"
                  onClick={disableMaintenance}
                  disabled={maintenanceBusy}
                  className="inline-flex items-center gap-2 rounded bg-[#0b6623] px-4 py-2.5 font-medium text-white hover:bg-[#084e1b] focus:outline-none focus:ring-2 focus:ring-[#0b6623] focus:ring-offset-2 disabled:opacity-60">
                  
                      {maintenanceBusy ?
                  <Loader2Icon
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true" /> :


                  <PowerIcon className="h-4 w-4" aria-hidden="true" />
                  }
                      Bring Website Online
                    </button> :

                <button
                  type="button"
                  onClick={enableMaintenance}
                  disabled={maintenanceBusy}
                  className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2.5 font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-60">
                  
                      {maintenanceBusy ?
                  <Loader2Icon
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true" /> :


                  <PowerIcon className="h-4 w-4" aria-hidden="true" />
                  }
                      Take Website Offline
                    </button>
                }
                </div>
              </div>
            </section>
          }
        </section>
      </div>
    </main>);

}
type AdminNavButtonProps = {
  active: boolean;
  danger?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
};
function AdminNavButton({
  active,
  danger = false,
  icon,
  label,
  onClick
}: AdminNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-2 border-l-4 px-4 py-3 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0b6623] md:w-full ${active ? 'border-[#0b6623] bg-[#e8f5e9] text-[#0b6623]' : `border-transparent hover:bg-slate-50 ${danger ? 'text-red-700' : 'text-slate-700'}`}`}>
      
      {icon}
      {label}
    </button>);

}
type RecordsViewProps = {
  records: ResultRecord[];
  loading: boolean;
  error: string;
  deletingRoll: string | null;
  onReload: () => void;
  onAdd: () => void;
  onDelete: (roll: string) => void;
  onEdit: (record: ResultRecord) => void;
};
function RecordsView({
  records,
  loading,
  error,
  deletingRoll,
  onReload,
  onAdd,
  onDelete,
  onEdit
}: RecordsViewProps) {
  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <h1 className="text-xl font-semibold">Student Academic Records</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-60">
            
            <RefreshCwIcon
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true" />
            
            Refresh
          </button>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 rounded bg-[#0b6623] px-3 py-2 text-sm font-medium text-white hover:bg-[#084e1b] focus:outline-none focus:ring-2 focus:ring-[#0b6623] focus:ring-offset-2">
            
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            Add Record
          </button>
        </div>
      </div>

      {error &&
      <div
        role="alert"
        className="mb-4 flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        
          <span>{error}</span>
          <button
          type="button"
          onClick={onReload}
          className="shrink-0 font-medium underline underline-offset-2">
          
            Retry
          </button>
        </div>
      }

      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
            <tr>
              {[
              'Roll No',
              'Student Name',
              'Examination',
              'Board',
              'Year',
              'GPA',
              'Actions'].
              map((heading) =>
              <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ?
            <tr>
                <td
                colSpan={7}
                className="px-4 py-10 text-center text-slate-500">
                
                  <span className="inline-flex items-center gap-2">
                    <Loader2Icon
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true" />
                  
                    Loading student records…
                  </span>
                </td>
              </tr> :
            records.length > 0 ?
            records.map((record) =>
            <tr key={record.roll} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold">{record.roll}</td>
                  <td className="px-4 py-3">{record.studentName}</td>
                  <td className="px-4 py-3">{record.examination}</td>
                  <td className="px-4 py-3">{record.board}</td>
                  <td className="px-4 py-3">{record.year}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
                      {record.gpa}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="inline-flex items-center gap-1 rounded border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    
                        <PencilIcon
                      className="h-3.5 w-3.5"
                      aria-hidden="true" />
                    
                        Edit
                      </button>
                      <button
                    type="button"
                    onClick={() => onDelete(record.roll)}
                    disabled={deletingRoll === record.roll}
                    className="inline-flex items-center gap-1 rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-60">
                    
                        {deletingRoll === record.roll ?
                    <Loader2Icon
                      className="h-3.5 w-3.5 animate-spin"
                      aria-hidden="true" /> :


                    <Trash2Icon
                      className="h-3.5 w-3.5"
                      aria-hidden="true" />

                    }
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
            ) :

            <tr>
                <td
                colSpan={7}
                className="px-4 py-10 text-center text-slate-500">
                
                  No student records are available in this session.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>);

}
type RecordEditorProps = {
  draft: ResultRecord;
  editing: boolean;
  saving: boolean;
  error: string;
  onAddSubject: (group: 'subjects' | 'continuousAssessments') => void;
  onCancel: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onRemoveSubject: (
  group: 'subjects' | 'continuousAssessments',
  index: number)
  => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSubjectChange: (
  group: 'subjects' | 'continuousAssessments',
  index: number,
  field: keyof SubjectGrade,
  value: string)
  => void;
};
function RecordEditor({
  draft,
  editing,
  saving,
  error,
  onAddSubject,
  onCancel,
  onChange,
  onRemoveSubject,
  onSave,
  onSubjectChange
}: RecordEditorProps) {
  return (
    <section className="max-w-5xl">
      <div className="mb-4 border-b border-slate-300 pb-3">
        <h1 className="text-xl font-semibold">
          {editing ?
          'Edit Student Result' :
          'Input Complete Student Result Sheet'}
        </h1>
      </div>

      {error &&
      <div
        role="alert"
        className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        
          {error}
        </div>
      }

      <form
        onSubmit={onSave}
        className="rounded border border-slate-200 bg-white shadow-sm">
        
        <div className="bg-[#0b6623] px-5 py-3 font-bold text-white">
          Section 1: Student Profile Information
        </div>
        <div className="space-y-6 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Roll Number"
              name="roll"
              required
              value={draft.roll}
              onChange={onChange} />
            

            <InputField
              label="Registration Number"
              name="registration"
              required
              value={draft.registration}
              onChange={onChange} />
            

            <InputField
              label="Student Name"
              name="studentName"
              required
              value={draft.studentName}
              onChange={onChange}
              className="md:col-span-2" />
            

            <InputField
              label="Father's Name"
              name="fatherName"
              required
              value={draft.fatherName}
              onChange={onChange} />
            

            <InputField
              label="Mother's Name"
              name="motherName"
              required
              value={draft.motherName}
              onChange={onChange} />
            
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <SelectField
              label="Examination"
              name="examination"
              value={draft.examination}
              onChange={onChange}
              options={EXAM_OPTIONS} />
            

            <InputField
              label="Year"
              name="year"
              required
              type="number"
              min="1996"
              max="2026"
              value={draft.year}
              onChange={onChange} />
            

            <SelectField
              label="Board"
              name="board"
              value={draft.board}
              onChange={onChange}
              options={BOARD_OPTIONS} />
            

            <InputField
              label="Session"
              name="session"
              required
              value={draft.session}
              onChange={onChange}
              placeholder="e.g. 2023-24" />
            

            <InputField
              label="Group"
              name="group"
              required
              value={draft.group}
              onChange={onChange}
              placeholder="e.g. SCIENCE" />
            

            <SelectField
              label="Type"
              name="resultType"
              value={draft.resultType}
              onChange={onChange}
              options={TYPE_OPTIONS} />
            

            <SelectField
              label="Gender"
              name="gender"
              value={draft.gender}
              onChange={onChange}
              options={['Male', 'Female']} />
            

            <InputField
              label="Date of Birth"
              name="dateOfBirth"
              required
              value={draft.dateOfBirth}
              onChange={onChange}
              placeholder="dd-mm-yyyy" />
            
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <InputField
              label="Final Cumulative GPA"
              name="gpa"
              required
              type="number"
              min="0"
              max="5"
              step="0.01"
              value={draft.gpa}
              onChange={onChange}
              placeholder="e.g. 5.00" />
            

            <InputField
              label="Name of Institute"
              name="institute"
              required
              value={draft.institute}
              onChange={onChange}
              className="md:col-span-2" />
            
          </div>

          <SubjectEditor
            title="Section 2: Subject-wise Grade & Marks Entries"
            group="subjects"
            subjects={draft.subjects}
            onAdd={onAddSubject}
            onChange={onSubjectChange}
            onRemove={onRemoveSubject} />
          

          <SubjectEditor
            title="Section 3: Subject-wise Continuous Assessments"
            group="continuousAssessments"
            subjects={draft.continuousAssessments}
            onAdd={onAddSubject}
            onChange={onSubjectChange}
            onRemove={onRemoveSubject} />
          

          <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded bg-[#0b6623] px-4 py-2 text-sm font-medium text-white hover:bg-[#084e1b] focus:outline-none focus:ring-2 focus:ring-[#0b6623] focus:ring-offset-2 disabled:opacity-70">
              
              {saving &&
              <Loader2Icon
                className="h-4 w-4 animate-spin"
                aria-hidden="true" />

              }
              {editing ? 'Update Record Details' : 'Commit Student Records'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2">
              
              Cancel
            </button>
          </div>
        </div>
      </form>
    </section>);

}
type SubjectEditorProps = {
  title: string;
  group: 'subjects' | 'continuousAssessments';
  subjects: SubjectGrade[];
  onAdd: (group: 'subjects' | 'continuousAssessments') => void;
  onChange: (
  group: 'subjects' | 'continuousAssessments',
  index: number,
  field: keyof SubjectGrade,
  value: string)
  => void;
  onRemove: (group: 'subjects' | 'continuousAssessments', index: number) => void;
};
function SubjectEditor({
  title,
  group,
  subjects,
  onAdd,
  onChange,
  onRemove
}: SubjectEditorProps) {
  return (
    <fieldset className="border-t border-slate-200 pt-5">
      <legend className="mb-3 font-bold text-slate-600">{title}</legend>
      <div className="hidden grid-cols-[1fr_2fr_1fr_1fr_36px] gap-2 rounded bg-slate-50 p-2 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
        <span>Code</span>
        <span>Subject title</span>
        <span>Marks</span>
        <span>Grade</span>
        <span className="sr-only">Remove</span>
      </div>
      <div className="space-y-2">
        {subjects.map((subject, index) =>
        <div
          key={`${group}-${index}`}
          className="grid gap-2 rounded border border-slate-200 p-2 md:grid-cols-[1fr_2fr_1fr_1fr_36px] md:border-0 md:p-0">
          
            <input
            aria-label={`Subject ${index + 1} code`}
            value={subject.code}
            onChange={(event) =>
            onChange(group, index, 'code', event.target.value)
            }
            className="form-control"
            placeholder="Code" />
          

            <input
            aria-label={`Subject ${index + 1} name`}
            value={subject.name}
            onChange={(event) =>
            onChange(group, index, 'name', event.target.value)
            }
            className="form-control"
            placeholder="Subject name" />
          

            <input
            aria-label={`Subject ${index + 1} marks`}
            value={subject.marks ?? ''}
            onChange={(event) =>
            onChange(group, index, 'marks', event.target.value)
            }
            type="number"
            min="0"
            max="100"
            className="form-control"
            placeholder="Marks" />
          

            <input
            aria-label={`Subject ${index + 1} grade`}
            value={subject.grade}
            onChange={(event) =>
            onChange(group, index, 'grade', event.target.value)
            }
            className="form-control"
            placeholder="Grade" />
          

            <button
            type="button"
            onClick={() => onRemove(group, index)}
            disabled={subjects.length === 1}
            className="inline-flex h-8 w-8 items-center justify-center self-center rounded text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus:ring-2 focus:ring-red-600"
            aria-label={`Remove subject ${index + 1}`}>
            
              <XIcon className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onAdd(group)}
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#0b6623] hover:underline focus:outline-none focus:ring-2 focus:ring-[#0b6623]">
        
        <PlusIcon className="h-4 w-4" aria-hidden="true" /> Add subject
      </button>
    </fieldset>);

}
type InputFieldProps = {
  className?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
  value: string;
  min?: string;
  max?: string;
  step?: string;
};
function InputField({
  className = '',
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
  min,
  max,
  step
}: InputFieldProps) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        type={type}
        min={min}
        max={max}
        step={step}
        className="form-control" />
      
    </label>);

}
type SelectFieldProps = {
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  value: string;
};
function SelectField({
  label,
  name,
  onChange,
  options,
  value
}: SelectFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="form-control">
        
        {options.map((option) =>
        <option key={option} value={option}>
            {option}
          </option>
        )}
      </select>
    </label>);

}
type FeatureViewProps = {
  features: Record<FeatureKey, boolean>;
  onToggle: (feature: FeatureKey) => void;
};
function FeatureView({ features, onToggle }: FeatureViewProps) {
  const options: Array<{
    key: FeatureKey;
    label: string;
    description: string;
  }> = [
  {
    key: 'analytics',
    label: 'Enable Live Web Access Graph',
    description: 'Shows the public analytics access link on the portal.'
  },
  {
    key: 'bengali',
    label: 'Enable Bengali Language Localization',
    description: 'Makes the Bangla portal option available to visitors.'
  },
  {
    key: 'registration',
    label: 'Require Student Registration Validation',
    description:
    'Uses the registration number as an additional result-search check.'
  }];

  return (
    <section className="max-w-2xl">
      <div className="mb-4 border-b border-slate-300 pb-3">
        <h1 className="text-xl font-semibold">
          Manage Site Settings & Features
        </h1>
      </div>
      <div className="rounded border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-3 font-bold">
          Public View Controls
        </div>
        <div className="divide-y divide-slate-100">
          {options.map((option) =>
          <label
            key={option.key}
            className="flex cursor-pointer items-start justify-between gap-4 p-5">
            
              <span>
                <span className="block font-bold">{option.label}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">
                  {option.description}
                </span>
              </span>
              <input
              type="checkbox"
              checked={features[option.key]}
              onChange={() => onToggle(option.key)}
              className="mt-1 h-4 w-4 accent-[#0b6623]" />
            
            </label>
          )}
        </div>
      </div>
    </section>);

}