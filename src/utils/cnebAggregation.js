const literalToBaseTwenty = (value) => {
  const literal = String(value ?? '').trim().toUpperCase();
  if (literal === 'AD') return 19;
  if (literal === 'A') return 17;
  if (literal === 'B') return 11;
  if (literal === 'C') return 5;
  return null;
};

const gradeToBaseTwenty = (grade, evaluation) => {
  const literalValue = literalToBaseTwenty(grade?.score);
  if (literalValue !== null) return literalValue;

  const score = Number(grade?.score);
  if (!Number.isFinite(score)) return null;

  const configuredMaximum = Number(
    evaluation?.maxScore || evaluation?.instrumentConfig?.maxScore || 20
  );
  if (configuredMaximum > 20) return Math.max(0, Math.min(20, (score / configuredMaximum) * 20));
  return Math.max(0, Math.min(20, score));
};

const average = (values) => {
  const validValues = values.filter(value => Number.isFinite(value));
  if (!validValues.length) return null;
  return Math.round(validValues.reduce((sum, value) => sum + value, 0) / validValues.length);
};

// Builds the CNEB bottom-up view exclusively from the saved official register.
// Some historical instruments were stored at competency level only. Their
// saved grade is projected to each desempeño of that competency only when the
// instrument has no real item-to-desempeño link. Instruments with links keep
// their exact bottom-up mapping.
export const createCnebMatrixCalculator = ({ evaluations = [], grades = [], studentId, unit, structure = [] }) => {
  const desempenoScores = {};
  const desempenoEvidence = {};
  const capacityEvidence = {};
  const competencyEvidence = {};
  const isUnit2 = String(unit) === '2';
  const competenciesById = new Map((structure || []).map(competency => [competency.id, competency]));
  const toMatrixValue = (baseTwentyScore) => {
    if (!isUnit2) return baseTwentyScore;
    // Unit 2 averages literal marks, never raw points: A=3, B=2, C=1.
    return baseTwentyScore >= 15 ? 3 : baseTwentyScore >= 8 ? 2 : 1;
  };

  evaluations.forEach(evaluation => {
    const grade = grades
      .filter(item => item.studentId === studentId && item.evaluationId === evaluation.id)
      .sort((left, right) => {
        const leftDetails = Object.keys(left.details || {}).length;
        const rightDetails = Object.keys(right.details || {}).length;
        if (leftDetails !== rightDetails) return rightDetails - leftDetails;
        return new Date(right.updatedAt || 0).getTime() - new Date(left.updatedAt || 0).getTime();
      })[0];
    if (!grade) return;

    let hasMappedEvidence = false;
    (evaluation.items || []).forEach(item => {
      if (!item?.desempenoId) return;
      const score = Number(grade.details?.itemScores?.[item.id]);
      const maximum = Number(item.maxScore);
      if (!Number.isFinite(score) || !Number.isFinite(maximum) || maximum <= 0) return;

      if (!desempenoScores[item.desempenoId]) {
        desempenoScores[item.desempenoId] = { total: 0, max: 0 };
      }
      desempenoScores[item.desempenoId].total += score;
      desempenoScores[item.desempenoId].max += maximum;
      const baseTwentyValue = Math.round((score / maximum) * 20);
      desempenoEvidence[item.desempenoId] ||= [];
      desempenoEvidence[item.desempenoId].push({
        evaluationId: evaluation.id,
        instrumentName: evaluation.name || 'Instrumento sin nombre',
        evidenceName: item.text || `Pregunta ${Object.keys(desempenoScores).length}`,
        value: toMatrixValue(baseTwentyValue),
        projected: false
      });
      hasMappedEvidence = true;
    });

    const overallScore = gradeToBaseTwenty(grade, evaluation);
    if (!Number.isFinite(overallScore) || hasMappedEvidence) return;

    if (evaluation.competenceId) {
      const competency = competenciesById.get(evaluation.competenceId);
      (competency?.capacities || []).forEach(capacity => {
        (capacity.desempenos || []).forEach(desempeno => {
          desempenoEvidence[desempeno.id] ||= [];
          desempenoEvidence[desempeno.id].push({
            evaluationId: evaluation.id,
            instrumentName: evaluation.name || 'Instrumento sin nombre',
            evidenceName: 'Calificativo general del instrumento',
            value: toMatrixValue(overallScore),
            projected: true
          });
        });
      });
    } else if (evaluation.capacityId) {
      capacityEvidence[evaluation.capacityId] ||= [];
      capacityEvidence[evaluation.capacityId].push(toMatrixValue(overallScore));
    } else if (evaluation.competenceId) {
      competencyEvidence[evaluation.competenceId] ||= [];
      competencyEvidence[evaluation.competenceId].push(toMatrixValue(overallScore));
    }
  });

  const getDesempenoGrade = (desempenoId) => {
    return average((desempenoEvidence[desempenoId] || []).map(evidence => evidence.value));
  };

  const getDesempenoEvidence = (desempenoId) => desempenoEvidence[desempenoId] || [];

  const getCapacityGrade = (capacity) => {
    const detailedScores = (capacity?.desempenos || [])
      .map(desempeno => getDesempenoGrade(desempeno.id))
      .filter(value => value !== null);
    return average([...detailedScores, ...(capacityEvidence[capacity?.id] || [])]);
  };

  const getCompetencyGrade = (competency) => {
    const capacityScores = (competency?.capacities || [])
      .map(capacity => getCapacityGrade(capacity))
      .filter(value => value !== null);
    return average([...capacityScores, ...(competencyEvidence[competency?.id] || [])]);
  };

  return { getDesempenoGrade, getDesempenoEvidence, getCapacityGrade, getCompetencyGrade };
};
