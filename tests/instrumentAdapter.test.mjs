import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptInstrumentForGrading, usesSpecialLegacyTemplate } from '../src/utils/instrumentAdapter.js';

test('adapts an official rubric without replacing it with Dedo Mágico', () => {
  const adapted = adaptInstrumentForGrading({
    id: 'planner', name: 'Planificador personal', type: 'Rubrica',
    instrumentConfig: { criteriaList: [
      { id: 'c1', criteria: 'Completa sus metas', descriptors: { A: 'Completo', B: 'Parcial', C: 'Inicial' } },
      { id: 'c2', criteria: 'Identifica evidencias', descriptors: { A: 'Completo', B: 'Parcial', C: 'Inicial' } }
    ] }
  });
  assert.equal(adapted.items.length, 2);
  assert.equal(adapted.items[0].type, 'abc');
  assert.equal(adapted.items[0].text, 'Completa sus metas');
  assert.equal(adapted.items.reduce((sum, item) => sum + item.maxScore, 0), 100);
});

test('adapts official questions and preserves options and subquestions', () => {
  const adapted = adaptInstrumentForGrading({
    name: 'El dedo mágico 2',
    instrumentConfig: { maxScore: 20, questions: [{ id: 'q1', text: 'Ordena', type: 'matching', points: 20, options: [{ id: 'a', label: '1' }], subQuestions: [{ id: 's1', text: 'Hecho', correctValue: 'a' }] }] }
  });
  assert.equal(adapted.items[0].type, 'matching');
  assert.equal(adapted.items[0].maxScore, 20);
  assert.equal(adapted.items[0].subQuestions[0].correctValue, 'a');
});

test('keeps special templates only for Dedo Mágico 1 and Sachamama', () => {
  assert.equal(usesSpecialLegacyTemplate({ name: 'El dedo mágico N° 1' }), true);
  assert.equal(usesSpecialLegacyTemplate({ name: 'El dedo mágico 2' }), false);
  assert.equal(usesSpecialLegacyTemplate({ name: 'El mito de La Sachamama' }), true);
});
