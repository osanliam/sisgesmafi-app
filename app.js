// Redesigned SISGESMAFI App State & Interactivity

// SVG Icons for the table subheaders
const tableHeaderIcons = {
  download: `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="grey"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
  eye: `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="grey"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
  share: `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
};

// Core Database
const studentsDatabase = {
  comunicacion: {
    bim2: [
      { name: "ALARCÓN BURGOS EUGENIO PAOLO", dni: "81200821", planner: "A", cuadro: "A", dedo: "A" },
      { name: "AMASIFUEN DÍAZ VERONICA MARISOL", dni: "81398243", planner: "A", cuadro: "B", dedo: "A" },
      { name: "BUENO CAYAO LUZBET ANALY", dni: "88662919", planner: "A", cuadro: "B", dedo: "-" },
      { name: "CARRANZA SEGOBIA ALLEN", dni: "81254001", planner: "A", cuadro: "A", dedo: "A" },
      { name: "CASTILLO TUANAMA YAJAIRA THALIA", dni: "81597326", planner: "A", cuadro: "A", dedo: "B" },
      { name: "FERNANDEZ RULIA ROLIV", dni: "81597327", planner: "A", cuadro: "B", dedo: "-" },
      { name: "AGRIED BURGOS DIKURCO", dni: "81207823", planner: "A", cuadro: "A", dedo: "B" }
    ],
    bim1: [
      { name: "ALARCÓN BURGOS EUGENIO PAOLO", dni: "81200821", planner: "B", cuadro: "A", dedo: "B" },
      { name: "AMASIFUEN DÍAZ VERONICA MARISOL", dni: "81398243", planner: "A", cuadro: "B", dedo: "B" },
      { name: "BUENO CAYAO LUZBET ANALY", dni: "88662919", planner: "B", cuadro: "C", dedo: "-" },
      { name: "CARRANZA SEGOBIA ALLEN", dni: "81254001", planner: "A", cuadro: "A", dedo: "B" },
      { name: "CASTILLO TUANAMA YAJAIRA THALIA", dni: "81597326", planner: "B", cuadro: "B", dedo: "C" },
      { name: "FERNANDEZ RULIA ROLIV", dni: "81597327", planner: "A", cuadro: "B", dedo: "C" },
      { name: "AGRIED BURGOS DIKURCO", dni: "81207823", planner: "B", cuadro: "A", dedo: "B" }
    ]
  },
  matematicas: {
    bim2: [
      { name: "ALARCÓN BURGOS EUGENIO PAOLO", dni: "81200821", planner: "B", cuadro: "B", dedo: "B" },
      { name: "AMASIFUEN DÍAZ VERONICA MARISOL", dni: "81398243", planner: "AD", cuadro: "A", dedo: "A" },
      { name: "BUENO CAYAO LUZBET ANALY", dni: "88662919", planner: "B", cuadro: "B", dedo: "-" },
      { name: "CARRANZA SEGOBIA ALLEN", dni: "81254001", planner: "A", cuadro: "A", dedo: "AD" },
      { name: "CASTILLO TUANAMA YAJAIRA THALIA", dni: "81597326", planner: "A", cuadro: "B", dedo: "B" },
      { name: "FERNANDEZ RULIA ROLIV", dni: "81597327", planner: "B", cuadro: "C", dedo: "-" },
      { name: "AGRIED BURGOS DIKURCO", dni: "81207823", planner: "A", cuadro: "A", dedo: "B" }
    ]
  }
};

// UI Elements
const tableBody = document.getElementById('tableBody');
const gradesTable = document.getElementById('gradesTable');
const tabRegistro = document.getElementById('tabRegistro');
const tabConsolidado = document.getElementById('tabConsolidado');

// Dropdowns
const headerClaseSelect = document.getElementById('headerClaseSelector');
const headerPeriodoSelect = document.getElementById('headerPeriodoSelector');
const headerUnidadSelect = document.getElementById('headerUnidadSelector');
const roleSelector = document.getElementById('roleSelector');
const teacherSelector = document.getElementById('teacherSelector');
const competenciaSelect = document.getElementById('competenciaSelect');

// Buttons
const volverBtn = document.getElementById('volverBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFileInput = document.getElementById('restoreFileInput');
const darkModeBtn = document.getElementById('darkModeBtn');
const logoutBtn = document.getElementById('logoutBtn');
const curricularBtn = document.getElementById('curricularBtn');
const addActivityBtn = document.getElementById('addActivityBtn');

// Modal Elements
const editModal = document.getElementById('editModal');
const modalStudentName = document.getElementById('modalStudentName');
const editStudentIndex = document.getElementById('editStudentIndex');
const editColumnKey = document.getElementById('editColumnKey');
const editDniInput = document.getElementById('editDniInput');
const editGradeSelect = document.getElementById('editGradeSelect');
const editGradeLabel = document.getElementById('editGradeLabel');
const notaFieldContainer = document.getElementById('notaFieldContainer');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const saveModalBtn = document.getElementById('saveModalBtn');

// App State
let currentClase = 'comunicacion';
let currentPeriodo = 'bim2';
let currentUnidad = 'u2';
let activeTab = 'registro';

// Init App
document.addEventListener('DOMContentLoaded', () => {
  renderTable();
  initEventListeners();
});

// Dynamic Avatar Generator using initials and names to create unique inline SVGs
function getAvatarUrl(name) {
  const parts = name.split(' ').filter(p => p.length > 0);
  let initials = '';
  if (parts.length >= 2) {
    initials = parts[0][0] + parts[1][0];
  } else if (parts.length === 1) {
    initials = parts[0].substring(0, 2);
  } else {
    initials = 'ES';
  }
  initials = initials.toUpperCase();

  const colors = [
    ['#ff7675', '#74b9ff'],
    ['#a29bfe', '#fd79a8'],
    ['#55efc4', '#ffeaa7'],
    ['#ffeaa7', '#ff7675'],
    ['#74b9ff', '#a29bfe'],
    ['#fd79a8', '#55efc4']
  ];
  const idx = name.length % colors.length;
  const [c1, c2] = colors[idx];
  
  const svg = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g_${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" />
        <stop offset="100%" stop-color="${c2}" />
      </linearGradient>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#g_${idx})" />
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Outfit, sans-serif" font-size="12" font-weight="bold" fill="white">${initials}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Get active students array
function getActiveStudents() {
  if (!studentsDatabase[currentClase]) {
    studentsDatabase[currentClase] = {};
  }
  if (!studentsDatabase[currentClase][currentPeriodo]) {
    studentsDatabase[currentClase][currentPeriodo] = [
      { name: "ESTUDIANTE NUEVO", dni: "00000000", planner: "-", cuadro: "-", dedo: "-" }
    ];
  }
  return studentsDatabase[currentClase][currentPeriodo];
}

// Render Excel Spreadsheet Table
function renderTable() {
  const students = getActiveStudents();
  const thead = gradesTable.querySelector('thead');
  tableBody.innerHTML = '';

  if (activeTab === 'registro') {
    // Advanced headers with badged tags and icon strips
    thead.innerHTML = `
      <tr>
        <th scope="col" style="width: 50px; text-align: center;">N°</th>
        <th scope="col" style="min-width: 250px;">ESTUDIANTE</th>
        <th scope="col" style="width: 120px;">DNI</th>
        <th scope="col" class="center">
          <div class="header-detail-container">
            <span>PLANIFICADOR PERSONAL</span>
            <span class="header-badge rubrica">RÚBRICA</span>
            <div class="header-icons-strip">
              ${tableHeaderIcons.download}
              ${tableHeaderIcons.eye}
              ${tableHeaderIcons.share}
              ${tableHeaderIcons.trash}
            </div>
          </div>
        </th>
        <th scope="col" class="center">
          <div class="header-detail-container">
            <span>CUADRO COMPARATIVO</span>
            <span class="header-badge rubrica-red">RÚBRICA</span>
            <div class="header-icons-strip">
              ${tableHeaderIcons.download}
              ${tableHeaderIcons.eye}
              ${tableHeaderIcons.share}
              ${tableHeaderIcons.trash}
            </div>
          </div>
        </th>
        <th scope="col" class="center">
          <div class="header-detail-container">
            <span>EL DEDO MÁGICO N° 1</span>
            <span class="header-badge examen">EXAMEN</span>
            <div class="header-icons-strip">
              ${tableHeaderIcons.download}
              ${tableHeaderIcons.eye}
              ${tableHeaderIcons.share}
              ${tableHeaderIcons.trash}
            </div>
          </div>
        </th>
      </tr>
    `;

    students.forEach((student, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="center" style="font-weight: 700; color: var(--text-muted);">${index + 1}</td>
        <td>
          <div class="student-cell">
            <img class="student-avatar" src="${getAvatarUrl(student.name)}" alt="Avatar">
            <span>${escapeHtml(student.name)}</span>
          </div>
        </td>
        <td style="font-family: var(--font-display); font-weight: 700; color: #475569;" class="edit-dni-trigger">${student.dni}</td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(student.planner)}" data-col="planner">${student.planner}</span></td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(student.cuadro)}" data-col="cuadro">${student.cuadro}</span></td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(student.dedo)}" data-col="dedo">${student.dedo}</span></td>
      `;

      // Set up click handlers on cells
      tr.querySelector('.edit-dni-trigger').addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(index, 'dni');
      });

      tr.querySelectorAll('.grade-capsule').forEach(capsule => {
        capsule.addEventListener('click', (e) => {
          e.stopPropagation();
          const col = capsule.getAttribute('data-col');
          openEditModal(index, col);
        });
      });

      tableBody.appendChild(tr);
    });
  } else {
    // Consolidado de Competencias View
    thead.innerHTML = `
      <tr>
        <th scope="col" style="width: 50px; text-align: center;">N°</th>
        <th scope="col" style="min-width: 250px;">ESTUDIANTE</th>
        <th scope="col" style="width: 120px;">DNI</th>
        <th scope="col" class="center">C1 (LECTURA)</th>
        <th scope="col" class="center">C2 (ESCRITURA)</th>
        <th scope="col" class="center">C3 (ORALIDAD)</th>
        <th scope="col" class="center">PROMEDIO</th>
      </tr>
    `;

    students.forEach((student, index) => {
      const c1 = student.planner;
      const c2 = student.cuadro;
      const c3 = student.dedo === '-' ? 'B' : student.dedo; // fallback for consolidation averages
      const avg = calculateAverage([c1, c2, c3]);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="center" style="font-weight: 700; color: var(--text-muted);">${index + 1}</td>
        <td>
          <div class="student-cell">
            <img class="student-avatar" src="${getAvatarUrl(student.name)}" alt="Avatar">
            <span>${escapeHtml(student.name)}</span>
          </div>
        </td>
        <td style="font-family: var(--font-display); font-weight: 700; color: #475569;">${student.dni}</td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(c1)}">${c1}</span></td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(c2)}">${c2}</span></td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(c3)}">${c3}</span></td>
        <td class="center"><span class="grade-capsule ${getCapsuleClass(avg)}" style="border: 2px solid #000;">${avg}</span></td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

// Get capsule class helper
function getCapsuleClass(val) {
  if (val === '-') return 'empty';
  return val.toLowerCase();
}

// Calculate mock averages
function calculateAverage(grades) {
  const pts = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
  let sum = 0;
  let count = 0;
  grades.forEach(g => {
    if (pts[g]) {
      sum += pts[g];
      count++;
    }
  });
  if (count === 0) return '-';
  const avg = Math.round(sum / count);
  if (avg === 4) return 'AD';
  if (avg === 3) return 'A';
  if (avg === 2) return 'B';
  return 'C';
}

// Open grade editor modal
function openEditModal(studentIndex, columnKey) {
  const student = getActiveStudents()[studentIndex];
  editStudentIndex.value = studentIndex;
  editColumnKey.value = columnKey;
  modalStudentName.textContent = `${student.name}`;

  if (columnKey === 'dni') {
    editGradeLabel.style.display = 'none';
    editGradeSelect.style.display = 'none';
    notaFieldContainer.style.display = 'flex';
    editDniInput.value = student.dni;
  } else {
    editGradeLabel.style.display = 'block';
    editGradeSelect.style.display = 'block';
    notaFieldContainer.style.display = 'none';
    
    let currentVal = student[columnKey];
    editGradeSelect.value = currentVal;
    
    let columnNameFriendly = columnKey === 'planner' ? 'Planificador Personal' : (columnKey === 'cuadro' ? 'Cuadro Comparativo' : 'El Dedo Mágico N° 1');
    editGradeLabel.textContent = `Calificación de: ${columnNameFriendly}`;
  }

  editModal.classList.add('open');
}

function closeEditModal() {
  editModal.classList.remove('open');
}

// Save modal edits
function saveChanges() {
  const index = parseInt(editStudentIndex.value);
  const col = editColumnKey.value;
  const students = getActiveStudents();

  if (!isNaN(index) && students[index]) {
    if (col === 'dni') {
      students[index].dni = editDniInput.value;
      showToast(`DNI de ${students[index].name} actualizado.`);
    } else {
      students[index][col] = editGradeSelect.value;
      showToast(`Nota guardada correctamente.`);
    }
    renderTable();
    closeEditModal();
  }
}

// Toast Notifications Helper
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '';
  if (type === 'success') {
    icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'info') {
    icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  } else {
    icon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="margin-right: 4px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  }

  toast.innerHTML = `${icon}<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Event Listeners Configuration
function initEventListeners() {
  // Sync Banner Selectors
  headerClaseSelect.addEventListener('change', (e) => {
    currentClase = e.target.value;
    renderTable();
    showToast(`Asignatura cargada: ${headerClaseSelect.options[headerClaseSelect.selectedIndex].text}`, 'info');
  });

  headerPeriodoSelect.addEventListener('change', (e) => {
    currentPeriodo = e.target.value;
    renderTable();
    showToast(`Cambiado al Bimestre: ${headerPeriodoSelect.options[headerPeriodoSelect.selectedIndex].text}`, 'info');
  });

  headerUnidadSelect.addEventListener('change', (e) => {
    currentUnidad = e.target.value;
    showToast(`Mostrando datos de la ${headerUnidadSelect.options[headerUnidadSelect.selectedIndex].text}`, 'info');
  });

  // Top Selectors Alerts
  roleSelector.addEventListener('change', () => {
    showToast(`Rol cambiado a: ${roleSelector.value.toUpperCase()}`, 'info');
  });

  teacherSelector.addEventListener('change', () => {
    showToast(`Docente seleccionado: ${teacherSelector.options[teacherSelector.selectedIndex].text}`, 'info');
  });

  competenciaSelect.addEventListener('change', () => {
    showToast(`Filtrado por competencia: ${competenciaSelect.options[competenciaSelect.selectedIndex].text}`, 'info');
    simulateDataReload();
  });

  // Volver Button
  volverBtn.addEventListener('click', () => {
    showToast("Regresando al menú principal de Gestión Excelente...", "info");
  });

  // Tabs Switch
  tabRegistro.addEventListener('click', () => {
    activeTab = 'registro';
    tabRegistro.classList.add('active');
    tabConsolidado.classList.remove('active');
    renderTable();
  });

  tabConsolidado.addEventListener('click', () => {
    activeTab = 'consolidado';
    tabConsolidado.classList.add('active');
    tabRegistro.classList.remove('active');
    renderTable();
  });

  // Action Cards Click Selection
  document.querySelectorAll('.action-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.action-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const title = card.querySelector('span').textContent;
      showToast(`Módulo activo: ${title}`, 'success');
      simulateDataReload();
    });
  });

  // Dark Mode simulated toggle
  let darkModeActive = false;
  darkModeBtn.addEventListener('click', () => {
    darkModeActive = !darkModeActive;
    if (darkModeActive) {
      document.body.style.filter = 'invert(0.9) hue-rotate(180deg)';
      showToast("Modo noche activado (Simulado)", "info");
    } else {
      document.body.style.filter = 'none';
      showToast("Modo día activado", "info");
    }
  });

  // Sidebar Exit
  logoutBtn.addEventListener('click', () => {
    showToast("Cerrando sesión de SIGGESMAFI...", "info");
    setTimeout(() => {
      alert("Sesión cerrada. Redirigiendo a pantalla de login.");
    }, 800);
  });

  // Modal Buttons
  closeModalBtn.addEventListener('click', closeEditModal);
  cancelModalBtn.addEventListener('click', closeEditModal);
  saveModalBtn.addEventListener('click', saveChanges);
  
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
  });

  // Curricular Map / New Activity button alerts
  curricularBtn.addEventListener('click', () => {
    showToast("Abriendo Mapa Curricular de la sección...", "info");
  });

  addActivityBtn.addEventListener('click', () => {
    showToast("Creador de Nueva Actividad (Rúbrica/Examen)", "info");
  });

  // Backup & Restore files
  backupBtn.addEventListener('click', triggerBackup);
  restoreBtn.addEventListener('click', () => restoreFileInput.click());
  restoreFileInput.addEventListener('change', handleRestore);
}

// Simulate fetching network indicator
function simulateDataReload() {
  tableBody.style.opacity = '0.35';
  setTimeout(() => {
    tableBody.style.opacity = '1';
    // Shift some grades randomly to show content changes
    const students = getActiveStudents();
    students.forEach(st => {
      const grades = ['A', 'B', 'AD', 'C', '-'];
      if (Math.random() > 0.7) {
        st.planner = grades[Math.floor(Math.random() * grades.length)];
      }
      if (Math.random() > 0.7) {
        st.cuadro = grades[Math.floor(Math.random() * grades.length)];
      }
      if (Math.random() > 0.7) {
        st.dedo = grades[Math.floor(Math.random() * grades.length)];
      }
    });
    renderTable();
  }, 250);
}

// Backup file downloader
function triggerBackup() {
  const activeStudents = getActiveStudents();
  const backup = {
    clase: currentClase,
    periodo: currentPeriodo,
    timestamp: new Date().toISOString(),
    students: activeStudents
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute("href", dataStr);
  dl.setAttribute("download", `backup_siggesmafi_rediseño_${currentClase}.json`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
  showToast("Copia de seguridad del rediseño descargada.");
}

// Restore file reader
function handleRestore(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      const backup = JSON.parse(event.target.result);
      if (backup.students && Array.isArray(backup.students)) {
        if (backup.clase) currentClase = backup.clase;
        if (backup.periodo) currentPeriodo = backup.periodo;
        
        studentsDatabase[currentClase][currentPeriodo] = backup.students;
        headerClaseSelect.value = currentClase;
        headerPeriodoSelect.value = currentPeriodo;
        
        renderTable();
        showToast("Backup restaurado y cargado con éxito.");
      } else {
        showToast("Formato de backup incorrecto.", "error");
      }
    } catch(err) {
      showToast("Error leyendo backup.", "error");
    }
  };
  reader.readAsText(file);
  restoreFileInput.value = '';
}

// Simple HTML escaping helper
function escapeHtml(string) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };
  return String(string).replace(/[&<>"'\/]/g, (s) => htmlEscapes[s]);
}
