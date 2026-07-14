// ---------------------------------------------------------------------------
// API-aligned types (match the OpenAPI schema exactly)
// ---------------------------------------------------------------------------

export type ExamName = 'JSC' | 'JDC' | 'SSC' | 'DAKHIL' | 'HSC' | 'ALIM';
export type ResultType = 'REGULAR' | 'IRREGULAR';

export type ApiScore = {
  code: string;
  name: string;
  marks: number;
  grade: string;
};

export type ApiExamination = {
  name: ExamName;
  year: number;
  session: string;
  group: string;
  type: ResultType;
};

export type ApiInstitute = {
  name: string;
  board: string;
};

/** Payload accepted by POST / PUT /admin/api/results */
export type ResultInput = {
  roll_no: string;
  reg_no: string;
  student_name: string;
  father_name: string;
  mother_name: string;
  gender: string;
  dob: string;
  final_gpa: number;
  examination: ApiExamination;
  institute: ApiInstitute;
  subject_scores?: ApiScore[];
  continuous_assessments?: ApiScore[];
};

/** Full record returned by the API (ResultInput + server fields) */
export type ApiResult = ResultInput & {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Body for POST /search-result */
export type SearchRequest = {
  exam: ExamName;
  year: number;
  board: string;
  roll: string;
};

// ---------------------------------------------------------------------------
// UI-facing types (flattened for display / form editing)
// ---------------------------------------------------------------------------

export type SubjectGrade = {
  code: string;
  name: string;
  grade: string;
  marks?: number;
};

export type ResultRecord = {
  roll: string;
  registration: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  examination: ExamName;
  year: string;
  board: string;
  session: string;
  group: string;
  resultType: ResultType;
  gender: string;
  dateOfBirth: string;
  gpa: string;
  institute: string;
  subjects: SubjectGrade[];
  continuousAssessments: SubjectGrade[];
};