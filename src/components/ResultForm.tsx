import React, { useState } from 'react';
import { type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { CaptchaCanvas } from './CaptchaCanvas';
import { ApiError, MaintenanceError, searchResult } from '../lib/api';
import type { ExamName } from '../types/results';
const years = Array.from(
  {
    length: 31
  },
  (_, index) => String(2026 - index)
);
const boards = [
'Barisal',
'Chittagong',
'Comilla',
'Dhaka',
'Dinajpur',
'Jashore',
'Mymensingh',
'Rajshahi',
'Sylhet',
'Madrasah',
'Technical'];

// Maps the public exam picker to the API `exam` enum values.
const examOptions: {
  value: ExamName;
  label: string;
}[] = [
{
  value: 'SSC',
  label: 'SSC/Dakhil/Equivalent'
},
{
  value: 'HSC',
  label: 'HSC/Alim/Equivalent'
},
{
  value: 'JSC',
  label: 'JSC/JDC'
}];

export function ResultForm() {
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamName | ''>('');
  const [year, setYear] = useState('2026');
  const [board, setBoard] = useState('');
  const [resultType, setResultType] = useState('');
  const [roll, setRoll] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isIndividual = resultType === 'individual';
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!exam) {
      setError('Please select the name of examination.');
      return;
    }
    if (!board) {
      setError('Please select the name of board.');
      return;
    }
    if (captchaInput.trim() !== captchaCode) {
      setError('Incorrect security key. Please try again.');
      setCaptchaInput('');
      return;
    }
    setSubmitting(true);
    try {
      const record = await searchResult({
        exam,
        year: Number(year),
        board: board.toUpperCase(),
        roll: roll.trim()
      });
      navigate('/result', {
        state: {
          record
        }
      });
    } catch (err) {
      if (err instanceof MaintenanceError) {
        setError(
          'The result server is temporarily under maintenance. Please try again later.'
        );
      } else if (err instanceof ApiError && err.status === 404) {
        setError(
          'No result found for the provided information. Please verify and try again.'
        );
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
        <FieldLabel htmlFor="examination">Name of Examination</FieldLabel>
        <select
          id="examination"
          value={exam}
          onChange={(event) => {
            setExam(event.target.value as ExamName | '');
            setError('');
          }}
          required
          className="form-control">
          
          <option value="">Select One</option>
          {examOptions.map((option) =>
          <option key={option.value} value={option.value}>
              {option.label}
            </option>
          )}
        </select>

        <FieldLabel htmlFor="year">Year of Examination</FieldLabel>
        <select
          id="year"
          value={year}
          onChange={(event) => setYear(event.target.value)}
          required
          className="form-control">
          
          {years.map((option) =>
          <option key={option} value={option}>
              {option}
            </option>
          )}
        </select>

        <FieldLabel htmlFor="board">Name of Board</FieldLabel>
        <select
          id="board"
          value={board}
          onChange={(event) => {
            setBoard(event.target.value);
            setError('');
          }}
          required
          className="form-control">
          
          <option value="">Select One</option>
          {boards.map((option) =>
          <option key={option} value={option}>
              {option}
            </option>
          )}
        </select>

        <FieldLabel htmlFor="resultType" emphasized>
          Type of Result
        </FieldLabel>
        <select
          id="resultType"
          value={resultType}
          onChange={(event) => {
            setResultType(event.target.value);
            setError('');
          }}
          required
          className="form-control">
          
          <option value="">Select One</option>
          <option value="individual">Individual Result</option>
          <option value="institution">Institution Result</option>
          <option value="center">Center Result</option>
          <option value="district">District Result</option>
        </select>
      </div>

      {isIndividual &&
      <div className="mt-5 grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
          <FieldLabel htmlFor="roll">Roll Number</FieldLabel>
          <input
          id="roll"
          value={roll}
          onChange={(event) => {
            setRoll(event.target.value);
            setError('');
          }}
          required
          inputMode="numeric"
          className="form-control"
          placeholder="Enter Roll Number" />
        

          <FieldLabel htmlFor="registration">
            Registration Number <span className="font-normal">(Optional)</span>
          </FieldLabel>
          <input
          id="registration"
          className="form-control"
          placeholder="Enter Registration Number" />
        

          <FieldLabel htmlFor="captchaInput" emphasized>
            Robot Prevention Technique (CAPTCHA)
          </FieldLabel>
          <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <CaptchaCanvas onCodeChange={setCaptchaCode} />
            <div>
              <input
              id="captchaInput"
              value={captchaInput}
              onChange={(event) => {
                setCaptchaInput(event.target.value);
                setError('');
              }}
              required
              autoComplete="off"
              aria-describedby={error ? 'form-error' : undefined}
              aria-invalid={Boolean(error)}
              className="form-control"
              placeholder="Type the digits visible on the image" />
            
            </div>
          </div>

          {error &&
        <>
              <div className="hidden sm:block" />
              <p
            id="form-error"
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            
                {error}
              </p>
            </>
        }

          <div className="hidden sm:block" />
          <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 justify-self-start rounded bg-[#009650] px-5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-[#007a41] focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70">
          
            {submitting &&
          <Loader2Icon
            className="h-4 w-4 animate-spin"
            aria-hidden="true" />

          }
            {submitting ? 'Searching…' : 'View Result'}
          </button>
        </div>
      }

      {!isIndividual && error &&
      <p
        id="form-error"
        role="alert"
        className="mt-5 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        
          {error}
        </p>
      }
    </form>);

}
type FieldLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  emphasized?: boolean;
};
function FieldLabel({
  htmlFor,
  children,
  emphasized = false
}: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={`font-bold text-[#2b2b2b] ${emphasized ? 'text-[#d9534f]' : ''}`}>
      
      {children}
    </label>);

}