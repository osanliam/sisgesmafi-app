const ADMIN_ROLES = new Set(['admin', 'director', 'subdirector_acad', 'coordinator']);

export const normalizeKey = (value) => String(value ?? '').trim().toLowerCase();

export const isEvaluationManager = (role) => ADMIN_ROLES.has(role);

export const getEvaluationOwnerId = (evaluation) =>
  evaluation?.ownerId || evaluation?.createdBy || evaluation?.teacherId || null;

export const evaluationMatchesSection = (evaluation, section) => {
  const selected = normalizeKey(section);
  if (!selected || selected === 'todas') return true;
  const scopedSections = Array.isArray(evaluation?.sections)
    ? evaluation.sections.map(normalizeKey).filter(Boolean)
    : [];
  if (scopedSections.length > 0) return scopedSections.includes(selected);
  const legacySection = normalizeKey(evaluation?.section);
  return !legacySection || legacySection === selected;
};

export const canViewEvaluation = (evaluation, { role, userId, section } = {}) => {
  if (!evaluation || !evaluationMatchesSection(evaluation, section)) return false;
  if (isEvaluationManager(role)) return true;
  const ownerId = getEvaluationOwnerId(evaluation);
  // Historical instruments predate ownership. Keep them visible until the
  // administrator assigns an owner instead of hiding existing grade columns.
  if (!ownerId) return true;
  return Boolean(userId) && ownerId === userId;
};

export const buildEvaluationOwnership = (evaluation, { role, userId } = {}) => {
  const existingOwner = getEvaluationOwnerId(evaluation);
  const ownerId = existingOwner || userId || 'admin_1';
  const section = evaluation?.section && evaluation.section !== 'Todas'
    ? evaluation.section
    : null;
  const sections = Array.isArray(evaluation?.sections)
    ? [...new Set(evaluation.sections.filter(Boolean))]
    : (section ? [section] : []);

  return {
    ownerId,
    createdBy: evaluation?.createdBy || ownerId,
    teacherId: evaluation?.teacherId || ownerId,
    visibility: evaluation?.visibility || (isEvaluationManager(role) ? 'institution' : 'private'),
    section,
    sections
  };
};

export const resolveEvaluationScale = (evaluation, fallbackScale = '10') => {
  if (evaluation?.gradingScale) return String(evaluation.gradingScale);
  if (evaluation?.maxGradeScale === 'AD' || evaluation?.maxGradeScale === 'A') return 'literal';
  if (String(evaluation?.unit) === '2') return 'literal';
  return String(fallbackScale);
};

export const ratioToLiteralGrade = (ratio, { unit, maxGradeScale = 'A' } = {}) => {
  const percent = Math.max(0, Math.min(100, Math.round((Number(ratio) || 0) * 100)));
  if (String(unit) === '2') return percent >= 75 ? 'A' : percent >= 40 ? 'B' : 'C';
  if (maxGradeScale === 'AD') {
    return percent >= 87 ? 'AD' : percent >= 63 ? 'A' : percent >= 37 ? 'B' : 'C';
  }
  return percent >= 84 ? 'A' : percent >= 51 ? 'B' : 'C';
};

export const buildEvaluationHealthReport = ({ evaluations = [], grades = [], students = [] }) => {
  const evaluationIds = new Set(evaluations.map(item => item?.id).filter(Boolean));
  const studentIds = new Set(students.map(item => item?.id).filter(Boolean));
  const duplicateKeys = new Map();
  evaluations.forEach(item => {
    const key = [
      getEvaluationOwnerId(item) || 'legacy', item?.courseId, item?.competenceId,
      item?.bimester || '1', item?.unit ?? '0', normalizeKey(item?.section), normalizeKey(item?.name)
    ].join('|');
    duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
  });
  return {
    legacyWithoutOwner: evaluations.filter(item => !getEvaluationOwnerId(item)).length,
    evaluationsWithoutSection: evaluations.filter(item => !item?.section && !(item?.sections || []).length).length,
    duplicateEvaluations: [...duplicateKeys.values()].filter(count => count > 1).reduce((sum, count) => sum + count, 0),
    orphanGrades: grades.filter(item => item?.evaluationId && !evaluationIds.has(item.evaluationId)).length,
    gradesWithoutStudent: grades.filter(item => item?.studentId && !studentIds.has(item.studentId)).length
  };
};
