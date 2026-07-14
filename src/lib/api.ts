import type {
  ApiResult,
  ApiScore,
  ResultInput,
  ResultRecord,
  SearchRequest,
  SubjectGrade } from
'../types/results';

// ---------------------------------------------------------------------------
// Base URL — read from Vite env (.env.local -> VITE_API_BASE_URL)
// ---------------------------------------------------------------------------

const BASE_URL =
((import.meta as any).env?.VITE_API_BASE_URL as string | undefined)?.replace(
  /\/$/,
  ''
) ?? 'http://localhost:3000';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Thrown when the backend reports maintenance mode (HTTP 503 / code MAINTENANCE). */
export class MaintenanceError extends ApiError {
  constructor(message = 'The system is currently under maintenance.') {
    super(message, 503, 'MAINTENANCE');
    this.name = 'MaintenanceError';
  }
}

// ---------------------------------------------------------------------------
// Low-level request helper
// ---------------------------------------------------------------------------

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers
      },
      ...init
    });
  } catch {
    throw new ApiError(
      'Unable to reach the result server. Please check your connection and try again.',
      0
    );
  }

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (response.status === 503 || payload?.code === 'MAINTENANCE') {
    throw new MaintenanceError(
      payload?.message ?? 'The system is currently under maintenance.'
    );
  }

  if (!response.ok || payload?.ok === false) {
    throw new ApiError(
      payload?.message ?? `Request failed (${response.status}).`,
      response.status,
      payload?.code
    );
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Mappers: API shape <-> UI shape
// ---------------------------------------------------------------------------

function toSubjectGrade(score: ApiScore): SubjectGrade {
  return {
    code: score.code,
    name: score.name,
    grade: score.grade,
    marks: score.marks
  };
}

function toApiScore(subject: SubjectGrade): ApiScore {
  return {
    code: subject.code,
    name: subject.name,
    grade: subject.grade,
    marks: typeof subject.marks === 'number' ? subject.marks : 0
  };
}

export function apiResultToRecord(result: ApiResult): ResultRecord {
  return {
    roll: result.roll_no,
    registration: result.reg_no,
    studentName: result.student_name,
    fatherName: result.father_name,
    motherName: result.mother_name,
    examination: result.examination.name,
    year: String(result.examination.year),
    board: result.institute.board,
    session: result.examination.session,
    group: result.examination.group,
    resultType: result.examination.type,
    gender: result.gender,
    dateOfBirth: result.dob,
    gpa: Number(result.final_gpa ?? 0).toFixed(2),
    institute: result.institute.name,
    subjects: (result.subject_scores ?? []).map(toSubjectGrade),
    continuousAssessments: (result.continuous_assessments ?? []).map(
      toSubjectGrade
    )
  };
}

export function recordToResultInput(record: ResultRecord): ResultInput {
  return {
    roll_no: record.roll,
    reg_no: record.registration,
    student_name: record.studentName,
    father_name: record.fatherName,
    mother_name: record.motherName,
    gender: record.gender,
    dob: record.dateOfBirth,
    final_gpa: Number(record.gpa || 0),
    examination: {
      name: record.examination,
      year: Number(record.year || 0),
      session: record.session,
      group: record.group,
      type: record.resultType
    },
    institute: {
      name: record.institute,
      board: record.board
    },
    subject_scores: record.subjects.map(toApiScore),
    continuous_assessments: record.continuousAssessments.map(toApiScore)
  };
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

/** POST /search-result — look up a single student transcript. */
export async function searchResult(body: SearchRequest): Promise<ResultRecord> {
  const payload = await request<{ok: boolean;data: ApiResult;}>(
    '/search-result',
    {
      method: 'POST',
      body: JSON.stringify(body)
    }
  );
  return apiResultToRecord(payload.data);
}

// ---------------------------------------------------------------------------
// Admin — Results CRUD
// ---------------------------------------------------------------------------

/** GET /admin/api/results — list all records (latest first). */
export async function listResults(): Promise<ResultRecord[]> {
  const payload = await request<{
    ok: boolean;
    count: number;
    data: ApiResult[];
  }>('/admin/api/results');
  return (payload.data ?? []).map(apiResultToRecord);
}

/** POST /admin/api/results — create a record. */
export async function createResult(
record: ResultRecord)
: Promise<ResultRecord> {
  const payload = await request<{ok: boolean;data: ApiResult;}>(
    '/admin/api/results',
    {
      method: 'POST',
      body: JSON.stringify(recordToResultInput(record))
    }
  );
  return apiResultToRecord(payload.data);
}

/** PUT /admin/api/results/{roll} — full update of an existing record. */
export async function updateResult(
originalRoll: string,
record: ResultRecord)
: Promise<ResultRecord> {
  const payload = await request<{ok: boolean;data: ApiResult;}>(
    `/admin/api/results/${encodeURIComponent(originalRoll)}`,
    {
      method: 'PUT',
      body: JSON.stringify(recordToResultInput(record))
    }
  );
  return apiResultToRecord(payload.data);
}

/** DELETE /admin/api/results/{roll} — remove a record permanently. */
export async function deleteResult(roll: string): Promise<void> {
  await request<{ok: boolean;message: string;data: ApiResult;}>(
    `/admin/api/results/${encodeURIComponent(roll)}`,
    {
      method: 'DELETE'
    }
  );
}

// ---------------------------------------------------------------------------
// Admin — System / maintenance
// ---------------------------------------------------------------------------

/** GET /admin/api/system/maintenance — read current flag. */
export async function getMaintenanceMode(): Promise<boolean> {
  const payload = await request<{ok: boolean;maintenanceMode: boolean;}>(
    '/admin/api/system/maintenance'
  );
  return Boolean(payload.maintenanceMode);
}

/** POST /admin/api/system/maintenance — toggle the flag. */
export async function setMaintenanceMode(
maintenanceMode: boolean)
: Promise<boolean> {
  const payload = await request<{ok: boolean;maintenanceMode: boolean;}>(
    '/admin/api/system/maintenance',
    {
      method: 'POST',
      body: JSON.stringify({ maintenanceMode })
    }
  );
  return Boolean(payload.maintenanceMode);
}