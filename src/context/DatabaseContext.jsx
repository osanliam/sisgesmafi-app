import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Configure backend API base URL for cloud deployment
if (import.meta.env.VITE_API_URL) {
  let apiUrl = import.meta.env.VITE_API_URL.trim();
  if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
  }
  axios.defaults.baseURL = apiUrl;
}
import {
  initialStudents,
  initialTeachers,
  initialCourses,
  initialGrades,
  initialAttendance,
  initialConduct,
  initialResources,
  initialLibrary
} from '../utils/mockData';

const cleanStudentAvatars = (studentsList) => {
  if (!studentsList) return [];
  return studentsList.map(s => {
    let gender = s.gender;
    if (!gender) {
      if (s.name && s.name.includes('Sofía')) gender = 'Femenino';
      else if (s.name && s.name.includes('Mateo')) gender = 'Masculino';
      else gender = 'Masculino';
    }
    const isPlaceholder = !s.avatar || 
                          s.avatar.includes('unsplash.com') || 
                          s.avatar === '' ||
                          s.avatar.includes('photo-');
    return {
      ...s,
      gender,
      avatar: isPlaceholder ? (gender === 'Femenino' ? '/avatar_female.webp' : '/avatar_male.webp') : s.avatar
    };
  });
};

const mergeCollections = (key, localValue, dbValue) => {
  const localList = Array.isArray(localValue) ? localValue : [];
  const serverList = Array.isArray(dbValue) ? dbValue : [];

  if (localList.length === 0) {
    return { merged: serverList, hasChanges: false };
  }
  if (serverList.length === 0) {
    return { merged: localList, hasChanges: true };
  }

  const snapshotStored = localStorage.getItem(`sga_sync_snapshot_${key}`);
  let snapshotList = [];
  if (snapshotStored) {
    try {
      snapshotList = JSON.parse(snapshotStored);
    } catch (e) {
      console.warn(`Failed to parse sync snapshot for ${key}`, e);
    }
  }
  if (!Array.isArray(snapshotList)) {
    snapshotList = [];
  }

  const localMap = new Map(localList.map(item => [item.id, item]));
  const serverMap = new Map(serverList.map(item => [item.id, item]));
  const snapshotMap = new Map(snapshotList.map(item => [item.id, item]));

  const mergedMap = new Map();
  let hasChanges = false;

  const allIds = new Set([
    ...localList.map(item => item.id),
    ...serverList.map(item => item.id),
    ...snapshotList.map(item => item.id)
  ]);

  for (const id of allIds) {
    if (!id) continue;
    const localItem = localMap.get(id);
    const serverItem = serverMap.get(id);
    const snapshotItem = snapshotMap.get(id);

    if (localItem && serverItem) {
      const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
      const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;

      if (localTime > serverTime) {
        mergedMap.set(id, localItem);
        hasChanges = true;
      } else if (serverTime > localTime) {
        mergedMap.set(id, serverItem);
      } else {
        if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
          mergedMap.set(id, localItem);
          hasChanges = true;
        } else {
          mergedMap.set(id, serverItem);
        }
      }
    } else if (localItem && !serverItem) {
      mergedMap.set(id, localItem);
      hasChanges = true;
    } else if (!localItem && serverItem) {
      mergedMap.set(id, serverItem);
    }
  }

  const mergedList = Array.from(mergedMap.values());
  return { merged: mergedList, hasChanges };
};

export const DatabaseContext = createContext();

export const DatabaseProvider = ({ children }) => {
  // Authentication states
  const [currentRole, setCurrentRole] = useState(() => {
    try {
      const stored = localStorage.getItem('sga_session');
      if (stored) {
        return JSON.parse(stored).role;
      }
    } catch (e) {}
    return null;
  });
  const [adminProfile, setAdminProfile] = useState({
    id: "admin_1",
    name: "Administrador Central",
    email: "admin@sga.edu",
    phone: "+51 987 654 321",
    role: "Administrador General",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  });
  const [currentUser, setCurrentUser] = useState(null);

  const resolveUser = (role, userId, studentsList, teachersList, adminPrf) => {
    if (role === 'admin') {
      return adminPrf;
    } else if (role === 'student') {
      return (studentsList || []).find(s => s.id === userId) || null;
    } else if (role === 'parent') {
      const child = (studentsList || []).find(s => s.id === userId);
      if (child) {
        return {
          id: `prt_${child.id}`,
          name: child.parentName || 'Apoderado',
          email: child.parentEmail || '',
          phone: child.parentPhone || '',
          childId: child.id
        };
      }
    } else {
      return (teachersList || []).find(t => t.id === userId) || null;
    }
    return null;
  };

  // DB collection states
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [conduct, setConduct] = useState([]);
  const [resources, setResources] = useState([]);
  const [library, setLibrary] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customGroups, setCustomGroups] = useState([]);
  const [groupAttendance, setGroupAttendance] = useState([]);
  const [groupGrades, setGroupGrades] = useState([]);
  const [reinforcementGrades, setReinforcementGrades] = useState([]);

  // Refs that always hold the latest array values — avoids stale-closure bugs
  // when saveGrade / saveReinforcementGrade are called in rapid succession.
  const gradesRef = useRef([]);
  const reinforcementGradesRef = useRef([]);

  // Wrapped setters that keep refs in sync
  const setGradesSafe = (val) => {
    gradesRef.current = val;
    setGrades(val);
  };
  const setReinforcementGradesSafe = (val) => {
    reinforcementGradesRef.current = val;
    setReinforcementGrades(val);
  };

  // System Logs & Configurations
  const [gradingScale, setGradingScale] = useState('10'); // '10' or '20'
  const [passingGrade, setPassingGrade] = useState(6.0);
  const [institutionName, setInstitutionName] = useState('Colegio de Alto Rendimiento SISGESMAFI');
  const [systemLogs, setSystemLogs] = useState([]);
  const [activePeriods, setActivePeriods] = useState({
    bimesters: { '1': true, '2': true, '3': true, '4': true },
    units: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true }
  });
  const [dbConnection, setDbConnection] = useState('connecting'); // 'connecting', 'connected', 'local_fallback'
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'

  const runOneTimeReinforcementCleanup = async (studentsList, reinforcementGradesList) => {
    try {
      const cleanupDone = localStorage.getItem('sga_reinforcement_cleanup_done_v2');
      if (cleanupDone) return reinforcementGradesList;

      if (!studentsList || studentsList.length === 0 || !reinforcementGradesList || reinforcementGradesList.length === 0) {
        localStorage.setItem('sga_reinforcement_cleanup_done_v2', 'true');
        return reinforcementGradesList;
      }

      const groups = {};
      studentsList.forEach(s => {
        const key = `${(s.gradeLevel || '').trim().toLowerCase()}_${(s.section || '').trim().toLowerCase()}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });

      const targetIndices = [5, 8, 13, 14, 19, 33];
      const idsToRemove = new Set();

      Object.keys(groups).forEach(k => {
        const sorted = groups[k].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));
        targetIndices.forEach(idx => {
          if (sorted[idx]) {
            idsToRemove.add(sorted[idx].id);
          }
        });
      });

      const cleanedList = reinforcementGradesList.filter(g => !idsToRemove.has(g.studentId));
      if (cleanedList.length !== reinforcementGradesList.length) {
        localStorage.setItem('sga_reinforcementGrades', JSON.stringify(cleanedList));
        try {
          setSaveStatus('saving');
          await axios.post('/api/db/save', {
            collectionName: 'reinforcementGrades',
            data: cleanedList
          });
          localStorage.setItem('sga_sync_snapshot_reinforcementGrades', JSON.stringify(cleanedList));
          setSaveStatus('saved');
        } catch (e) {
          console.warn('Failed to sync cleaned reinforcementGrades to server', e);
          setSaveStatus('error');
        }
        addSystemLog(`Limpieza de refuerzo completada`, `Se eliminaron notas auto-asignadas para alumnos 6, 9, 14, 15, 20 y 34 en base de datos.`, 'info');
      }

      localStorage.setItem('sga_reinforcement_cleanup_done_v2', 'true');
      return cleanedList;
    } catch (err) {
      console.error('Error running one-time reinforcement cleanup:', err);
      localStorage.setItem('sga_reinforcement_cleanup_done_v2', 'true');
      return reinforcementGradesList;
    }
  };

  const recalculateAllGrades = (evaluationsList, gradesList, reinforcementGradesList, currentGradingScale) => {
    const getLegacyExamScore = (selections) => {
      if (!selections) return 0;
      let score = 0;
      if (selections.q1) {
        if (selections.q1.narradora === 'magic_finger') score += 1;
        if (selections.q1.philip === '8_years') score += 1;
        if (selections.q1.william === '11_years') score += 1;
        if (selections.q1.gregg === 'hunt') score += 1;
      }
      if (selections.q2) {
        if (selections.q2.a === 'rojo') score += 1;
        if (selections.q2.b === 'escopeta') score += 1;
        if (selections.q2.c === 'bosque') score += 1;
        if (selections.q2.d === 'cervatillo') score += 1;
      }
      if (selections.q3) {
        if (selections.q3.evA === '4') score += 1;
        if (selections.q3.evB === '3') score += 1;
        if (selections.q3.evC === '1') score += 1;
        if (selections.q3.evD === '2') score += 1;
      }
      if (selections.q4) {
        if (selections.q4.cazar === 'no_le_gusta') score += 1;
        if (selections.q4.proteger === 'le_gusta') score += 1;
        if (selections.q4.burlarse === 'no_le_gusta') score += 1;
        if (selections.q4.convencer === 'le_gusta') score += 1;
      }
      if (selections.q5 === 'enfado') {
        score += 4;
      }
      return score;
    };

    const evalsMap = {};
    (evaluationsList || []).forEach(ev => {
      if (ev && ev.id) evalsMap[ev.id] = ev;
    });

    let gradesUpdated = false;
    const updatedGrades = (gradesList || []).map(g => {
      if (!g || !g.details) return g;
      const evaluationId = g.evaluationId;
      const instrument = g.instrument;
      const scoreBefore = g.score;
      const ev = evalsMap[evaluationId];

      let ratio = null;

      if (instrument === 'Examen') {
        const examSelections = g.details.examSelections;
        if (examSelections) {
          if (ev && ev.instrumentConfig && Array.isArray(ev.instrumentConfig.questions) && ev.instrumentConfig.questions.length > 0) {
            // Dynamic Exam
            const questions = ev.instrumentConfig.questions;
            let obtainedPoints = 0;
            let totalMaxPoints = 0;
            questions.forEach(q => {
              const pts = parseFloat(q.points) || 0;
              totalMaxPoints += pts;
              const qId = q.id;
              const qType = q.type;

              if (qType === 'choice') {
                if (examSelections[qId] === q.correctValue) {
                  obtainedPoints += pts;
                }
              } else if (qType === 'matching') {
                const subQs = q.subQuestions || [];
                const subQPts = subQs.length > 0 ? (pts / subQs.length) : 0;
                const qSelections = examSelections[qId] || {};
                subQs.forEach(subQ => {
                  if (qSelections[subQ.id] === subQ.correctValue) {
                    obtainedPoints += subQPts;
                  }
                });
              } else { // direct
                if (examSelections[qId] === true) {
                  obtainedPoints += pts;
                }
              }
            });
            ratio = totalMaxPoints > 0 ? (obtainedPoints / totalMaxPoints) : 0;
          } else {
            // Fallback legacy exam
            const legacyScore = getLegacyExamScore(examSelections);
            ratio = legacyScore / 20;
          }
        }
      } else if (instrument === 'Lista de Cotejo') {
        const checklistSelections = g.details.checklistSelections;
        if (checklistSelections) {
          if (ev && ev.instrumentConfig && Array.isArray(ev.instrumentConfig.items) && ev.instrumentConfig.items.length > 0) {
            const items = ev.instrumentConfig.items;
            const yesCount = items.reduce((sum, item) => sum + (checklistSelections[item.id] === true ? 1 : 0), 0);
            ratio = yesCount / items.length;
          }
        }
      }

      if (ratio !== null) {
        let newScore = null;
        if (currentGradingScale === 'literal') {
          if (ratio >= 0.75) {
            newScore = 'A';
          } else if (ratio >= 0.40) {
            newScore = 'B';
          } else {
            newScore = 'C';
          }
        } else {
          const scaleVal = currentGradingScale === '20' ? 20 : 10;
          newScore = parseFloat((ratio * scaleVal).toFixed(1));
        }

        if (newScore !== null && String(newScore) !== String(scoreBefore)) {
          gradesUpdated = true;
          return {
            ...g,
            score: newScore,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return g;
    });

    let reinfUpdated = false;
    const updatedReinfGrades = (reinforcementGradesList || []).map(g => {
      if (!g || !g.details) return g;
      const evaluationId = g.evaluationId;
      const ev = evalsMap[evaluationId];
      const instrument = ev ? ev.type : null;
      const scoreBefore = g.score;

      let ratio = null;

      if (instrument === 'Examen') {
        const examSelections = g.details.examSelections;
        if (examSelections) {
          if (ev && ev.instrumentConfig && Array.isArray(ev.instrumentConfig.questions) && ev.instrumentConfig.questions.length > 0) {
            // Dynamic Exam
            const questions = ev.instrumentConfig.questions;
            let obtainedPoints = 0;
            let totalMaxPoints = 0;
            questions.forEach(q => {
              const pts = parseFloat(q.points) || 0;
              totalMaxPoints += pts;
              const qId = q.id;
              const qType = q.type;

              if (qType === 'choice') {
                if (examSelections[qId] === q.correctValue) {
                  obtainedPoints += pts;
                }
              } else if (qType === 'matching') {
                const subQs = q.subQuestions || [];
                const subQPts = subQs.length > 0 ? (pts / subQs.length) : 0;
                const qSelections = examSelections[qId] || {};
                subQs.forEach(subQ => {
                  if (qSelections[subQ.id] === subQ.correctValue) {
                    obtainedPoints += subQPts;
                  }
                });
              } else { // direct
                if (examSelections[qId] === true) {
                  obtainedPoints += pts;
                }
              }
            });
            ratio = totalMaxPoints > 0 ? (obtainedPoints / totalMaxPoints) : 0;
          } else {
            // Fallback legacy exam
            const legacyScore = getLegacyExamScore(examSelections);
            ratio = legacyScore / 20;
          }
        }
      } else if (instrument === 'Lista de Cotejo') {
        const checklistSelections = g.details.checklistSelections;
        if (checklistSelections) {
          if (ev && ev.instrumentConfig && Array.isArray(ev.instrumentConfig.items) && ev.instrumentConfig.items.length > 0) {
            const items = ev.instrumentConfig.items;
            const yesCount = items.reduce((sum, item) => sum + (checklistSelections[item.id] === true ? 1 : 0), 0);
            ratio = yesCount / items.length;
          }
        }
      }

      if (ratio !== null) {
        let newScore = null;
        if (currentGradingScale === 'literal') {
          if (ratio >= 0.75) {
            newScore = 'A';
          } else if (ratio >= 0.40) {
            newScore = 'B';
          } else {
            newScore = 'C';
          }
        } else {
          const scaleVal = currentGradingScale === '20' ? 20 : 10;
          newScore = parseFloat((ratio * scaleVal).toFixed(1));
        }

        if (newScore !== null && String(newScore) !== String(scoreBefore)) {
          reinfUpdated = true;
          return {
            ...g,
            score: newScore,
            updatedAt: new Date().toISOString()
          };
        }
      }
      return g;
    });

    return {
      grades: updatedGrades,
      gradesUpdated,
      reinforcementGrades: updatedReinfGrades,
      reinfUpdated
    };
  };

  // Initialize DB from central server or fallback to localStorage
  useEffect(() => {
    // Auto-migrate old institution name in localStorage if it contains SGA
    try {
      const storedInst = localStorage.getItem('sga_institutionName');
      if (storedInst && (storedInst.includes('SGA') || storedInst.includes('Colegio de Alto Rendimiento SGA'))) {
        localStorage.setItem('sga_institutionName', JSON.stringify('Colegio de Alto Rendimiento SISGESMAFI'));
      }
    } catch (e) {}

    const loadCollection = (key, fallback) => {
      const stored = localStorage.getItem(`sga_${key}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed !== null && parsed !== undefined) {
            return parsed;
          }
        } catch (e) {
          console.error(`Failed to parse localStorage key sga_${key}`, e);
        }
      }
      localStorage.setItem(`sga_${key}`, JSON.stringify(fallback));
      return fallback;
    };

    const fetchDb = async () => {
      let loadedEvaluations = [];
      let loadedGrades = [];
      let loadedReinforcementGrades = [];
      let loadedGradingScale = '10';
      let isOnline = false;
      let syncFailed = false;

      setSaveStatus('saving');

      try {
        const response = await axios.get('/api/db/load');
        const db = response.data;
        isOnline = true;
        
        // Helper to sync local data up to server using 3-way merge
        const syncField = async (key, dbValue, setter, defaultValue = []) => {
          let finalDbValue = dbValue;
          if (key === 'students' && dbValue) {
            finalDbValue = cleanStudentAvatars(dbValue);
          }
          const stored = localStorage.getItem(`sga_${key}`);
          let localValue = defaultValue;
          if (stored) {
            try {
              localValue = JSON.parse(stored);
            } catch (e) {}
          }
          if (key === 'students' && localValue) {
            localValue = cleanStudentAvatars(localValue);
          }

          const { merged, hasChanges } = mergeCollections(key, localValue, finalDbValue);

          setter(merged);
          localStorage.setItem(`sga_${key}`, JSON.stringify(merged));

          if (hasChanges) {
            try {
              await axios.post('/api/db/save', {
                collectionName: key,
                data: merged
              });
              localStorage.setItem(`sga_sync_snapshot_${key}`, JSON.stringify(merged));
            } catch (err) {
              console.warn(`Failed to push merged ${key} to server`, err);
              syncFailed = true;
            }
          } else {
            localStorage.setItem(`sga_sync_snapshot_${key}`, JSON.stringify(merged));
          }

          return merged;
        };

        await syncField('students', db.students, setStudents);
        await syncField('teachers', db.teachers, setTeachers);
        await syncField('courses', db.courses, setCourses);
        loadedGrades = await syncField('grades', db.grades, setGradesSafe);
        await syncField('attendance', db.attendance, setAttendance);
        await syncField('conduct', db.conduct, setConduct);
        await syncField('resources', db.resources, setResources);
        await syncField('library', db.library, setLibrary);
        loadedEvaluations = await syncField('evaluations', db.evaluations, setEvaluations, []);
        await syncField('notifications', db.notifications, setNotifications, []);
        await syncField('customGroups', db.customGroups, setCustomGroups, []);
        await syncField('groupAttendance', db.groupAttendance, setGroupAttendance, []);
        await syncField('groupGrades', db.groupGrades, setGroupGrades, []);
        
        // Cargar y limpiar automáticamente notas de refuerzo vacías
        let serverReinforcementGrades = db.reinforcementGrades || [];
        const storedReinf = localStorage.getItem('sga_reinforcementGrades');
        if (!db.reinforcementGrades && storedReinf) {
          try { serverReinforcementGrades = JSON.parse(storedReinf); } catch (e) {}
        }
        const cleanedReinfGrades = (serverReinforcementGrades || [])
          .filter(Boolean)
          .filter(g => g.score !== undefined && g.score !== null && g.score !== '' && g.score !== '-');
        
        const finalReinfGrades = await runOneTimeReinforcementCleanup(db.students || [], cleanedReinfGrades);
        
        loadedReinforcementGrades = await syncField('reinforcementGrades', finalReinfGrades, setReinforcementGradesSafe, []);
        
        // Si la lista limpia es menor, guardarla en el servidor/local storage
        if (serverReinforcementGrades.length !== finalReinfGrades.length) {
          axios.post('/api/db/save', {
            collectionName: 'reinforcementGrades',
            data: finalReinfGrades
          }).then(() => {
            localStorage.setItem('sga_sync_snapshot_reinforcementGrades', JSON.stringify(finalReinfGrades));
          }).catch(e => console.warn('Failed to clean reinforcementGrades on server', e));
          localStorage.setItem('sga_reinforcementGrades', JSON.stringify(finalReinfGrades));
        }

        // Sync Configuration values
        const syncSingleValue = async (key, dbValue, setter, defaultValue) => {
          const stored = localStorage.getItem(`sga_${key}`);
          let localValue = defaultValue;
          if (stored) {
            try { localValue = JSON.parse(stored); } catch (e) {}
          }

          if (dbValue !== undefined && dbValue !== null) {
            setter(dbValue);
            localStorage.setItem(`sga_${key}`, JSON.stringify(dbValue));
            return dbValue;
          } else if (localValue !== undefined && localValue !== null) {
            setter(localValue);
            try {
              await axios.post('/api/db/save', { collectionName: key, data: localValue });
            } catch(e) {
              syncFailed = true;
            }
            return localValue;
          } else {
            setter(defaultValue);
            localStorage.setItem(`sga_${key}`, JSON.stringify(defaultValue));
            return defaultValue;
          }
        };

        const syncedAdmin = await syncSingleValue('adminProfile', db.adminProfile, setAdminProfile, {
          id: "admin_1",
          name: "Administrador Central",
          email: "admin@sga.edu",
          phone: "+51 987 654 321",
          role: "Administrador General",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        });
        const storedSession = localStorage.getItem('sga_session');
        if (storedSession) {
          try {
            const { role, userId } = JSON.parse(storedSession);
            const user = resolveUser(role, userId, db.students, db.teachers, syncedAdmin);
            if (user) {
              setCurrentUser(user);
              setCurrentRole(role);
            } else {
              localStorage.removeItem('sga_session');
              setCurrentUser(null);
              setCurrentRole(null);
            }
          } catch (e) {
            setCurrentUser(null);
            setCurrentRole(null);
          }
        } else {
          setCurrentUser(null);
          setCurrentRole(null);
        }

        await syncSingleValue('institutionName', db.institutionName, setInstitutionName, 'Colegio de Alto Rendimiento SISGESMAFI');
        loadedGradingScale = await syncSingleValue('gradingScale', db.gradingScale, setGradingScale, '10');
        
        if (db.passingGrade !== undefined && db.passingGrade !== null) {
          setPassingGrade(db.passingGrade);
          localStorage.setItem('sga_passingGrade', JSON.stringify(db.passingGrade));
        } else {
          const storedPassing = localStorage.getItem('sga_passingGrade');
          if (storedPassing) {
            try { setPassingGrade(JSON.parse(storedPassing)); } catch (e) {}
          } else {
            setPassingGrade(6.0);
            localStorage.setItem('sga_passingGrade', JSON.stringify(6.0));
          }
        }

        await syncSingleValue('activePeriods', db.activePeriods, setActivePeriods, {
          bimesters: { '1': true, '2': true, '3': true, '4': true },
          units: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true }
        });

        setSystemLogs(db.systemLogs || []);
        setDbConnection('connected');
        setSaveStatus(syncFailed ? 'error' : 'saved');
      } catch (error) {
        console.warn('Failed to load database from server, falling back to localStorage:', error);
        setDbConnection('local_fallback');
        setSaveStatus('saved');
        isOnline = false;
        
        const localStudents = cleanStudentAvatars(loadCollection('students', initialStudents));
        setStudents(localStudents);
        setTeachers(loadCollection('teachers', initialTeachers));
        setCourses(loadCollection('courses', initialCourses));
        
        loadedGrades = loadCollection('grades', initialGrades);
        setGradesSafe(loadedGrades);
        
        setAttendance(loadCollection('attendance', initialAttendance));
        setConduct(loadCollection('conduct', initialConduct));
        setResources(loadCollection('resources', initialResources));
        setLibrary(loadCollection('library', initialLibrary));
        
        loadedEvaluations = loadCollection('evaluations', []);
        setEvaluations(loadedEvaluations);
        
        setCustomGroups(loadCollection('customGroups', []));
        setGroupAttendance(loadCollection('groupAttendance', []));
        setGroupGrades(loadCollection('groupGrades', []));
        
        const localReinf = loadCollection('reinforcementGrades', []);
        const cleanedLocalReinf = (localReinf || [])
          .filter(Boolean)
          .filter(g => g.score !== undefined && g.score !== null && g.score !== '' && g.score !== '-');
        
        const finalLocalReinf = await runOneTimeReinforcementCleanup(localStudents, cleanedLocalReinf);
        
        if (finalLocalReinf.length !== (localReinf || []).length) {
          localStorage.setItem('sga_reinforcementGrades', JSON.stringify(finalLocalReinf));
        }
        loadedReinforcementGrades = finalLocalReinf;
        setReinforcementGradesSafe(loadedReinforcementGrades);
        
        loadedGradingScale = loadCollection('gradingScale', '10');
        setGradingScale(loadedGradingScale);
        setPassingGrade(loadCollection('passingGrade', 6.0));
        setInstitutionName(loadCollection('institutionName', 'Colegio de Alto Rendimiento SISGESMAFI'));
        setActivePeriods(loadCollection('activePeriods', {
          bimesters: { '1': true, '2': true, '3': true, '4': true },
          units: { '0': true, '1': true, '2': true, '3': true, '4': true, '5': true, '6': true, '7': true }
        }));

        const savedAdmin = loadCollection('adminProfile', {
          id: "admin_1",
          name: "Administrador Central",
          email: "admin@sga.edu",
          phone: "+51 987 654 321",
          role: "Administrador General",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        });
        setAdminProfile(savedAdmin);
        const storedSession = localStorage.getItem('sga_session');
        if (storedSession) {
          try {
            const { role, userId } = JSON.parse(storedSession);
            const cachedStudents = JSON.parse(localStorage.getItem('sga_students') || '[]');
            const cachedTeachers = JSON.parse(localStorage.getItem('sga_teachers') || '[]');
            const user = resolveUser(role, userId, cachedStudents, cachedTeachers, savedAdmin);
            if (user) {
              setCurrentUser(user);
              setCurrentRole(role);
            } else {
              localStorage.removeItem('sga_session');
              setCurrentUser(null);
              setCurrentRole(null);
            }
          } catch (e) {
            setCurrentUser(null);
            setCurrentRole(null);
          }
        } else {
          setCurrentUser(null);
          setCurrentRole(null);
        }

        const defaultNotices = [
          { id: "not_1", title: "Reunión General de Padres", content: "Estimados padres, les recordamos la reunión bimestral este viernes 12 a las 18:00 hrs en el auditorio principal.", date: "2026-06-05" },
          { id: "not_2", title: "Mantenimiento del Servidor", content: "El portal estará en mantenimiento el domingo 14 de 02:00 a 04:00 AM.", date: "2026-06-06" }
        ];
        setNotifications(loadCollection('notifications', defaultNotices));

        const initialLogs = [
          { id: "log_1", timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'info', message: 'Sistema iniciado en modo local (Servidor no disponible).', details: 'Ediciones se guardarán en localStorage de este navegador.' }
        ];
        setSystemLogs(loadCollection('systemLogs', initialLogs));
      }

      // Run automatic recalculation on loaded data
      try {
        const recalcResult = recalculateAllGrades(
          loadedEvaluations,
          loadedGrades,
          loadedReinforcementGrades,
          loadedGradingScale
        );

        if (recalcResult.gradesUpdated) {
          setGradesSafe(recalcResult.grades);
          localStorage.setItem('sga_grades', JSON.stringify(recalcResult.grades));
          if (isOnline) {
            try {
              await axios.post('/api/db/save', {
                collectionName: 'grades',
                data: recalcResult.grades
              });
              localStorage.setItem('sga_sync_snapshot_grades', JSON.stringify(recalcResult.grades));
              console.log('Successfully auto-recalculated and updated grades in central database.');
            } catch (e) {
              console.warn('Failed to save auto-recalculated grades to server', e);
            }
          }
        }

        if (recalcResult.reinfUpdated) {
          setReinforcementGradesSafe(recalcResult.reinforcementGrades);
          localStorage.setItem('sga_reinforcementGrades', JSON.stringify(recalcResult.reinforcementGrades));
          if (isOnline) {
            try {
              await axios.post('/api/db/save', {
                collectionName: 'reinforcementGrades',
                data: recalcResult.reinforcementGrades
              });
              localStorage.setItem('sga_sync_snapshot_reinforcementGrades', JSON.stringify(recalcResult.reinforcementGrades));
              console.log('Successfully auto-recalculated and updated reinforcementGrades in central database.');
            } catch (e) {
              console.warn('Failed to save auto-recalculated reinforcementGrades to server', e);
            }
          }
        }
      } catch (recalcErr) {
        console.error('Failed to run automatic grade recalculation on load:', recalcErr);
      }
    };

    fetchDb();
  }, []);

  // Sync state helper that writes to LocalStorage and posts to central server db.json
  const updateCollection = async (key, data, setter) => {
    setter(data);
    localStorage.setItem(`sga_${key}`, JSON.stringify(data));
    
    try {
      await axios.post('/api/db/save', {
        collectionName: key,
        data: data
      });
      // Save succeeded! Update the sync snapshot.
      localStorage.setItem(`sga_sync_snapshot_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to persist collection ${key} to central server database`, e);
      // Do not update the snapshot so we try merging it again on next sync
    }
  };

  const addSystemLog = (message, details = '', type = 'info') => {
    const newLog = {
      id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      type,
      message,
      details
    };
    const updated = [newLog, ...systemLogs].slice(0, 100); // cap logs at 100 entries
    updateCollection('systemLogs', updated, setSystemLogs);
  };

  // Auth helper
  const loginAs = (role, userId = null) => {
    setCurrentRole(role);
    addSystemLog(`Cambio de rol simulado`, `Rol activo: ${role.toUpperCase()}`, 'info');

    let userObj = null;
    let storedId = userId;

    if (role === 'admin') {
      userObj = adminProfile;
      storedId = adminProfile.id;
    } else if (role === 'director') {
      userObj = teachers.find(t => t.role === 'Director') || {
        id: "dir_1",
        name: "Dra. Milagros Valenzuela",
        email: "directora@sga.edu",
        phone: "+51 999 888 111",
        role: "Directora General",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"
      };
      storedId = userObj.id;
    } else if (role === 'subdirector_acad') {
      userObj = teachers.find(t => t.role === 'Subdirector Académico') || {
        id: "subdir_1",
        name: "Lic. Roberto Chang",
        email: "subdirector.acad@sga.edu",
        phone: "+51 999 888 222",
        role: "Subdirector Académico",
        avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"
      };
      storedId = userObj.id;
    } else if (role === 'subdirector_admin') {
      userObj = teachers.find(t => t.role === 'Subdirector Administrativo') || {
        id: "subdir_2",
        name: "Lic. Patricia Soto",
        email: "subdirector.admin@sga.edu",
        phone: "+51 999 888 333",
        role: "Subdirectora Administrativa",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150"
      };
      storedId = userObj.id;
    } else if (role === 'teacher') {
      const matched = teachers.find(t => t.id === userId) || teachers[0];
      userObj = matched;
      storedId = matched ? matched.id : null;
    } else if (role === 'student') {
      const matched = students.find(s => s.id === userId) || students[0];
      userObj = matched;
      storedId = matched ? matched.id : null;
    } else if (role === 'parent') {
      const child = students.find(s => s.id === userId) || students[0];
      userObj = {
        id: `prt_${child.id}`,
        name: child.parentName,
        email: child.parentEmail,
        phone: child.parentPhone,
        childId: child.id
      };
      storedId = child.id;
    }

    setCurrentUser(userObj);
    if (role && storedId) {
      localStorage.setItem('sga_session', JSON.stringify({ role, userId: storedId }));
    } else {
      localStorage.removeItem('sga_session');
    }
  };

  // Credentials login helper
  const loginWithCredentials = (username, password) => {
    // 1. Check direct admin creds
    if (username === 'admin' && password === 'admin') {
      setCurrentRole('admin');
      setCurrentUser(adminProfile);
      localStorage.setItem('sga_session', JSON.stringify({ role: 'admin', userId: adminProfile.id }));
      addSystemLog('Sesión iniciada', 'Administrador Central con credenciales directas.', 'success');
      return { success: true, role: 'admin' };
    }

    // Check if school records are loaded (prevent fake credential error on connection issues)
    if ((!teachers || teachers.length === 0) && (!students || students.length === 0)) {
      return { 
        success: false, 
        message: 'Error de servidor: No se han podido cargar los datos de la institución escolar. Por favor, compruebe que su frontend (Static Site) en Render tiene la variable de entorno VITE_API_URL apuntando a la dirección correcta de su backend (Web Service).' 
      };
    }

    // 2. Check teachers/staff
    const teacher = teachers.find(t => t.dni === username || t.email === username);
    if (teacher && (teacher.dni === password || password === 'admin')) {
      let mappedRole = 'teacher';
      if (teacher.role === 'Director') mappedRole = 'director';
      else if (teacher.role === 'Subdirector Académico') mappedRole = 'subdirector_acad';
      else if (teacher.role === 'Subdirector Administrativo') mappedRole = 'subdirector_admin';
      else if (teacher.role === 'Administrador') mappedRole = 'admin';

      setCurrentRole(mappedRole);
      setCurrentUser(teacher);
      localStorage.setItem('sga_session', JSON.stringify({ role: mappedRole, userId: teacher.id }));
      addSystemLog('Sesión iniciada', `${teacher.role}: ${teacher.name}`, 'success');
      return { success: true, role: mappedRole };
    }

    // 3. Check students
    const student = students.find(s => s.dni === username || s.email === username);
    if (student && (student.dni === password || password === 'admin')) {
      setCurrentRole('student');
      setCurrentUser(student);
      localStorage.setItem('sga_session', JSON.stringify({ role: 'student', userId: student.id }));
      addSystemLog('Sesión iniciada', `Estudiante: ${student.name}`, 'success');
      return { success: true, role: 'student' };
    }

    // 4. Check parents (username like p_STUDENT_DNI)
    if (username.startsWith('p_')) {
      const childDni = username.substring(2);
      const child = students.find(s => s.dni === childDni);
      if (child && (child.dni === password || password === 'admin')) {
        const parentUser = {
          id: `prt_${child.id}`,
          name: child.parentName || 'Apoderado',
          email: child.parentEmail || '',
          phone: child.parentPhone || '',
          childId: child.id
        };
        setCurrentRole('parent');
        setCurrentUser(parentUser);
        localStorage.setItem('sga_session', JSON.stringify({ role: 'parent', userId: child.id }));
        addSystemLog('Sesión iniciada', `Apoderado de: ${child.name}`, 'success');
        return { success: true, role: 'parent' };
      }
    }

    return { success: false, message: 'DNI o contraseña incorrectos.' };
  };

  // Logout helper
  const logout = () => {
    setCurrentRole(null);
    setCurrentUser(null);
    localStorage.removeItem('sga_session');
    addSystemLog('Sesión cerrada', 'Usuario cerró sesión de manera explícita.', 'info');
  };

  // Update Admin Profile & Settings
  const updateAdminConfig = (config) => {
    if (config.name || config.email || config.phone) {
      const updatedUser = { ...adminProfile, ...config };
      updateCollection('adminProfile', updatedUser, setAdminProfile);
      if (currentRole === 'admin') {
        setCurrentUser(updatedUser);
      }
      addSystemLog('Configuración de cuenta actualizada', 'Campos de perfil del administrador editados.', 'success');
    }
    
    if (config.institutionName) {
      updateCollection('institutionName', config.institutionName, setInstitutionName);
      addSystemLog('Configuración del Centro Escolar actualizada', `Nombre de institución cambiado a: ${config.institutionName}`, 'success');
    }

    if (config.gradingScale) {
      updateCollection('gradingScale', config.gradingScale, setGradingScale);
      let passGrade = 6.0;
      if (config.gradingScale === '20') passGrade = 11.0;
      else if (config.gradingScale === 'literal') passGrade = 'A';
      updateCollection('passingGrade', passGrade, setPassingGrade);
      addSystemLog('Escala de Calificación actualizada', `Escala: ${config.gradingScale === 'literal' ? 'Literal (AD, A, B, C)' : '0-' + config.gradingScale}. Nota mínima de aprobación: ${passGrade}`, 'success');
    }
  };

  // CRUD for Students
  const addStudent = (student) => {
    const isMale = student.gender === 'Masculino';
    const newStudent = {
      id: student.dni ? `std_${student.dni}` : `std_${Date.now()}`,
      avatar: isMale ? '/avatar_male.webp' : '/avatar_female.webp',
      ...student,
      updatedAt: new Date().toISOString()
    };
    const updated = cleanStudentAvatars([...students, newStudent]);
    updateCollection('students', updated, setStudents);
    addSystemLog(`Estudiante registrado`, `Estudiante: ${student.name}. DNI: ${student.dni}`, 'success');
    return newStudent;
  };

  const updateStudent = (id, updatedData) => {
    const updated = students.map(s => s.id === id ? { ...s, ...updatedData, updatedAt: new Date().toISOString() } : s);
    updateCollection('students', updated, setStudents);
    const target = students.find(s => s.id === id);
    addSystemLog(`Datos de estudiante actualizados`, `Estudiante: ${target?.name}`, 'info');
  };

  const deleteStudent = (id) => {
    const target = students.find(s => s.id === id);
    const updated = students.filter(s => s.id !== id);
    updateCollection('students', updated, setStudents);
    addSystemLog(`Estudiante eliminado`, `Estudiante: ${target?.name}. DNI: ${target?.dni}`, 'warning');
  };

  // CRUD for Teachers
  const addTeacher = (teacher) => {
    const newTeacher = {
      id: `tch_${Date.now()}`,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150`,
      courses: [],
      ...teacher,
      updatedAt: new Date().toISOString()
    };
    const updated = [...teachers, newTeacher];
    updateCollection('teachers', updated, setTeachers);
    addSystemLog(`Docente registrado`, `Docente: ${teacher.name}. Especialidad: ${teacher.specialty}`, 'success');
    return newTeacher;
  };

  const updateTeacher = (id, updatedData) => {
    const updated = teachers.map(t => t.id === id ? { ...t, ...updatedData, updatedAt: new Date().toISOString() } : t);
    updateCollection('teachers', updated, setTeachers);
    const target = teachers.find(t => t.id === id);
    addSystemLog(`Ficha de docente actualizada`, `Docente: ${target?.name}`, 'info');
  };

  const deleteTeacher = (id) => {
    const target = teachers.find(t => t.id === id);
    const updated = teachers.filter(t => t.id !== id);
    updateCollection('teachers', updated, setTeachers);
    addSystemLog(`Personal/Docente eliminado`, `Nombre: ${target?.name}. Cargo: ${target?.role}`, 'warning');
  };

  // CRUD for Courses
  const addCourse = (course) => {
    const newCourse = {
      id: `crs_${Date.now()}`,
      competencies: [],
      schedule: [],
      ...course,
      updatedAt: new Date().toISOString()
    };
    const updated = [...courses, newCourse];
    updateCollection('courses', updated, setCourses);
    addSystemLog(`Materia curricular creada`, `Curso: ${course.name}. Grado: ${course.gradeLevel}`, 'success');
    return newCourse;
  };

  const updateCourse = (id, updatedData) => {
    const updated = courses.map(c => c.id === id ? { ...c, ...updatedData, updatedAt: new Date().toISOString() } : c);
    updateCollection('courses', updated, setCourses);
    const target = courses.find(c => c.id === id);
    addSystemLog(`Malla curricular de curso actualizada`, `Curso: ${target?.name}`, 'info');
  };

  const deleteCourse = (id) => {
    const target = courses.find(c => c.id === id);
    const updated = courses.filter(c => c.id !== id);
    updateCollection('courses', updated, setCourses);
    addSystemLog(`Curso eliminado`, `Curso: ${target?.name}. Nivel: ${target?.gradeLevel}`, 'warning');
  };

  // CRUD for Evaluations
  const saveEvaluation = (evaluation) => {
    const existingIndex = evaluations.findIndex(e => e.id === evaluation.id);
    let updated;
    const nowIso = new Date().toISOString();
    if (existingIndex > -1) {
      updated = evaluations.map(e => e.id === evaluation.id ? { ...evaluation, updatedAt: nowIso } : e);
    } else {
      updated = [...evaluations, { id: `eval_${Date.now()}_${Math.floor(Math.random() * 1000)}`, ...evaluation, updatedAt: nowIso }];
    }
    updateCollection('evaluations', updated, setEvaluations);
    addSystemLog(`Evaluación guardada/actualizada`, `Nombre: ${evaluation.name}`, 'success');
  };

  const deleteEvaluation = (id) => {
    const updated = evaluations.filter(e => e.id !== id);
    updateCollection('evaluations', updated, setEvaluations);
    addSystemLog(`Evaluación eliminada`, `ID: ${id}`, 'warning');
  };

  const saveActivePeriods = (newActivePeriods) => {
    setActivePeriods(newActivePeriods);
    updateCollection('activePeriods', newActivePeriods, setActivePeriods);
    addSystemLog('Configuración de bimestres y unidades actualizada', '', 'success');
  };

  const copyEvaluation = (
    sourceEvaluationId,
    targetCourseId,
    targetCompetenceId,
    targetCapacityId,
    targetBimester,
    targetUnit,
    copyGradesOption,
    sourceGrade,
    sourceSection,
    targetGrade,
    targetSection
  ) => {
    const sourceEval = evaluations.find(e => e.id === sourceEvaluationId);
    if (!sourceEval) {
      addSystemLog('Error al copiar evaluación', `No se encontró ID: ${sourceEvaluationId}`, 'error');
      return false;
    }

    const newEvalId = `eval_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newEval = {
      ...sourceEval,
      id: newEvalId,
      courseId: targetCourseId,
      competenceId: targetCompetenceId,
      capacityId: targetCapacityId || null,
      bimester: targetBimester,
      unit: targetUnit
    };

    const updatedEvals = [...evaluations, newEval];
    updateCollection('evaluations', updatedEvals, setEvaluations);

    // Only allow copying grades if the source and target grade & section are identical
    const sameClass = 
      (sourceGrade || '').trim().toLowerCase() === (targetGrade || '').trim().toLowerCase() &&
      (sourceSection || '').trim().toLowerCase() === (targetSection || '').trim().toLowerCase();

    if (copyGradesOption && sameClass) {
      if (sourceEval.isReinforcement) {
        const currentReinf = reinforcementGradesRef.current;
        const sourceReinforcementGrades = currentReinf.filter(g => g.evaluationId === sourceEvaluationId);
        const newReinforcementGradesToInsert = [];

        sourceReinforcementGrades.forEach(g => {
          const newGradeId = `rgrd_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
          newReinforcementGradesToInsert.push({
            id: newGradeId,
            studentId: g.studentId,
            courseId: targetCourseId,
            competenceId: targetCompetenceId,
            evaluationId: newEvalId,
            bimester: targetBimester,
            score: g.score,
            teacherId: g.teacherId || 'admin_1',
            topic: g.topic || '',
            remarks: g.remarks || '',
            details: g.details ? JSON.parse(JSON.stringify(g.details)) : null,
            updatedAt: new Date().toISOString()
          });
        });

        if (newReinforcementGradesToInsert.length > 0) {
          updateCollection('reinforcementGrades', [...currentReinf, ...newReinforcementGradesToInsert], setReinforcementGradesSafe);
        }
      } else {
        const currentGrades = gradesRef.current;
        const sourceGrades = currentGrades.filter(g => g.evaluationId === sourceEvaluationId);
        const newGradesToInsert = [];

        sourceGrades.forEach(g => {
          const newGradeId = `grd_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
          newGradesToInsert.push({
            id: newGradeId,
            studentId: g.studentId,
            courseId: targetCourseId,
            competenceId: targetCompetenceId,
            evaluationId: newEvalId,
            instrument: g.instrument || sourceEval.type,
            score: g.score,
            details: g.details ? JSON.parse(JSON.stringify(g.details)) : undefined,
            teacherId: g.teacherId || 'admin_1',
            updatedAt: new Date().toISOString(),
            bimester: targetBimester,
            unit: targetUnit
          });
        });

        if (newGradesToInsert.length > 0) {
          updateCollection('grades', [...currentGrades, ...newGradesToInsert], setGradesSafe);
        }
      }
    }

    addSystemLog(`Instrumento copiado`, `Desde ID: ${sourceEvaluationId} hacia Curso ID: ${targetCourseId}`, 'success');
    return true;
  };

  // Safe Concurrency Grading Engine
  // IMPORTANT: Uses gradesRef.current (not the `grades` state) to always read
  // the latest list — prevents stale-closure race conditions when many grades
  // are saved in rapid succession (e.g. importing 500 records).
  const saveGrade = (gradePayload) => {
    const { studentId, courseId, competenceId, evaluationId, instrument, score, teacherId, details } = gradePayload;
    const bimester = gradePayload.bimester || "1";
    const unit = gradePayload.unit !== undefined && gradePayload.unit !== null ? String(gradePayload.unit) : "0";

    // Always read from ref to get the freshest list (avoids stale closure)
    const currentGrades = gradesRef.current;

    // Check if there is an existing grade entry
    const existingIndex = currentGrades.findIndex(g => {
      if (evaluationId) {
        return g.studentId === studentId && g.evaluationId === evaluationId;
      }
      return g.studentId === studentId &&
        g.courseId === courseId &&
        g.competenceId === competenceId &&
        (g.bimester || "1") === bimester &&
        (g.unit !== undefined && g.unit !== null ? String(g.unit) : "0") === unit;
    });

    const studentObj = students.find(s => s.id === studentId);
    const courseObj = courses.find(c => c.id === courseId);

    const isEmptyScore = score === undefined || score === null || score === '' || score === '-' || Number.isNaN(score);

    if (isEmptyScore) {
      if (existingIndex > -1) {
        const updatedGrades = currentGrades.filter((_, idx) => idx !== existingIndex);
        updateCollection('grades', updatedGrades, setGradesSafe);
        addSystemLog(`Nota eliminada (vaciada)`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}. (Bimestre ${bimester}, Unidad ${unit})`, 'info');
      }
      return true;
    }

    const nowIso = new Date().toISOString();

    if (existingIndex > -1) {
      const existingGrade = currentGrades[existingIndex];

      // Concurrency Conflict Check
      if (gradePayload.lastKnownUpdate && existingGrade.updatedAt > gradePayload.lastKnownUpdate) {
        if (existingGrade.teacherId !== teacherId) {
          addSystemLog(
            `⚠️ Conflicto de Concurrencia Bloqueado`,
            `Colisión de escritura en curso ${courseObj?.name} para el alumno ${studentObj?.name}. Docente emisor bloqueado: ID ${teacherId}. Valor previo existente: ${existingGrade.score}.`,
            'warning'
          );
          const proceed = window.confirm(
            `⚠️ Conflicto de Concurrencia de Datos:\nEl/La docente con ID ${existingGrade.teacherId} acaba de modificar esta nota a [${existingGrade.score}].\n\n¿Deseas sobreescribirla con tu valor [${score}]?`
          );
          if (!proceed) {
            addSystemLog(`Acción de sobreescritura cancelada por usuario`, `Nota original conservada en: ${existingGrade.score}`, 'info');
            return false;
          }
        }
      }

      // Merge and update
      const updatedGrades = [...currentGrades];
      updatedGrades[existingIndex] = {
        ...existingGrade,
        instrument,
        score: ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score),
        teacherId,
        bimester,
        unit,
        evaluationId: evaluationId || null,
        details: details || null,
        updatedAt: nowIso
      };
      updateCollection('grades', updatedGrades, setGradesSafe);
      addSystemLog(`Nota de competencia actualizada`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}. Nueva nota: ${score} (Bimestre ${bimester}, Unidad ${unit})`, 'success');
    } else {
      // Add new grade entry
      const newGrade = {
        id: `grd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        studentId,
        courseId,
        competenceId,
        evaluationId: evaluationId || null,
        instrument,
        score: ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score),
        teacherId,
        bimester,
        unit,
        details: details || null,
        updatedAt: nowIso
      };
      const updatedGrades = [...currentGrades, newGrade];
      updateCollection('grades', updatedGrades, setGradesSafe);
      addSystemLog(`Nota ingresada en registro`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}. Nota: ${score} (Bimestre ${bimester}, Unidad ${unit})`, 'success');
    }
    return true;
  };

  // Batch import: saves many grades in ONE server call (avoids rate-limiting on bulk imports)
  const saveGradesBatch = (gradePayloads) => {
    if (!gradePayloads || gradePayloads.length === 0) return 0;
    const nowIso = new Date().toISOString();
    let currentGrades = [...gradesRef.current];
    let saved = 0;

    gradePayloads.forEach(gradePayload => {
      const { studentId, courseId, competenceId, evaluationId, instrument, score, teacherId, details, bimester, unit } = gradePayload;
      const bim = bimester || "1";
      const u = unit !== undefined && unit !== null ? String(unit) : "0";
      const isEmptyScore = score === undefined || score === null || score === '' || score === '-' || Number.isNaN(score);
      if (isEmptyScore) return;

      const existingIndex = currentGrades.findIndex(g => {
        if (evaluationId) return g.studentId === studentId && g.evaluationId === evaluationId;
        return g.studentId === studentId && g.courseId === courseId && g.competenceId === competenceId &&
          (g.bimester || "1") === bim && (g.unit !== undefined && g.unit !== null ? String(g.unit) : "0") === u;
      });

      const newScoreVal = ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score);

      if (existingIndex > -1) {
        currentGrades[existingIndex] = {
          ...currentGrades[existingIndex],
          instrument, score: newScoreVal, teacherId,
          bimester: bim, unit: u,
          evaluationId: evaluationId || null,
          details: details || null,
          updatedAt: nowIso
        };
      } else {
        currentGrades.push({
          id: `grd_${Date.now()}_${Math.floor(Math.random() * 100000)}_${saved}`,
          studentId, courseId, competenceId,
          evaluationId: evaluationId || null,
          instrument, score: newScoreVal, teacherId,
          bimester: bim, unit: u,
          details: details || null,
          updatedAt: nowIso
        });
      }
      saved++;
    });

    // Single updateCollection call for all grades — one server save
    updateCollection('grades', currentGrades, setGradesSafe);
    addSystemLog(`Importación masiva de notas`, `${saved} calificaciones guardadas en un solo lote.`, 'success');
    return saved;
  };

  // Attendance CRUD
  const saveAttendance = (records) => {
    let updatedAttendance = [...attendance];
    const nowIso = new Date().toISOString();
    
    records.forEach(rec => {
      const existingIndex = updatedAttendance.findIndex(a => 
        a.targetId === rec.targetId && 
        a.date === rec.date && 
        (rec.type === 'student' ? a.courseId === rec.courseId : true)
      );

      const isEmptyStatus = rec.status === undefined || rec.status === null || rec.status === '';

      if (existingIndex > -1) {
        if (isEmptyStatus) {
          updatedAttendance = updatedAttendance.filter((_, idx) => idx !== existingIndex);
        } else {
          updatedAttendance[existingIndex] = {
            ...updatedAttendance[existingIndex],
            status: rec.status,
            remarks: rec.remarks || '',
            updatedAt: nowIso
          };
        }
      } else {
        if (!isEmptyStatus) {
          updatedAttendance.push({
            id: `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            ...rec,
            remarks: rec.remarks || '',
            updatedAt: nowIso
          });
        }
      }
    });

    updateCollection('attendance', updatedAttendance, setAttendance);
    addSystemLog(`Registro de asistencia modificado`, `Total filas afectadas: ${records.length}`, 'info');
  };

  // Conduct log
  const addConductRecord = (record) => {
    const newRec = {
      id: `cnd_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      ...record,
      updatedAt: new Date().toISOString()
    };
    const updated = [...conduct, newRec];
    updateCollection('conduct', updated, setConduct);
    
    const std = students.find(s => s.id === record.studentId);
    addSystemLog(
      `Registro de conducta añadido`, 
      `Alumno: ${std?.name}. Tipo: ${record.type.toUpperCase()} (${record.points} pts). Detalle: ${record.category}`, 
      record.type === 'merit' ? 'success' : 'warning'
    );
  };

  // Resource Booking & CRUD
  const addResource = (resource) => {
    const newResource = {
      id: `rsc_${Date.now()}`,
      status: 'disponible',
      reservations: [],
      ...resource,
      updatedAt: new Date().toISOString()
    };
    const updated = [...resources, newResource];
    updateCollection('resources', updated, setResources);
    addSystemLog(`Recurso inventariado`, `Nombre: ${resource.name}. Tipo: ${resource.type}`, 'success');
    return newResource;
  };

  const updateResource = (id, updatedData) => {
    const updated = resources.map(res => res.id === id ? { ...res, ...updatedData, updatedAt: new Date().toISOString() } : res);
    updateCollection('resources', updated, setResources);
    const target = resources.find(res => res.id === id);
    addSystemLog(`Recurso actualizado`, `Nombre: ${target?.name}`, 'info');
  };

  const deleteResource = (id) => {
    const target = resources.find(res => res.id === id);
    const updated = resources.filter(res => res.id !== id);
    updateCollection('resources', updated, setResources);
    addSystemLog(`Recurso eliminado`, `Nombre: ${target?.name}`, 'warning');
  };

  const reserveResource = (resourceId, reservation) => {
    const updated = resources.map(res => {
      if (res.id === resourceId) {
        return {
          ...res,
          reservations: [
            ...res.reservations,
            { id: `res_${Date.now()}`, ...reservation }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return res;
    });
    updateCollection('resources', updated, setResources);
    
    const resName = resources.find(r => r.id === resourceId)?.name;
    addSystemLog(`Reserva de recurso registrada`, `Recurso: ${resName}. Fecha: ${reservation.date}`, 'success');
  };

  const deleteReservation = (resourceId, reservationId) => {
    const updated = resources.map(res => {
      if (res.id === resourceId) {
        return {
          ...res,
          reservations: res.reservations.filter(r => r.id !== reservationId),
          updatedAt: new Date().toISOString()
        };
      }
      return res;
    });
    updateCollection('resources', updated, setResources);
    addSystemLog(`Reserva de recurso cancelada`, `ID Reserva: ${reservationId}`, 'info');
  };

  // Library CRUD
  const addLibraryItem = (item) => {
    const newItem = {
      id: `lib_${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: "5.4 MB",
      downloadUrl: "#",
      ...item,
      updatedAt: new Date().toISOString()
    };
    const updated = [...library, newItem];
    updateCollection('library', updated, setLibrary);
    addSystemLog(`Recurso digital indexado en biblioteca`, `Título: ${item.title}. Formato: ${item.format}`, 'success');
  };

  const updateLibraryItem = (id, updatedData) => {
    const updated = library.map(item => item.id === id ? { ...item, ...updatedData, updatedAt: new Date().toISOString() } : item);
    updateCollection('library', updated, setLibrary);
    const target = library.find(item => item.id === id);
    addSystemLog(`Recurso digital actualizado`, `Título: ${target?.title}`, 'info');
  };

  const deleteLibraryItem = (id) => {
    const target = library.find(item => item.id === id);
    const updated = library.filter(item => item.id !== id);
    updateCollection('library', updated, setLibrary);
    addSystemLog(`Recurso digital eliminado`, `Título: ${target?.title}`, 'warning');
  };

  // Custom Groups CRUD & helpers
  const saveCustomGroup = (groupData) => {
    const id = groupData.id || `grp_${Date.now()}`;
    const newGroup = {
      id,
      teacherId: currentUser?.id || 'admin_1',
      ...groupData,
      updatedAt: new Date().toISOString()
    };
    
    let updated;
    const exists = customGroups.some(g => g.id === id);
    if (exists) {
      updated = customGroups.map(g => g.id === id ? newGroup : g);
      addSystemLog('Grupo Especial modificado', `Grupo: ${groupData.name}`, 'info');
    } else {
      updated = [...customGroups, newGroup];
      addSystemLog('Grupo Especial creado', `Grupo: ${groupData.name}`, 'success');
    }
    
    updateCollection('customGroups', updated, setCustomGroups);
    return newGroup;
  };

  const deleteCustomGroup = (groupId) => {
    const target = customGroups.find(g => g.id === groupId);
    const updated = customGroups.filter(g => g.id !== groupId);
    updateCollection('customGroups', updated, setCustomGroups);
    
    const updatedAttendance = groupAttendance.filter(a => a.groupId !== groupId);
    updateCollection('groupAttendance', updatedAttendance, setGroupAttendance);
    
    const updatedGrades = groupGrades.filter(g => g.groupId !== groupId);
    updateCollection('groupGrades', updatedGrades, setGroupGrades);
    
    addSystemLog('Grupo Especial eliminado', `Grupo: ${target?.name}`, 'warning');
  };

  const saveGroupAttendance = (groupId, date, records, remarks = {}) => {
    const id = `gatt_${groupId}_${date}`;
    const newRecord = {
      id,
      groupId,
      date,
      attendance: records,
      remarks,
      updatedAt: new Date().toISOString()
    };

    let updated;
    const exists = groupAttendance.some(a => a.id === id);
    if (exists) {
      updated = groupAttendance.map(a => a.id === id ? newRecord : a);
    } else {
      updated = [...groupAttendance, newRecord];
    }
    updateCollection('groupAttendance', updated, setGroupAttendance);
    addSystemLog('Asistencia de Grupo guardada', `Grupo ID: ${groupId}. Fecha: ${date}`, 'success');
  };

  const saveGroupEvaluation = (groupId, evaluationId, evalData) => {
    const id = evaluationId || `geval_${groupId}_${Date.now()}`;
    const newEval = {
      id,
      groupId,
      ...evalData,
      updatedAt: new Date().toISOString()
    };

    let updated;
    const exists = groupGrades.some(g => g.id === id);
    if (exists) {
      updated = groupGrades.map(g => g.id === id ? newEval : g);
      addSystemLog('Evaluación de Grupo modificada', `Evaluación: ${evalData.name}`, 'info');
    } else {
      updated = [...groupGrades, newEval];
      addSystemLog('Evaluación de Grupo registrada', `Evaluación: ${evalData.name}`, 'success');
    }
    updateCollection('groupGrades', updated, setGroupGrades);
  };

  const deleteGroupEvaluation = (groupId, evaluationId) => {
    const target = groupGrades.find(g => g.id === evaluationId);
    const updated = groupGrades.filter(g => g.id !== evaluationId);
    updateCollection('groupGrades', updated, setGroupGrades);
    addSystemLog('Evaluación de Grupo eliminada', `Evaluación: ${target?.name}`, 'warning');
  };

  const saveReinforcementGrade = (gradePayload) => {
    const { studentId, courseId, competenceId, evaluationId, bimester, score, teacherId, topic, remarks, details } = gradePayload;

    // Always read from ref to get the freshest list (avoids stale closure)
    const currentReinf = reinforcementGradesRef.current;

    const existingIndex = currentReinf.findIndex(g =>
      g.studentId === studentId &&
      g.courseId === courseId &&
      g.competenceId === competenceId &&
      g.evaluationId === evaluationId &&
      String(g.bimester || "1") === String(bimester || "1")
    );

    const studentObj = students.find(s => s.id === studentId);
    const courseObj = courses.find(c => c.id === courseId);

    const isEmptyScore = score === undefined || score === null || score === '' || score === '-' || Number.isNaN(score);

    if (isEmptyScore) {
      if (existingIndex > -1) {
        const updated = currentReinf.filter((_, idx) => idx !== existingIndex);
        updateCollection('reinforcementGrades', updated, setReinforcementGradesSafe);
        addSystemLog(`Nota de refuerzo eliminada (vaciada)`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}`, 'info');
      }
      return true;
    }

    const nowIso = new Date().toISOString();
    const updated = [...currentReinf];

    if (existingIndex > -1) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        score: ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score),
        teacherId,
        topic: topic || '',
        remarks: remarks || '',
        details: details || null,
        updatedAt: nowIso
      };
      addSystemLog(`Nota de refuerzo actualizada`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}. Nueva nota: ${score}`, 'success');
    } else {
      const newGrade = {
        id: `rgrd_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        studentId,
        courseId,
        competenceId,
        evaluationId: evaluationId || null,
        bimester: bimester || "1",
        score: ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score),
        teacherId,
        topic: topic || '',
        remarks: remarks || '',
        details: details || null,
        updatedAt: nowIso
      };
      updated.push(newGrade);
      addSystemLog(`Nota de refuerzo ingresada`, `Alumno: ${studentObj?.name}. Curso: ${courseObj?.name}. Nota: ${score}`, 'success');
    }

    updateCollection('reinforcementGrades', updated, setReinforcementGradesSafe);
    return true;
  };

  // Batch import for reinforcement grades — single server call
  const saveReinforcementGradesBatch = (gradePayloads) => {
    if (!gradePayloads || gradePayloads.length === 0) return 0;
    const nowIso = new Date().toISOString();
    let currentReinf = [...reinforcementGradesRef.current];
    let saved = 0;

    gradePayloads.forEach(gradePayload => {
      const { studentId, courseId, competenceId, evaluationId, bimester, score, teacherId, topic, remarks, details } = gradePayload;
      const bim = bimester || "1";
      const isEmptyScore = score === undefined || score === null || score === '' || score === '-' || Number.isNaN(score);
      if (isEmptyScore) return;

      const existingIndex = currentReinf.findIndex(g =>
        g.studentId === studentId && g.courseId === courseId &&
        g.competenceId === competenceId && g.evaluationId === evaluationId &&
        String(g.bimester || "1") === String(bim)
      );

      const newScoreVal = ['AD', 'A', 'B', 'C'].includes(score) ? score : parseFloat(score);

      if (existingIndex > -1) {
        currentReinf[existingIndex] = {
          ...currentReinf[existingIndex],
          score: newScoreVal, teacherId,
          topic: topic || '', remarks: remarks || '',
          details: details || null, updatedAt: nowIso
        };
      } else {
        currentReinf.push({
          id: `rgrd_${Date.now()}_${Math.floor(Math.random() * 100000)}_${saved}`,
          studentId, courseId, competenceId,
          evaluationId: evaluationId || null,
          bimester: bim, score: newScoreVal, teacherId,
          topic: topic || '', remarks: remarks || '',
          details: details || null, updatedAt: nowIso
        });
      }
      saved++;
    });

    updateCollection('reinforcementGrades', currentReinf, setReinforcementGradesSafe);
    addSystemLog(`Importación masiva de notas de refuerzo`, `${saved} calificaciones guardadas en un solo lote.`, 'success');
    return saved;
  };

  const setTeachersBatch = (newList) => {
    updateCollection('teachers', newList, setTeachers);
    addSystemLog('Importación masiva de docentes', `Total registros: ${newList.length}`, 'success');
  };

  const setStudentsBatch = (newList) => {
    updateCollection('students', newList, setStudents);
    addSystemLog('Importación masiva de estudiantes', `Total registros: ${newList.length}`, 'success');
  };

  const cleanCourses = (courses || []).filter(Boolean).map(c => {
    return {
      ...c,
      assignments: (c.assignments || []).filter(Boolean),
      competencies: (c.competencies || []).filter(Boolean).map(comp => {
        return {
          ...comp,
          capacities: (comp.capacities || []).filter(Boolean).map(cap => {
            return {
              ...cap,
              desempenos: (cap.desempenos || []).filter(Boolean)
            };
          })
        };
      })
    };
  });

  const cleanStudents = (students || []).filter(Boolean);
  const cleanTeachers = (teachers || []).filter(Boolean);
  const cleanGrades = (grades || []).filter(Boolean);
  const cleanEvaluations = (evaluations || []).filter(Boolean);
  const cleanReinforcementGrades = (reinforcementGrades || [])
    .filter(Boolean)
    .filter(g => g.score !== undefined && g.score !== null && g.score !== '' && g.score !== '-');
  const cleanAttendance = (attendance || []).filter(Boolean);
  const cleanConduct = (conduct || []).filter(Boolean);
  const cleanCustomGroups = (customGroups || []).filter(Boolean);

  return (
    <DatabaseContext.Provider value={{
      currentRole,
      currentUser,
      loginAs,
      loginWithCredentials,
      logout,
      
      students: cleanStudents,
      addStudent,
      updateStudent,
      deleteStudent,
      setStudents: setStudentsBatch,
      
      teachers: cleanTeachers,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      setTeachers: setTeachersBatch,
      
      courses: cleanCourses,
      addCourse,
      updateCourse,
      deleteCourse,
      
      grades: cleanGrades,
      saveGrade,
      saveGradesBatch,

      evaluations: cleanEvaluations,
      saveEvaluation,
      deleteEvaluation,
      copyEvaluation,
      activePeriods,
      saveActivePeriods,
      
      attendance: cleanAttendance,
      saveAttendance,
      
      conduct: cleanConduct,
      addConductRecord,
      
      resources,
      addResource,
      updateResource,
      deleteResource,
      reserveResource,
      deleteReservation,
      
      library,
      addLibraryItem,
      updateLibraryItem,
      deleteLibraryItem,
      
      notifications,

      // Custom Groups
      customGroups: cleanCustomGroups,
      saveCustomGroup,
      deleteCustomGroup,
      groupAttendance,
      saveGroupAttendance,
      groupGrades,
      saveGroupEvaluation,
      deleteGroupEvaluation,

      // Reinforcement Grades
      reinforcementGrades: cleanReinforcementGrades,
      saveReinforcementGrade,
      saveReinforcementGradesBatch,

      // Admin parameters
      dbConnection,
      saveStatus,
      gradingScale,
      passingGrade,
      institutionName,
      systemLogs,
      updateAdminConfig,
      addSystemLog
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};
