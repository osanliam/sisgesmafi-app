import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEvaluationHealthReport,
  buildEvaluationOwnership,
  canViewEvaluation,
  ratioToLiteralGrade,
  resolveEvaluationScale
} from '../src/utils/evaluationAccess.js';

test('a private instrument is visible only to its owner and section', () => {
  const evaluation = { ownerId: 'teacher-a', section: 'B', sections: ['B'] };
  assert.equal(canViewEvaluation(evaluation, { role: 'teacher', userId: 'teacher-a', section: 'B' }), true);
  assert.equal(canViewEvaluation(evaluation, { role: 'teacher', userId: 'teacher-b', section: 'B' }), false);
  assert.equal(canViewEvaluation(evaluation, { role: 'teacher', userId: 'teacher-a', section: 'C' }), false);
  assert.equal(canViewEvaluation(evaluation, { role: 'admin', userId: 'admin_1', section: 'B' }), true);
});

test('new teacher instruments default to private ownership', () => {
  const ownership = buildEvaluationOwnership({ section: 'A' }, { role: 'teacher', userId: 'teacher-a' });
  assert.deepEqual(ownership.sections, ['A']);
  assert.equal(ownership.ownerId, 'teacher-a');
  assert.equal(ownership.visibility, 'private');
});

test('unit 2 defaults to literal while explicit instrument scale wins', () => {
  assert.equal(resolveEvaluationScale({ unit: '2' }, '10'), 'literal');
  assert.equal(resolveEvaluationScale({ unit: '3', gradingScale: '20' }, '10'), '20');
});

test('literal thresholds follow unit 2 and both unit 3 tables', () => {
  assert.equal(ratioToLiteralGrade(0.75, { unit: '2' }), 'A');
  assert.equal(ratioToLiteralGrade(0.40, { unit: '2' }), 'B');
  assert.equal(ratioToLiteralGrade(0.39, { unit: '2' }), 'C');
  assert.equal(ratioToLiteralGrade(0.87, { unit: '3', maxGradeScale: 'AD' }), 'AD');
  assert.equal(ratioToLiteralGrade(0.63, { unit: '3', maxGradeScale: 'AD' }), 'A');
  assert.equal(ratioToLiteralGrade(0.51, { unit: '3', maxGradeScale: 'A' }), 'B');
  assert.equal(ratioToLiteralGrade(0.84, { unit: '3', maxGradeScale: 'A' }), 'A');
});

test('health report detects legacy, duplicates and orphan grades', () => {
  const evaluations = [
    { id: 'e1', name: 'Ficha', courseId: 'c1', competenceId: 'x', unit: '2' },
    { id: 'e2', name: 'Ficha', courseId: 'c1', competenceId: 'x', unit: '2' }
  ];
  const report = buildEvaluationHealthReport({
    evaluations,
    students: [{ id: 's1' }],
    grades: [{ id: 'g1', evaluationId: 'missing', studentId: 'missing' }]
  });
  assert.equal(report.legacyWithoutOwner, 2);
  assert.equal(report.duplicateEvaluations, 2);
  assert.equal(report.orphanGrades, 1);
  assert.equal(report.gradesWithoutStudent, 1);
});
