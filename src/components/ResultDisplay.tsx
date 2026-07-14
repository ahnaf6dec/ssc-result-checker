import React from 'react';
import type { ResultRecord, SubjectGrade } from '../types/results';
type ResultDisplayProps = {
  record: ResultRecord;
};
export function ResultDisplay({ record }: ResultDisplayProps) {
  return (
    <div className="space-y-6">
      <section className="overflow-x-auto" aria-labelledby="student-summary">
        <table className="w-full min-w-[680px] border border-slate-300 text-left text-[13px]">
          <caption id="student-summary" className="sr-only">
            Student information summary
          </caption>
          <thead>
            <tr>
              <th
                colSpan={4}
                className="bg-[#10a35e] px-3 py-2 font-bold text-white">
                
                Student Information Summary
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            <SummaryRow
              label="Roll No"
              value={record.roll}
              secondLabel="Registration No"
              secondValue={record.registration} />
            

            <SummaryRow label="Name of Student" value={record.studentName} />
            <SummaryRow label="Father's Name" value={record.fatherName} />
            <SummaryRow label="Mother's Name" value={record.motherName} />
            <SummaryRow
              label="Board"
              value={record.board}
              secondLabel="Session"
              secondValue={record.session} />
            

            <SummaryRow
              label="Group"
              value={record.group}
              secondLabel={`Type: ${record.resultType}`}
              secondValue={`Gender: ${record.gender}`} />
            

            <SummaryRow
              label="Result"
              value={`GPA=${record.gpa}`}
              secondLabel="Date of Birth"
              secondValue={record.dateOfBirth}
              strong />
            

            <SummaryRow label="Name of Institute" value={record.institute} />
          </tbody>
        </table>
      </section>

      <GradeTable title="Subject-wise Grade/Marks" grades={record.subjects} />
      {record.continuousAssessments.length > 0 &&
      <GradeTable
        title="Subject-wise Grade/Marks for Continuous Assessment"
        grades={record.continuousAssessments} />

      }
    </div>);

}
type SummaryRowProps = {
  label: string;
  value: string;
  secondLabel?: string;
  secondValue?: string;
  strong?: boolean;
};
function SummaryRow({
  label,
  value,
  secondLabel,
  secondValue,
  strong
}: SummaryRowProps) {
  if (!secondLabel || !secondValue) {
    return (
      <tr>
        <td className="w-1/5 bg-slate-50 px-3 py-2 text-[#555]">{label}</td>
        <td
          colSpan={3}
          className={`px-3 py-2 font-medium text-black ${strong ? 'font-bold' : ''}`}>
          
          {value}
        </td>
      </tr>);

  }
  return (
    <tr>
      <td className="w-1/5 bg-slate-50 px-3 py-2 text-[#555]">{label}</td>
      <td
        className={`w-[30%] px-3 py-2 font-medium text-black ${strong ? 'font-bold' : ''}`}>
        
        {value}
      </td>
      <td className="w-1/5 bg-slate-50 px-3 py-2 text-[#555]">{secondLabel}</td>
      <td className="w-[30%] px-3 py-2 font-medium text-black">
        {secondValue}
      </td>
    </tr>);

}
type GradeTableProps = {
  title: string;
  grades: SubjectGrade[];
};
function GradeTable({ title, grades }: GradeTableProps) {
  const showMarks = grades.some((subject) => typeof subject.marks === 'number');
  return (
    <section>
      <h2 className="mb-3 text-center text-[15px] font-medium text-[#222]">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border border-slate-300 text-left text-[13px]">
          <thead className="bg-[#10a35e] text-white">
            <tr>
              <th className="w-1/5 px-3 py-2">Subject Code</th>
              <th className="px-3 py-2">Subject Name</th>
              {showMarks && <th className="w-1/6 px-3 py-2">Marks</th>}
              <th className="w-1/5 px-3 py-2">Grade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {grades.map((subject, index) =>
            <tr
              key={`${subject.code}-${index}`}
              className={index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
              
                <td className="px-3 py-2">{subject.code}</td>
                <td className="px-3 py-2">{subject.name}</td>
                {showMarks &&
              <td className="px-3 py-2">
                    {typeof subject.marks === 'number' ? subject.marks : '—'}
                  </td>
              }
                <td className="px-3 py-2 font-bold">{subject.grade}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>);

}