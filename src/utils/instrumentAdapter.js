const normalizedName = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const usesSpecialLegacyTemplate = (instrument) => {
  const name = normalizedName(instrument?.name);
  return name.includes('sachamama') ||
    (name.includes('dedo magico') && (name.includes('n° 1') || name.includes('nº 1') || /dedo magico\s*1/.test(name)));
};

const distributedScore = (index, length, total = 100) => {
  if (!length) return total;
  const base = Number((total / length).toFixed(1));
  return index === length - 1 ? Number((total - base * (length - 1)).toFixed(1)) : base;
};

export const adaptInstrumentForGrading = (instrument) => {
  if (!instrument || (instrument.items || []).length > 0 || usesSpecialLegacyTemplate(instrument)) return instrument;
  const config = instrument.instrumentConfig || {};
  let items = [];

  if (Array.isArray(config.criteriaList) && config.criteriaList.length > 0) {
    const rubricEntries = config.criteriaList.flatMap((criterion, criterionIndex) => {
      if (!Array.isArray(criterion.indicators) || criterion.indicators.length === 0) return [{ criterion, criterionIndex, indicator: null }];
      return criterion.indicators.map(indicator => ({ criterion, criterionIndex, indicator }));
    });
    items = rubricEntries.map(({ criterion, criterionIndex, indicator }, index) => ({
      id: indicator?.id || criterion.id || `criterion_${criterionIndex}`,
      text: indicator?.text || criterion.criteria || criterion.name || `Criterio ${criterionIndex + 1}`,
      type: 'abc',
      maxScore: distributedScore(index, rubricEntries.length),
      suggestedAnswer: [
        criterion.name && indicator && `Capacidad/criterio: ${criterion.name}`,
        criterion.descriptors?.AD && `AD: ${criterion.descriptors.AD}`,
        criterion.descriptors?.A && `A: ${criterion.descriptors.A}`,
        criterion.descriptors?.B && `B: ${criterion.descriptors.B}`,
        criterion.descriptors?.C && `C: ${criterion.descriptors.C}`
      ].filter(Boolean).join(' · '),
      descriptors: criterion.descriptors || null,
      levels: config.levels || null
    }));
  } else if (Array.isArray(config.items) && config.items.length > 0) {
    items = config.items.map((item, index) => ({
      ...item,
      id: item.id || `check_${index}`,
      text: item.text || item.name || `Indicador ${index + 1}`,
      type: item.type || 'direct',
      maxScore: item.maxScore || item.points || distributedScore(index, config.items.length)
    }));
  } else if (Array.isArray(config.questions) && config.questions.length > 0) {
    const configuredTotal = Number(config.maxScore) || config.questions.reduce((sum, item) => sum + (Number(item.points) || 0), 0) || 100;
    items = config.questions.map((question, index) => ({
      ...question,
      id: question.id || `question_${index}`,
      text: question.text || `Pregunta ${index + 1}`,
      type: question.type || 'direct',
      maxScore: Number(question.points) || distributedScore(index, config.questions.length, configuredTotal),
      options: question.options || [],
      subQuestions: (question.subQuestions || []).map(subQuestion => ({
        ...subQuestion,
        type: subQuestion.type || (question.type === 'matching' ? 'choice' : 'direct')
      }))
    }));
  }

  if (items.length === 0) return instrument;
  return {
    ...instrument,
    items,
    adaptedFromOfficialFormat: true
  };
};
