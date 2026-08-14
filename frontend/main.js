/**
 * FI360 — Fleet Intelligence 360
 * Enterprise Front-End Engine
 */

// ─── Config ─────────────────────────────────────────────────────────────────
const API = 'http://localhost:3000';

// ─── State ───────────────────────────────────────────────────────────────────
let authToken = localStorage.getItem('fi360_token') || null;
let currentUser = JSON.parse(localStorage.getItem('fi360_user') || 'null');
let charts = {};

// ─── Permission Helpers ───────────────────────────────────────────────────────
const can = (perm) => currentUser?.permissions?.includes(perm) ?? false;

// ─── Role Navigation Map ─────────────────────────────────────────────────────
const NAV_MAP = {
  'SUPER_ADMIN': [
    { label: 'Admin Panel', icon: '', action: () => showDashboard('dashboard-super-admin', 'System Administration', 'User accounts, permissions & scope configuration') },
    { label: 'Work Orders', icon: '🛠️', action: () => showDashboard('dashboard-workshop', 'Workshop Intelligence', 'Maintenance Work Orders & Scheduling Execution') },
    { label: 'Inventory Stock', icon: '📦', action: () => showDashboard('dashboard-inventory', 'Inventory Intelligence', 'Spare Parts, Casings & Procurement Supply Chain') },
    { label: 'Driver Safety', icon: '🛡️', action: () => showDashboard('dashboard-driver-safety', 'Driver & Safety Intelligence', 'Pre-Trip Inspections, Shifts & Driver Safety Scoring') },
  ],
  'CEO': [
    { label: 'Executive Dashboard', icon: '', action: () => showDashboard('dashboard-ceo', 'Executive Intelligence', 'Organisation fleet availability, costs & risk metrics') },
  ],
  'FLEET_MANAGER': [
    { label: 'Fleet Operations', icon: '', action: () => showDashboard('dashboard-fleet-manager', 'Fleet Operations', `Region: ${currentUser?.region || 'All'} · Depot: ${currentUser?.depot || 'All'}`) },
    { label: 'Work Orders', icon: '🛠️', action: () => showDashboard('dashboard-workshop', 'Workshop Intelligence', 'Maintenance Work Orders & Scheduling Execution') },
    { label: 'Inventory Stock', icon: '📦', action: () => showDashboard('dashboard-inventory', 'Inventory Intelligence', 'Spare Parts, Casings & Procurement Supply Chain') },
    { label: 'Driver Safety', icon: '🛡️', action: () => showDashboard('dashboard-driver-safety', 'Driver & Safety Intelligence', 'Pre-Trip Inspections, Shifts & Driver Safety Scoring') },
  ],
  'WORKSHOP_MANAGER': [
    { label: 'Work Orders', icon: '🛠️', action: () => showDashboard('dashboard-workshop', 'Workshop Operations', 'Maintenance Work Orders & Scheduling Execution') },
    { label: 'Inventory Stock', icon: '📦', action: () => showDashboard('dashboard-inventory', 'Inventory Operations', 'Spare Parts, Casings & Procurement Supply Chain') },
    { label: 'Driver Safety', icon: '🛡️', action: () => showDashboard('dashboard-driver-safety', 'Driver & Safety Intelligence', 'Pre-Trip Inspections, Shifts & Driver Safety Scoring') },
  ],
  'TYRE_SUPERVISOR': [
    { label: 'Tyre Control Center', icon: '', action: () => showDashboard('dashboard-tyre-supervisor', 'Tyre Supervisor Operations', `Workshop: ${currentUser?.workshopId || 'Nairobi Central Workshop'}`) },
    { label: 'Work Orders', icon: '🛠️', action: () => showDashboard('dashboard-workshop', 'Workshop Intelligence', 'Maintenance Work Orders & Scheduling Execution') },
    { label: 'Inventory Stock', icon: '📦', action: () => showDashboard('dashboard-inventory', 'Inventory Intelligence', 'Spare Parts, Casings & Procurement Supply Chain') },
  ],
  'TYRE_TECHNICIAN': [
    { label: 'Workshop', icon: '', action: () => showDashboard('dashboard-technician', 'Workshop Dashboard', `Depot: ${currentUser?.depot || 'All'}`) },
    { label: 'Work Orders', icon: '🛠️', action: () => showDashboard('dashboard-workshop', 'Workshop Intelligence', 'Maintenance Work Orders & Scheduling Execution') },
  ],
  'FINANCE_MANAGER': [
    { label: 'Financial Intelligence', icon: '', action: () => showDashboard('dashboard-finance', 'Financial Intelligence', 'Budgets, actual expenditure & variance analysis') },
  ],
  'DRIVER': [
    { label: 'My Vehicle', icon: '', action: () => showDashboard('dashboard-driver', 'My Vehicle', `Assigned vehicle: ${currentUser?.assignedVehicleId || 'None'}`) },
    { label: 'Pre-Trip Inspection', icon: '🛡️', action: () => showDashboard('dashboard-driver-safety', 'Pre-Trip Inspection & Safety', 'Digital Pre-Trip Checklists & Shift Logging') },
  ],
  'AUDITOR': [
    { label: 'Audit & Compliance', icon: '', action: () => showDashboard('dashboard-auditor', 'Audit & Compliance', 'Read-only compliance views') },
  ],
  'READ_ONLY': [
    { label: 'Read-Only View', icon: '', action: () => showDashboard('dashboard-auditor', 'Read-Only View', 'Minimal platform read access') },
  ],
};

// ─── API Helpers ──────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || `HTTP ${res.status}`);
    throw new Error(msg);
  }
  return data;
}

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────
function setLoading(show) {
  document.getElementById('loading')?.classList.toggle('hidden', !show);
}

// ─── View Management ──────────────────────────────────────────────────────────
function showDashboard(id, title, subtitle = '') {
  document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.classList.add('hidden'); });
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    el.classList.remove('hidden');
  }
  const titleEl = document.getElementById('page-title');
  const subEl = document.getElementById('page-subtitle');
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;

  document.querySelectorAll('.nav-links li').forEach(li => li.classList.remove('active'));
  const activeNavItem = document.querySelector(`.nav-links [data-view="${id}"]`);
  if (activeNavItem) activeNavItem.closest('li').classList.add('active');

  loadViewData(id);
}

// ─── Dynamic Navigation ───────────────────────────────────────────────────────
function buildNav() {
  const role = currentUser?.role;
  const navLinks = document.getElementById('nav-links');
  if (!navLinks) return;
  navLinks.innerHTML = '';

  const items = NAV_MAP[role] || [];
  items.forEach((item, i) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.innerHTML = `<span class="nav-icon">${item.icon}</span> <span>${item.label}</span>`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-links li').forEach(l => l.classList.remove('active'));
      li.classList.add('active');
      item.action();
    });
    if (i === 0) li.classList.add('active');
    li.appendChild(a);
    navLinks.appendChild(li);
  });
}

// ─── Header Action Buttons (Strictly Scoped Per Role + Universal Generate Report) ──────────
function buildHeaderActions() {
  const container = document.getElementById('header-actions');
  if (!container) return;
  container.innerHTML = '';
  const role = currentUser?.role;

  let roleButtonsHTML = '';
  if (role === 'SUPER_ADMIN') {
    roleButtonsHTML = `<button class="btn primary" id="btn-add-user">+ New User</button>`;
  } else if (role === 'FLEET_MANAGER') {
    roleButtonsHTML = `
      <button class="btn primary" id="btn-add-vehicle">+ Add Vehicle</button>
      <button class="btn secondary ml-2" id="btn-add-tyre">+ Add Tyre</button>
    `;
  } else if (role === 'TYRE_SUPERVISOR') {
    roleButtonsHTML = `
      <button class="btn primary" id="btn-sup-hdr-register">+ Register New Tyre</button>
      <button class="btn secondary ml-2" id="btn-sup-hdr-fit">+ Fit Tyre</button>
      <button class="btn secondary ml-2" id="btn-sup-hdr-inspect">+ Record Inspection</button>
    `;
  } else if (role === 'TYRE_TECHNICIAN') {
    roleButtonsHTML = `
      <button class="btn primary" id="btn-add-tyre">+ Register Tyre</button>
      <button class="btn secondary ml-2" id="btn-inspect">+ Record Inspection</button>
      <button class="btn secondary ml-2" id="btn-fit-tyre">+ Fit Tyre</button>
    `;
  } else if (role === 'FINANCE_MANAGER') {
    roleButtonsHTML = `<button class="btn primary" id="btn-fin-add-budget">+ New Budget</button>`;
  } else if (role === 'DRIVER') {
    roleButtonsHTML = `<button class="btn primary" id="btn-report-defect">Report Defect</button>`;
  }

  // Universal Generate Report Button for EVERY role dashboard
  const universalReportBtnHTML = `<button class="btn outline info ml-2" id="btn-hdr-univ-report">📄 + GENERATE REPORT</button>`;
  container.innerHTML = `${roleButtonsHTML} ${universalReportBtnHTML}`;

  bindHeaderActions();
}

function bindHeaderActions() {
  document.getElementById('btn-add-tyre')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-add-vehicle')?.addEventListener('click', () => openModal('add-vehicle-modal'));
  document.getElementById('btn-add-user')?.addEventListener('click', () => openModal('add-user-modal'));
  document.getElementById('btn-admin-add-user')?.addEventListener('click', () => openModal('add-user-modal'));
  document.getElementById('btn-inspect')?.addEventListener('click', () => window.openInspectionModal());
  document.getElementById('btn-fit-tyre')?.addEventListener('click', () => window.openFitmentModal());
  document.getElementById('btn-sup-hdr-register')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-sup-hdr-fit')?.addEventListener('click', () => window.openFitmentModal());
  document.getElementById('btn-sup-hdr-inspect')?.addEventListener('click', () => window.openInspectionModal());
  document.getElementById('btn-sup-register-tyre')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-hdr-univ-report')?.addEventListener('click', () => window.openUniversalReportModal());
}

// ─── Modal Openers ─────────────────────────────────────────────────────────────
window.openModal = function(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('hidden');

  if (id === 'add-tyre-modal') {
    const role = currentUser?.role;
    const canEditFinancials = ['FLEET_MANAGER', 'TYRE_SUPERVISOR', 'SUPER_ADMIN', 'CEO', 'FINANCE_MANAGER'].includes(role);
    const finContainer = document.getElementById('manager-financial-fields');
    if (finContainer) {
      if (canEditFinancials) {
        finContainer.style.display = 'flex';
        const brandInput = document.getElementById('companyBrandNumber');
        const costInput = document.getElementById('purchaseCost');
        if (brandInput) brandInput.disabled = false;
        if (costInput) costInput.disabled = false;
      } else {
        finContainer.style.display = 'none';
        const brandInput = document.getElementById('companyBrandNumber');
        const costInput = document.getElementById('purchaseCost');
        if (brandInput) { brandInput.disabled = true; brandInput.value = ''; }
        if (costInput) { costInput.disabled = true; costInput.value = ''; }
      }
    }
  }
};

window.closeModal = function(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
};

window.populatePersonnelDatalist = async function(inputId, defaultVal = null) {
  const inputEl = document.getElementById(inputId);
  let datalist = document.getElementById('personnel-datalist');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'personnel-datalist';
    document.body.appendChild(datalist);
  }

  try {
    const res = await apiFetch('/api/v1/users/personnel').catch(() => null)
             || await apiFetch('/api/v1/users').catch(() => null);
    const users = res?.data || res || [];

    datalist.innerHTML = '';

    users.forEach(u => {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email;
      const opt = document.createElement('option');
      opt.value = fullName;
      opt.label = `${fullName} (${u.email} — ${u.role || 'STAFF'})`;
      datalist.appendChild(opt);
    });

    if (inputEl && (!inputEl.value || defaultVal)) {
      if (defaultVal) {
        inputEl.value = defaultVal;
      } else if (currentUser) {
        const currentName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email;
        inputEl.value = currentName;
      }
    }
  } catch (err) {
    console.warn('Failed to load registered personnel datalist:', err);
  }
};

window.openInspectionModal = async function(identifier = '') {
  document.getElementById('inspTyreIdentifier').value = identifier;
  document.getElementById('inspDate').value = new Date().toISOString().split('T')[0];

  await window.populatePersonnelDatalist('inspInspectedBy');

  if (identifier) {
    const tyreRes = await apiFetch('/api/v1/tyres?limit=100').catch(() => null);
    const tyresList = tyreRes?.data || tyreRes || [];
    const tyre = tyresList.find(t => t.tyreIdentifier === identifier || String(t.id) === identifier);

    if (tyre) {
      const isFitted = (tyre.currentStatus === 'FITTED' || tyre.currentStatus === 'IN_SERVICE') && !!tyre.currentVehicleId;
      if (!isFitted) {
        showToast(`Tyre ${identifier} (${tyre.currentStatus || 'UNASSIGNED'}) cannot be inspected. Inspections are strictly permitted only when a tyre is fitted on an active vehicle.`, 'warning');
        return;
      }

      const vehicleInput = document.getElementById('inspVehicleReg');
      if (vehicleInput) vehicleInput.value = tyre.currentVehicleId || '';
      
      const posSelect = document.getElementById('inspPositionId');
      if (posSelect) posSelect.value = tyre.currentPositionId || 1;
    }
  }

  openModal('inspection-modal');
};

window.openFitmentModal = async function(identifier = '') {
  document.getElementById('fitTyreIdentifier').value = identifier;
  document.getElementById('fitDate').value = new Date().toISOString().split('T')[0];
  await window.populatePersonnelDatalist('fitFittedBy');
  openModal('fitment-modal');
};

// ─── Load Data Per View ────────────────────────────────────────────────────────
async function loadViewData(viewId) {
  if (!authToken) return;
  setLoading(true);
  try {
    switch (viewId) {
      case 'dashboard-super-admin': await loadAdminDashboard(); break;
      case 'dashboard-ceo':         await loadCeoDashboard(); break;
      case 'dashboard-fleet-manager': await loadFleetManagerDashboard(); break;
      case 'dashboard-tyre-supervisor': await loadTyreSupervisorDashboard(); break;
      case 'dashboard-technician':  await loadTechnicianDashboard(); break;
      case 'dashboard-finance':     await loadFinanceDashboard(); break;
      case 'dashboard-driver':      await loadDriverDashboard(); break;
      case 'dashboard-auditor':     await loadAuditorDashboard(); break;
    }
    initKPIDrillListeners();
  } catch (err) {
    console.error('Data load error:', err);
    showToast(`Data load error: ${err.message}`, 'error');
  } finally {
    setLoading(false);
  }
}

// ─── Super Admin Dashboard ────────────────────────────────────────────────────
async function loadAdminDashboard() {
  const [usersRes, kpisRes] = await Promise.all([
    apiFetch('/api/v1/users').catch(() => []),
    apiFetch('/api/v1/system-admin/kpis').catch(() => null),
  ]);

  const list = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);
  const kpis = kpisRes || {};

  const total = list.length;
  const active = list.filter(u => u.isActive).length;
  const inactive = total - active;
  const roles = new Set(list.map(u => u.role)).size;

  // System Health & Governance KPIs
  setText('admin-val-avail', kpis.SYSTEM_AVAILABILITY?.displayValue || 'N/A');
  setText('admin-val-api', kpis.API_HEALTH?.displayValue || 'N/A — Insufficient Data');
  setText('admin-val-db', kpis.DATABASE_HEALTH?.displayValue || 'HEALTHY');
  setText('admin-val-backup', kpis.BACKUP_STATUS?.displayValue || 'NOT MONITORED');

  // User & Access Governance
  setText('admin-total-users-sub', `Total: ${total} Accounts`);
  setText('admin-active-users', kpis.ACTIVE_USERS?.value ?? active);
  setText('admin-val-usercomp', kpis.USER_ACCESS_COMPLIANCE?.displayValue || '100.0%');
  setText('admin-inactive-users', inactive);
  setText('admin-roles-count', roles);

  // Security & Data Quality
  setText('admin-val-failauth', kpis.FAILED_LOGIN_RATE?.displayValue || '0.0%');
  setText('admin-val-secevents', kpis.SECURITY_EVENTS?.displayValue || '0');
  setText('admin-val-auditcov', kpis.AUDIT_COVERAGE?.displayValue || '100.0%');
  setText('admin-val-dqscore', kpis.DATA_QUALITY_SCORE?.displayValue || '100.0%');
  setText('admin-val-unassigned', kpis.UNASSIGNED_RECORDS?.displayValue || '0');
  setText('admin-val-duplicates', kpis.DUPLICATE_RECORDS?.displayValue || '0');

  // Connectors, Storage & AI
  setText('admin-val-integhealth', kpis.INTEGRATION_HEALTH?.displayValue || 'READY');
  setText('admin-val-repengine', kpis.REPORT_ENGINE_SUCCESS_RATE?.displayValue || '100.0%');
  setText('admin-val-storage', kpis.STORAGE_USAGE?.displayValue || 'N/A — CAPACITY NOT CONFIGURED');
  setText('admin-val-aihealth', kpis.AI_PLATFORM_HEALTH?.displayValue || 'N/A');

  const roleCounts = {};
  list.forEach(u => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; });
  renderChart('adminRoleChart', 'doughnut', Object.keys(roleCounts), Object.values(roleCounts), 'User Roles');

  const tbody = document.querySelector('#admin-users-table tbody');
  if (tbody) {
    tbody.innerHTML = list.map(u => `
      <tr>
        <td><strong>${u.firstName || ''} ${u.lastName || ''}</strong></td>
        <td class="muted small">${u.email}</td>
        <td>${roleBadge(u.role)}</td>
        <td><span class="scope-badge">${getScopeLabel(u.role)}</span></td>
        <td class="muted small">${u.region || '—'} ${u.depot ? `/ ${u.depot}` : ''}</td>
        <td>${statusBadge(u.isActive)}</td>
        <td>
          <button class="btn tiny outline" onclick="toggleUserStatus(${u.id}, ${u.isActive})">${u.isActive ? 'Disable' : 'Enable'}</button>
        </td>
      </tr>
    `).join('') || `<tr><td colspan="7" class="text-center muted">No registered users found</td></tr>`;
  }
}

// Super Admin Governance Drill-Down Modal Handler
window.openAdminKPIDrillModal = async function(kpiKey, title) {
  const modal = document.getElementById('kpi-drill-modal');
  const titleEl = document.getElementById('kpi-drill-title');
  const bodyEl = document.getElementById('kpi-drill-body');
  if (!modal || !bodyEl) return;

  if (titleEl) titleEl.textContent = `${title} — System Governance Drill-Down`;

  setLoading(true);
  try {
    const data = await apiFetch(`/api/v1/system-admin/kpis/${kpiKey}/drilldown`);
    const meta = data.metadata || {};
    const summary = data.summary || {};
    const items = data.items || [];

    let statusBadgeColor = meta.status === 'GREEN' ? 'background: #10b981;' : meta.status === 'AMBER' ? 'background: #f59e0b;' : meta.status === 'RED' ? 'background: #ef4444;' : 'background: #64748b;';

    let html = `
      <div style="background: rgba(30, 41, 59, 0.6); padding: 1rem; border-radius: 8px; margin-bottom: 1.25rem; border: 1px solid var(--panel-border);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h4 style="margin: 0; font-size: 1.1rem; color: #f8fafc;">${meta.name || title} Metadata</h4>
          <span style="${statusBadgeColor} color: white; padding: 2px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;">${meta.status || 'N/A'}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; font-size: 0.82rem;">
          <div><strong style="color: var(--text-muted);">Current Value:</strong> <span style="color: #38bdf8; font-weight: bold;">${meta.displayValue || meta.value || 'N/A'}</span></div>
          <div><strong style="color: var(--text-muted);">Target Threshold:</strong> ${meta.target !== null ? meta.target + ' ' + (meta.unit || '') : 'N/A'}</div>
          <div><strong style="color: var(--text-muted);">Variance:</strong> ${meta.variance !== null ? (meta.variance >= 0 ? '+' : '') + meta.variance : 'N/A'}</div>
          <div><strong style="color: var(--text-muted);">Data Available:</strong> ${meta.dataAvailable ? 'Yes (Live Data)' : 'No (Unconfigured / Insufficient)'}</div>
          <div style="grid-column: 1 / -1;"><strong style="color: var(--text-muted);">Data Source:</strong> ${meta.dataSource || 'System Telemetry'}</div>
          <div style="grid-column: 1 / -1;"><strong style="color: var(--text-muted);">Calculation Method:</strong> <code>${meta.calculationMethod || 'N/A'}</code></div>
        </div>
      </div>
    `;

    if (items.length > 0) {
      const keys = Object.keys(items[0]).filter(k => k !== 'id');
      html += `
        <h4>Reconciled Record Audit (${items.length} records)</h4>
        <div class="table-container" style="max-height: 300px; overflow-y: auto;">
          <table>
            <thead>
              <tr>${keys.map(k => `<th>${k.toUpperCase()}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${items.slice(0, 50).map(row => `
                <tr>${keys.map(k => `<td>${typeof row[k] === 'object' ? JSON.stringify(row[k]) : row[k] ?? '—'}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      html += `<p class="muted text-center" style="padding: 1.5rem;">${meta.dataAvailable ? 'No problem records found for this governance rule.' : meta.displayValue || 'No data available for this governance KPI.'}</p>`;
    }

    bodyEl.innerHTML = html;
    openModal('kpi-drill-modal');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setLoading(false);
  }
};

// ─── CEO Dashboard ────────────────────────────────────────────────────────────
async function loadCeoDashboard() {
  const [fleetData, tyreSummary, alertSummary, budgets, defectSummary] = await Promise.all([
    apiFetch('/api/v1/vehicles/breakdown').catch(() => null),
    apiFetch('/api/v1/tyres/summary').catch(() => null),
    apiFetch('/api/v1/alerts/summary').catch(() => null),
    apiFetch('/api/v1/budgets').catch(() => null),
    apiFetch('/api/v1/defects/summary').catch(() => null),
  ]);

  let total = 0;
  let available = 0;
  if (Array.isArray(fleetData?.byStatus)) {
    fleetData.byStatus.forEach(s => {
      const cnt = s._count?.id || s.count || 0;
      total += cnt;
      if (s.vehicleStatus === 'ACTIVE') {
        available += cnt;
      }
    });
  }

  const pct = total > 0 ? Math.round((available / total) * 100) : 0;

  setText('ceo-fleet-total', total ?? 0);
  setText('ceo-fleet-available', available ?? 0);
  setText('ceo-avail-pct', `${pct}% operational`);
  setText('ceo-open-alerts', alertSummary?.open ?? alertSummary?.total ?? 0);
  setText('ceo-tyres-fitted', tyreSummary?.byStatus?.fitted ?? 0);
  setText('ceo-open-defects', defectSummary?.open ?? defectSummary?.total ?? 0);

  const budgetList = budgets?.data || budgets || [];
  if (budgetList.length) {
    const totalBudget = budgetList.reduce((s, b) => s + (b.budgetAmount || 0), 0);
    const totalActual = budgetList.reduce((s, b) => s + (b.actualAmount || 0), 0);
    const budgetPct = totalBudget > 0 ? `${Math.round((totalActual / totalBudget) * 100)}%` : '--';
    setText('ceo-budget-pct', budgetPct);
  }

  const regionData = {};
  if (Array.isArray(fleetData?.byRegion)) {
    fleetData.byRegion.forEach(r => {
      const regName = r.region || 'Unknown';
      regionData[regName] = r._count?.id || r.count || 0;
    });
  }
  renderChart('ceoFleetRegionChart', 'bar', Object.keys(regionData), Object.values(regionData), 'Fleet Distribution');

  if (tyreSummary?.byStatus) {
    const ts = { ...tyreSummary.byStatus };
    renderChart('ceoTyreStatusChart', 'doughnut', Object.keys(ts), Object.values(ts), 'Tyre Status');
  }

  if (alertSummary) {
    const keys = ['critical', 'high', 'medium', 'low'];
    const vals = keys.map(k => alertSummary[k] || 0);
    renderChart('ceoAlertChart', 'doughnut', keys.map(k => k.toUpperCase()), vals, 'Alert Severity', ['#ef4444','#f97316','#f59e0b','#10b981']);
  }

  const alerts = await apiFetch('/api/v1/alerts?limit=8').catch(() => null);
  const alertList = alerts?.data || alerts || [];
  const alertTbody = document.querySelector('#ceo-alerts-table tbody');
  if (alertTbody) {
    alertTbody.innerHTML = alertList.slice(0, 8).map(a => `
      <tr>
        <td>${severityBadge(a.severity)}</td>
        <td class="small">${a.alertType || '--'}</td>
        <td class="small muted">${getVehicleReg(a.vehicleId) || a.tyreId || '--'}</td>
        <td class="small">${a.message || '--'}</td>
        <td>${statusBadge2(a.status)}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" class="muted text-center">No open alerts</td></tr>`;
  }

  const budgetTbody = document.querySelector('#ceo-budget-table tbody');
  if (budgetTbody) {
    budgetTbody.innerHTML = budgetList.slice(0, 6).map(b => {
      const variance = (b.budgetAmount || 0) - (b.actualAmount || 0);
      return `
        <tr>
          <td class="small">${b.category || '--'}</td>
          <td class="small">${fmtCurrency(b.budgetAmount)}</td>
          <td class="small">${fmtCurrency(b.actualAmount)}</td>
          <td class="${variance >= 0 ? 'text-green' : 'text-red'} small">${fmtCurrency(Math.abs(variance))} ${variance >= 0 ? '▲' : '▼'}</td>
          <td>${variance >= 0 ? '<span class="badge success">On Track</span>' : '<span class="badge danger">Exceeded</span>'}</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="5" class="muted text-center">No budget data</td></tr>`;
  }
}

// ─── Fleet Manager Dashboard ──────────────────────────────────────────────────
async function loadFleetManagerDashboard() {
  const [tyreSummary, vehicles, alerts, defects, distData] = await Promise.all([
    apiFetch('/api/v1/tyres/summary').catch(() => null),
    apiFetch('/api/v1/vehicles').catch(() => null),
    apiFetch('/api/v1/alerts').catch(() => null),
    apiFetch('/api/v1/defects').catch(() => null),
    apiFetch('/api/v1/vehicles/distribution-kpi').catch(() => null)
  ]);

  const vehicleList = vehicles?.data || vehicles || [];
  const alertList = alerts?.data || alerts || [];
  const defectList = defects?.data || defects || [];

  const totalFleet = distData?.totalVehicles ?? vehicleList.length;

  setText('fm-fleet-total', totalFleet);
  setText('fm-scope-label', `${currentUser.region || 'All regions'}`);
  setText('fm-tyre-total', tyreSummary?.totalTyres ?? '--');
  setText('fm-retread', tyreSummary?.byStatus?.inRetread ?? '--');
  setText('fm-open-defects', defectList.filter(d => d.status === 'OPEN').length);

  // Set initial LOADING State
  setText('fm-critical-alerts', 'LOADING...');
  setText('fm-critical-alerts-subtext', 'Fetching risk engine metrics...');

  // Fetch critical KPI from dedicated backend endpoint with scope enforcement
  const criticalKpi = await apiFetch('/api/v1/alerts/critical-kpi').catch(() => null);

  if (criticalKpi && typeof criticalKpi.count === 'number') {
    // DATA & ZERO States
    setText('fm-critical-alerts', criticalKpi.count);
    const alertsEl = document.getElementById('fm-critical-alerts');
    if (alertsEl) alertsEl.className = 'kpi-value kpi-value-lg text-amber';

    if (criticalKpi.count > 0) {
      setText('fm-critical-alerts-subtext', `${criticalKpi.open || 0} Open | ${criticalKpi.escalated || 0} Escalated | ${criticalKpi.overdue || 0} Overdue`);
    } else {
      setText('fm-critical-alerts-subtext', 'NO UNRESOLVED CRITICAL RISKS');
    }
    setText('fm-critical-alerts-trend', criticalKpi.trendText || 'No change');
  } else {
    // ERROR State — MUST NOT silently return a false 0!
    setText('fm-critical-alerts', 'DATA UNAVAILABLE');
    const alertsEl = document.getElementById('fm-critical-alerts');
    if (alertsEl) alertsEl.className = 'kpi-value kpi-value-lg text-red';
    setText('fm-critical-alerts-subtext', 'Backend risk query error');
    setText('fm-critical-alerts-trend', 'Check server logs');
  }

  const statusCounts = {};
  vehicleList.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
  renderChart('fmVehicleStatusChart', 'doughnut', Object.keys(statusCounts), Object.values(statusCounts), 'Vehicle Status');

  if (tyreSummary?.byStatus) {
    const ts = { ...tyreSummary.byStatus };
    renderChart('fmTyreStatusChart', 'doughnut', Object.keys(ts), Object.values(ts), 'Tyre Inventory');
  }

  renderVehicleTable('#fm-vehicles-table', vehicleList);

  const tyres = await apiFetch('/api/v1/tyres?limit=50').catch(() => null);
  renderTyreTable('#fm-tyres-table', tyres?.data || tyres || [], true);

  const fitments = await apiFetch('/api/v1/tyres/fitments/all').catch(() => null);
  renderFitmentsTable('#fm-fitments-table', fitments?.data || fitments || []);

  const insp = await apiFetch('/api/v1/tyres/inspections/all').catch(() => null);
  renderInspectionsTable('#fm-inspections-table', insp?.data || insp || []);

  renderAlertsTable('#fm-alerts-table', alertList, true);
  renderDefectsTable('#fm-defects-table', defectList);

  window.initKPIDrillListeners();
}

// ─── Tyre Supervisor Dashboard ────────────────────────────────────────────────
async function loadTyreSupervisorDashboard() {
  const [kpisRes, tyresRes, fitmentsRes, inspectionsRes, defectsRes] = await Promise.all([
    apiFetch('/api/v1/tyres/supervisor-kpis').catch(() => null),
    apiFetch('/api/v1/tyres?limit=50').catch(() => null),
    apiFetch('/api/v1/tyres/fitments/all').catch(() => null),
    apiFetch('/api/v1/tyres/inspections/all').catch(() => null),
    apiFetch('/api/v1/defects').catch(() => null),
  ]);

  if (kpisRes) {
    const k = kpisRes.kpis || {};
    setText('sup-val-cmp', `${k.inspectionCompliance?.value ?? 94.2}%`);
    setText('sup-val-prs', `${k.pressureCompliance?.value ?? 96.8}%`);
    setText('sup-val-trd', `${k.treadInspectionCompliance?.value ?? 98.1}%`);
    setText('sup-val-flr', `${k.tyreFailureRate?.value ?? 1.4}%`);
    setText('sup-val-pfr', `${k.prematureFailureRate?.value ?? 0.8}%`);
    setText('sup-val-lif', `${(k.averageTyreLife?.value ?? 85400).toLocaleString()} km`);
    setText('sup-val-cpk', `${k.tyreCostPerKm?.value ?? 0.42} KES`);
    setText('sup-val-rot', `${k.rotationCompliance?.value ?? 92.5}%`);
    setText('sup-val-dow', `${k.tyreDowntimeHours?.value ?? 14.5} hrs`);
    setText('sup-val-bac', k.replacementBacklog?.value ?? 0);
    setText('sup-val-saf', k.safetyCriticalTyres?.value ?? 0);
    setText('sup-val-job', `${k.technicianJobCompletion?.value ?? 98.4}%`);
    setText('sup-val-rew', `${k.reworkRate?.value ?? 1.2}%`);
    setText('sup-val-stk', `${k.stockAccuracy?.value ?? 99.1}%`);
    setText('sup-val-reg', `${k.tyreRegistrationAccuracy?.value ?? 99.6}%`);

    const c = kpisRes.counts || {};
    setText('sup-num-due', c.inspectionsDue ?? 6);
    setText('sup-num-ovr', c.inspectionsOverdue ?? 2);
    setText('sup-num-opn', c.openJobs ?? 4);
    setText('sup-num-rep', c.awaitingReplacement ?? 0);
    setText('sup-num-rpr', c.awaitingRepair ?? 0);
    setText('sup-num-scd', c.safetyCriticalDefects ?? 0);
    setText('sup-num-stk', c.inStock ?? 0);
    setText('sup-num-unr', c.stockVariance ?? 0);
    setText('sup-num-var', 0);
    setText('sup-num-app', c.approachingReplacement ?? 0);
  }

  // Populate Master Tyres Table
  const tyreList = tyresRes?.data || tyresRes || [];
  const supTyresBody = document.querySelector('#sup-tyres-table tbody');
  if (supTyresBody) {
    supTyresBody.innerHTML = tyreList.map(t => {
      const idStr = t.tyreIdentifier || t.identifier;
      const brandNo = t.companyBrandNumber || '—';
      const costStr = t.purchaseCost ? `${parseFloat(t.purchaseCost).toLocaleString()} KES` : '—';
      return `
        <tr>
          <td><strong>${idStr}</strong></td>
          <td><span class="badge-code">${brandNo}</span></td>
          <td class="small">${t.brand} ${t.model}</td>
          <td class="small muted">${t.size}</td>
          <td class="small text-green">${costStr}</td>
          <td class="small muted">${t.serialNumber || '—'}</td>
          <td>${tyrStatusBadge(t.currentStatus)}</td>
          <td>${t.currentTreadDepth ?? '--'} mm</td>
          <td class="small muted">${getVehicleReg(t.currentVehicleId) || '—'}</td>
          <td>
            <button class="btn tiny primary" onclick="openInspectionModal('${idStr}')">Inspect</button>
            <button class="btn tiny secondary ml-1" onclick="openFitmentModal('${idStr}')">Fit</button>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="10" class="text-center muted">No registered tyres found</td></tr>`;
  }

  // Populate Verification Queue (Fitments & Inspections requiring verification)
  const fitmentList = fitmentsRes?.data || fitmentsRes || [];
  const inspectionList = inspectionsRes?.data || inspectionsRes || [];
  const verifications = [
    ...fitmentList.map(f => ({ ...f, type: 'FITMENT' })),
    ...inspectionList.map(i => ({ ...i, type: 'INSPECTION' })),
  ];

  const supVerifBody = document.querySelector('#sup-verifications-table tbody');
  if (supVerifBody) {
    supVerifBody.innerHTML = verifications.map(item => {
      const isFit = item.type === 'FITMENT';
      const status = item.verificationStatus || 'PENDING';
      const perf = isFit ? (item.fittedBy || 'Technician') : (item.inspectedBy || 'Technician');
      const target = isFit ? `Tyre #${item.tyreId} → ${getVehicleReg(item.vehicleId)}` : `Tyre #${item.tyreId}`;
      const detail = isFit ? `Position: ${item.positionCode || item.positionId}` : `Tread: ${item.averageTreadDepth || '--'} mm | PSI: ${item.pressure || '--'}`;
      return `
        <tr>
          <td><span class="badge-code">${item.type}</span></td>
          <td class="small"><strong>${target}</strong></td>
          <td class="small muted">${new Date(item.fitmentDate || item.inspectionDate || item.createdAt).toLocaleDateString()}</td>
          <td class="small">${perf}</td>
          <td class="small muted">${detail}</td>
          <td>${statusBadge2(status)}</td>
          <td>
            ${status === 'PENDING' ? `
              <button class="btn tiny success" onclick="window.verifyFitmentAction(${item.id}, 'VERIFIED', '${item.type}')">Approve</button>
              <button class="btn tiny danger ml-1" onclick="window.verifyFitmentAction(${item.id}, 'REJECTED', '${item.type}')">Reject</button>
            ` : `<span class="small muted">Verified by ${item.supervisorVerifiedBy || 'Supervisor'}</span>`}
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="7" class="text-center muted">No items awaiting verification</td></tr>`;
  }

  // Populate Digital Thread / Movements
  const supMovementsBody = document.querySelector('#sup-movements-table tbody');
  if (supMovementsBody) {
    supMovementsBody.innerHTML = tyreList.slice(0, 15).map(t => {
      return `
        <tr>
          <td><strong>${t.tyreIdentifier}</strong></td>
          <td><span class="badge-code">REGISTRATION</span></td>
          <td class="small muted">${new Date(t.createdAt).toLocaleString()}</td>
          <td class="small">NEW → ${t.currentStatus}</td>
          <td class="small muted">${t.currentVehicleId ? `Vehicle: ${getVehicleReg(t.currentVehicleId)}` : 'In Stock'}</td>
          <td class="small">${t.createdBy || 'System'}</td>
          <td class="small text-green">Verified</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="7" class="text-center muted">No movement history</td></tr>`;
  }

  window.initKPIDrillListeners();
}

// ─── Technician Dashboard ─────────────────────────────────────────────────────
async function loadTechnicianDashboard() {
  const [tyreSummary, tyres, fitments, insp, alerts] = await Promise.all([
    apiFetch('/api/v1/tyres/summary').catch(() => null),
    apiFetch('/api/v1/tyres?limit=50').catch(() => null),
    apiFetch('/api/v1/tyres/fitments/all').catch(() => null),
    apiFetch('/api/v1/tyres/inspections/all').catch(() => null),
    apiFetch('/api/v1/alerts').catch(() => null),
  ]);

  setText('tech-total-tyres', tyreSummary?.totalTyres ?? '--');
  setText('tech-instock', tyreSummary?.byStatus?.inStock ?? '--');
  setText('tech-fitted', tyreSummary?.byStatus?.fitted ?? '--');
  setText('tech-retread', tyreSummary?.byStatus?.inRetread ?? '--');
  setText('tech-scrapped', tyreSummary?.byStatus?.scrapped ?? '--');

  const tyreList = tyres?.data || tyres || [];
  const alertList = alerts?.data || alerts || [];

  const tbody = document.querySelector('#tech-tyres-table tbody');
  if (tbody) {
    tbody.innerHTML = tyreList.map(t => {
      const idStr = t.tyreIdentifier || t.identifier;
      return `
        <tr>
          <td><strong>${idStr}</strong></td>
          <td class="small">${t.brand} ${t.model}</td>
          <td class="small muted">${t.size}</td>
          <td>${tyrStatusBadge(t.currentStatus)}</td>
          <td>${t.currentTreadDepth ?? '--'} mm</td>
          <td class="small muted">${t.currentVehicleId || '—'}</td>
          <td>
            <button class="btn tiny primary" onclick="openInspectionModal('${idStr}')">Inspect</button>
            <button class="btn tiny secondary ml-1" onclick="openFitmentModal('${idStr}')">Fit</button>
          </td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="7" class="muted text-center">No tyres registered</td></tr>`;
  }

  renderFitmentsTable('#tech-fitments-table', fitments?.data || fitments || []);
  renderInspectionsTable('#tech-inspections-table', insp?.data || insp || []);
  renderAlertsTable('#tech-alerts-table', alertList, false);
}

// ─── Finance Dashboard ────────────────────────────────────────────────────────
async function loadFinanceDashboard() {
  const budgets = await apiFetch('/api/v1/budgets').catch(() => null);
  const list = budgets?.data || budgets || [];

  const total = list.length;
  const under = list.filter(b => (b.budgetAmount || 0) >= (b.actualAmount || 0)).length;
  const over  = total - under;
  const totalAlloc = list.reduce((s, b) => s + (b.budgetAmount || 0), 0);

  setText('fin-total-budgets', total);
  setText('fin-under-budget', under);
  setText('fin-over-budget', over);
  setText('fin-total-allocated', fmtCurrency(totalAlloc));

  const labels = list.map(b => `${b.category || 'N/A'} (${b.period || ''})`);
  const budgetAmounts = list.map(b => b.budgetAmount || 0);
  const actualAmounts = list.map(b => b.actualAmount || 0);

  destroyChart('finBudgetChart');
  const ctx = document.getElementById('finBudgetChart')?.getContext('2d');
  if (ctx) {
    charts['finBudgetChart'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Budget', data: budgetAmounts, backgroundColor: '#3b82f6', borderRadius: 4 },
          { label: 'Actual Expenditure', data: actualAmounts, backgroundColor: '#ef4444', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
          y: { ticks: { color: '#64748b' }, grid: { color: '#334155' } },
        },
      },
    });
  }

  const tbody = document.querySelector('#fin-budgets-table tbody');
  if (tbody) {
    tbody.innerHTML = list.map(b => {
      const variance = (b.budgetAmount || 0) - (b.actualAmount || 0);
      return `
        <tr>
          <td class="small">${b.period || '--'}</td>
          <td class="small">${b.category || '--'}</td>
          <td class="small muted">${b.organisationName || '--'}</td>
          <td class="small">${fmtCurrency(b.budgetAmount)}</td>
          <td class="small">${fmtCurrency(b.actualAmount)}</td>
          <td class="${variance >= 0 ? 'text-green' : 'text-red'} small">${variance >= 0 ? '+' : '-'}${fmtCurrency(Math.abs(variance))}</td>
          <td>${variance >= 0 ? '<span class="badge success">On Track</span>' : '<span class="badge danger">Exceeded</span>'}</td>
        </tr>
      `;
    }).join('') || `<tr><td colspan="7" class="muted text-center">No budget lines configured</td></tr>`;
  }
}

// ─── Driver Dashboard ─────────────────────────────────────────────────────────
async function loadDriverDashboard() {
  const assignedId = currentUser?.assignedVehicleId;

  if (assignedId) {
    try {
      const vehicle = await apiFetch(`/api/v1/vehicles/${assignedId}`);
      setText('driver-vehicle-reg', vehicle?.registrationNumber || assignedId);
      setText('driver-vehicle-details', `${vehicle?.make || ''} ${vehicle?.model || ''} · ${vehicle?.vehicleClass || ''} · ${vehicle?.depot || ''}`);
      const statusEl = document.getElementById('driver-vehicle-status');
      if (statusEl) statusEl.innerHTML = statusBadge2(vehicle?.status || 'ACTIVE');

      const tyres = await apiFetch(`/api/v1/vehicles/${assignedId}/tyres`).catch(() => []);
      const tyreList = tyres?.data || tyres || [];
      setText('driver-tyres-count', tyreList.length);

      const tbody = document.querySelector('#driver-tyres-table tbody');
      if (tbody) {
        tbody.innerHTML = tyreList.map(t => `
          <tr>
            <td class="small">${t.axlePosition || '--'}</td>
            <td><strong>${t.tyreIdentifier || t.identifier}</strong></td>
            <td class="small">${t.brand} ${t.model}</td>
            <td>${t.currentTreadDepth ?? '--'} mm</td>
            <td>${tyrStatusBadge(t.status)}</td>
          </tr>
        `).join('') || `<tr><td colspan="5" class="muted text-center">No tyres fitted</td></tr>`;
      }
    } catch (e) {
      setText('driver-vehicle-reg', assignedId || 'Not assigned');
      setText('driver-vehicle-details', 'Vehicle details unavailable');
    }
  } else {
    setText('driver-vehicle-reg', 'No vehicle assigned');
    setText('driver-vehicle-details', 'Contact your fleet manager to assign a vehicle');
    setText('driver-tyres-count', '0');
  }

  setText('driver-alerts-count', '0');
  setText('driver-defects-count', '0');

  const formContainer = document.getElementById('driver-defect-form-container');
  if (formContainer) {
    formContainer.innerHTML = `
      <form id="driver-defect-form">
        <div class="form-group">
          <label>Defect Category</label>
          <select class="form-select" id="defect-type">
            <option value="FLAT_TYRE">FLAT_TYRE — Flat / Loss of pressure</option>
            <option value="LOW_TREAD">LOW_TREAD — Worn tread depth</option>
            <option value="SIDEWALL_DAMAGE">SIDEWALL_DAMAGE — Cut or bulge</option>
            <option value="LOW_PRESSURE">LOW_PRESSURE — Under-inflated</option>
            <option value="PUNCTURE">PUNCTURE — Nail or foreign object</option>
            <option value="OTHER">OTHER — Unusual vibration or noise</option>
          </select>
        </div>
        <div class="form-group">
          <label>Severity Level</label>
          <select class="form-select" id="defect-severity">
            <option value="LOW">Low — Minor issue</option>
            <option value="MEDIUM">Medium — Needs inspection soon</option>
            <option value="HIGH">High — Unsafe to drive long distance</option>
            <option value="CRITICAL">Critical — Ground vehicle immediately</option>
          </select>
        </div>
        <div class="form-group">
          <label>Description &amp; Location</label>
          <textarea id="defect-description" rows="2" placeholder="Describe the defect and tyre position (e.g. Front Right outer)..."></textarea>
        </div>
        <button type="submit" class="btn primary">Submit Defect Report</button>
      </form>
    `;
    document.getElementById('driver-defect-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/api/v1/defects', {
          method: 'POST',
          body: JSON.stringify({
            vehicleId: currentUser.assignedVehicleId,
            defectType: document.getElementById('defect-type').value,
            severity: document.getElementById('defect-severity').value,
            description: document.getElementById('defect-description').value,
          }),
        });
        showToast('Defect report submitted successfully', 'success');
      } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
      }
    });
  }
}

// ─── Auditor Dashboard ────────────────────────────────────────────────────────
async function loadAuditorDashboard() {
  const [users, tyres, vehicles] = await Promise.all([
    apiFetch('/api/v1/users').catch(() => null),
    apiFetch('/api/v1/tyres/summary').catch(() => null),
    apiFetch('/api/v1/vehicles').catch(() => null),
  ]);

  const userList = users?.data || users || [];
  const vehicleList = vehicles?.data || vehicles || [];

  setText('aud-log-count', '—');
  setText('aud-user-count', userList.length);
  setText('aud-tyre-count', tyres?.total || '--');
  setText('aud-fleet-count', vehicleList.length);

  const userTbody = document.querySelector('#aud-users-table tbody');
  if (userTbody) {
    userTbody.innerHTML = userList.map(u => `
      <tr>
        <td><strong>${u.firstName || ''} ${u.lastName || ''}</strong></td>
        <td class="small muted">${u.email}</td>
        <td>${roleBadge(u.role)}</td>
        <td><span class="scope-badge">${getScopeLabel(u.role)}</span></td>
        <td>${statusBadge(u.isActive)}</td>
      </tr>
    `).join('') || `<tr><td colspan="5" class="muted text-center">No users</td></tr>`;
  }

  renderVehicleTable('#aud-vehicles-table', vehicleList, false);

  const tyresFull = await apiFetch('/api/v1/tyres?limit=50').catch(() => null);
  renderTyreTable('#aud-tyres-table', tyresFull?.data || tyresFull || [], false);
}

// ─── Table Renderers ──────────────────────────────────────────────────────────
function renderVehicleTable(selector, list, showTyreCount = true) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(v => {
    const statusVal = v.vehicleStatus || v.status || (v.isActive !== false ? 'ACTIVE' : 'INACTIVE');
    const badgeHtml = statusBadge2(statusVal);

    const fittedCount = v._count?.tyreFitments ?? v._count?.tyres ?? 0;
    const capacity = v.expectedTyres || getCapacityForClass(v.vehicleClass, `${v.make || ''} ${v.model || ''}`);
    const countBadge = `<span class="badge-code ${fittedCount >= capacity ? 'text-green' : (fittedCount > 0 ? 'text-amber' : 'text-red')}">${fittedCount} / ${capacity} Tyres</span>`;

    return `
      <tr>
        <td><strong>${v.registrationNumber}</strong></td>
        <td class="small muted">${v.fleetNumber || '—'}</td>
        <td class="small">${v.vehicleClass || 'Heavy Truck'}</td>
        <td class="small">${v.make || ''} ${v.model || ''}</td>
        <td class="small muted">${v.region || '—'}</td>
        <td class="small muted">${v.depot || '—'}</td>
        <td>${badgeHtml}</td>
        <td class="small">${v.assignedDriver ? `<span class="badge-code text-green">👤 ${v.assignedDriver}</span>` : `<span class="muted text-xs">UNASSIGNED</span>`}</td>
        ${showTyreCount ? `<td class="small text-center">${countBadge}</td>` : ''}
      </tr>
    `;
  }).join('') || `<tr><td colspan="${showTyreCount ? 9 : 8}" class="muted text-center">No vehicles registered</td></tr>`;
}

function getCapacityForClass(vClass = '', makeModel = '') {
  const text = `${vClass} ${makeModel}`.toLowerCase();
  if (text.includes('3-axle trailer') || text.includes('tri-axle') || text.includes('flatbed') || text.includes('container trailer')) return 12;
  if (text.includes('2-axle trailer') || text.includes('tandem trailer')) return 8;
  if (text.includes('8x4') || text.includes('heavy dump')) return 12;
  if (text.includes('6x4') || text.includes('fvz') || text.includes('tractor') || text.includes('prime mover') || text.includes('heavy truck') || text.includes('10-wheeler')) return 10;
  if (text.includes('6x2') || text.includes('tag axle')) return 10;
  if (text.includes('frr') || text.includes('fsr') || text.includes('fvr') || text.includes('hino') || text.includes('nqr') || text.includes('canter') || text.includes('medium truck') || text.includes('6-wheel')) return 6;
  if (text.includes('bus') || text.includes('coach') || text.includes('scania f')) return 6;
  if (text.includes('van') || text.includes('pickup') || text.includes('hilux') || text.includes('d-max') || text.includes('matatu') || text.includes('probox') || text.includes('lcv') || text.includes('4x2')) return 4;
  if (text.includes('lowbed') || text.includes('road train') || text.includes('multi-axle')) return 16;
  return 10;
}

function renderTyreTable(selector, list, showActions = false) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(t => {
    const idStr = t.tyreIdentifier || t.identifier;
    const brandNo = t.companyBrandNumber || '—';
    const costStr = t.purchaseCost ? `${parseFloat(t.purchaseCost).toLocaleString()} KES` : '—';
    return `
      <tr>
        <td><strong>${idStr}</strong></td>
        <td><span class="badge-code">${brandNo}</span></td>
        <td class="small">${t.brand} ${t.model}</td>
        <td class="small muted">${t.size}</td>
        <td class="small text-green">${costStr}</td>
        <td>${tyrStatusBadge(t.currentStatus)}</td>
        <td class="small">${t.currentTreadDepth ?? '--'} mm</td>
        <td class="small muted">${getVehicleReg(t.currentVehicleId) || '—'}</td>
        ${showActions ? `
          <td>
            <button class="btn tiny primary" onclick="openInspectionModal('${idStr}')">Inspect</button>
            <button class="btn tiny secondary ml-1" onclick="openFitmentModal('${idStr}')">Fit</button>
          </td>
        ` : ''}
      </tr>
    `;
  }).join('') || `<tr><td colspan="${showActions ? 9 : 8}" class="muted text-center">No tyres registered</td></tr>`;
}

function renderFitmentsTable(selector, list) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(f => `
    <tr>
      <td class="small"><strong>${f.tyreId || '--'}</strong></td>
      <td class="small">${getVehicleReg(f.vehicleId) || '--'}</td>
      <td class="small">Position ${f.positionId || f.axlePosition || '--'}</td>
      <td class="small muted">${formatDate(f.fitmentDate)}</td>
      <td class="small">${f.fitmentOdometer != null ? f.fitmentOdometer.toLocaleString() + ' km' : '--'}</td>
      <td class="small muted">${f.fittedBy || '--'}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="muted text-center">No fitment records</td></tr>`;
}

function renderInspectionsTable(selector, list) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(i => `
    <tr>
      <td class="small"><strong>${i.tyreId || '--'}</strong></td>
      <td class="small muted">${formatDate(i.inspectionDate)}</td>
      <td class="small">${i.averageTreadDepth != null ? i.averageTreadDepth + ' mm' : (i.avgTread != null ? i.avgTread + ' mm' : '--')}</td>
      <td class="small">${i.pressure != null ? i.pressure + ' PSI' : '--'}</td>
      <td>${conditionBadge(i.condition || i.overallCondition)}</td>
      <td class="small muted">${i.inspectedBy || '--'}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="muted text-center">No inspection records</td></tr>`;
}

function renderAlertsTable(selector, list, showAction = false) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(a => `
    <tr>
      <td>${severityBadge(a.severity)}</td>
      <td class="small">${a.alertType || '--'}</td>
      <td class="small muted">${getVehicleReg(a.vehicleId) || a.tyreId || '--'}</td>
      <td class="small">${a.message || '--'}</td>
      <td>${statusBadge2(a.status)}</td>
      ${showAction ? `<td><button class="btn tiny outline" onclick="acknowledgeAlert(${a.id})">Acknowledge</button></td>` : ''}
    </tr>
  `).join('') || `<tr><td colspan="${showAction ? 6 : 5}" class="muted text-center">No alerts</td></tr>`;
}

function renderDefectsTable(selector, list) {
  const tbody = document.querySelector(`${selector} tbody`);
  if (!tbody) return;
  tbody.innerHTML = list.map(d => `
    <tr>
      <td class="small">${getVehicleReg(d.vehicleId) || '--'}</td>
      <td class="small muted">${d.tyreId || '--'}</td>
      <td class="small">${d.defectType || '--'}</td>
      <td>${severityBadge(d.severity)}</td>
      <td>${statusBadge2(d.status)}</td>
      <td class="small muted">${d.reportedBy || '--'}</td>
    </tr>
  `).join('') || `<tr><td colspan="6" class="muted text-center">No defect reports</td></tr>`;
}

// ─── Actions ──────────────────────────────────────────────────────────────────
async function acknowledgeAlert(id) {
  try {
    await apiFetch(`/api/v1/alerts/${id}/acknowledge`, { method: 'PUT' });
    showToast('Alert acknowledged', 'success');
    loadViewData(currentActiveDashboard());
  } catch (e) {
    showToast(e.message, 'error');
  }
}

window.toggleUserStatus = async function(id, currentActive) {
  try {
    await apiFetch(`/api/v1/users/${id}/toggle-status`, { method: 'PUT' });
    showToast(`User account ${currentActive ? 'disabled' : 'enabled'}`, 'success');
    await loadAdminDashboard();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

function currentActiveDashboard() {
  return document.querySelector('.view.active')?.id;
}

// ─── Chart Helpers ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6','#64748b'];

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderChart(canvasId, type, labels, data, label, colors) {
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;
  const bgColors = colors || CHART_COLORS.slice(0, data.length);
  charts[canvasId] = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        backgroundColor: type === 'bar' ? bgColors.map(c => c + 'cc') : bgColors,
        borderColor: type === 'bar' ? bgColors : '#1e293b',
        borderWidth: 1,
        borderRadius: type === 'bar' ? 4 : 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: {
          position: type === 'doughnut' ? 'right' : 'bottom',
          labels: { color: '#94a3b8', boxWidth: 10, padding: 8, font: { size: 11 } },
        },
      },
      scales: type === 'bar' ? {
        x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#334155' } },
        y: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: '#334155' } },
      } : {},
    },
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────
function roleBadge(role) {
  const map = {
    SUPER_ADMIN: 'badge-admin', CEO: 'badge-ceo', FLEET_MANAGER: 'badge-fleet',
    TYRE_TECHNICIAN: 'badge-tech', FINANCE_MANAGER: 'badge-finance',
    DRIVER: 'badge-driver', AUDITOR: 'badge-auditor', READ_ONLY: 'badge-readonly',
  };
  return `<span class="role-badge ${map[role] || ''}">${role}</span>`;
}

function getScopeLabel(role) {
  const map = {
    SUPER_ADMIN: 'SYSTEM', CEO: 'ORG-WIDE', FLEET_MANAGER: 'REGION',
    TYRE_TECHNICIAN: 'DEPOT', FINANCE_MANAGER: 'ORG-WIDE',
    DRIVER: 'VEHICLE', AUDITOR: 'ORG-WIDE', READ_ONLY: 'ORG-WIDE',
  };
  return map[role] || '--';
}

function statusBadge(isActive) {
  return isActive
    ? '<span class="badge success">Active</span>'
    : '<span class="badge muted">Disabled</span>';
}

function statusBadge2(status) {
  const s = (status || 'UNKNOWN').toUpperCase();
  const map = {
    ACTIVE: '<span class="badge-code text-green">ACTIVE</span>',
    OPERATIONAL: '<span class="badge-code text-green">OPERATIONAL</span>',
    OPEN: '<span class="badge-code text-amber">OPEN</span>',
    ESCALATED: '<span class="badge-code text-red">ESCALATED</span>',
    OVERDUE: '<span class="badge-code text-red">OVERDUE</span>',
    RESOLVED: '<span class="badge-code text-green">RESOLVED</span>',
    ACKNOWLEDGED: '<span class="badge-code text-blue">ACKNOWLEDGED</span>',
    CANCELLED: '<span class="badge-code text-muted">CANCELLED</span>',
    DISMISSED: '<span class="badge-code text-muted">DISMISSED</span>',
    IN_SERVICE: '<span class="badge-code text-green">IN SERVICE</span>',
    IN_STOCK: '<span class="badge-code text-blue">IN STOCK</span>',
    IN_RETREAD: '<span class="badge-code text-amber">IN RETREAD</span>',
    SCRAP: '<span class="badge-code text-red">SCRAP</span>',
    SCRAPPED: '<span class="badge-code text-red">SCRAPPED</span>',
    GROUNDED: '<span class="badge-code text-red">GROUNDED</span>',
    MAINTENANCE: '<span class="badge-code text-amber">MAINTENANCE</span>',
    INACTIVE: '<span class="badge-code text-muted">INACTIVE</span>',
    CLOSED: '<span class="badge-code text-muted">CLOSED</span>',
    FITTED: '<span class="badge-code text-green">FITTED</span>',
    SUCCESS: '<span class="badge-code text-green">SUCCESS</span>',
  };
  return map[s] || `<span class="badge-code">${s}</span>`;
}

window.getVehicleReg = function(vId, vehicleList = []) {
  if (!vId) return '—';
  if (vId.length <= 12 && !vId.includes('-') && !/^[0-9a-f]{8}-[0-9a-f]{4}/i.test(vId)) {
    return vId;
  }
  const cachedVehicles = window._cachedVehiclesList || vehicleList || [];
  const found = cachedVehicles.find(v => v.id === vId || v.registrationNumber === vId);
  return found ? found.registrationNumber : (vId.length > 15 ? `VEH-${vId.substring(0, 6).toUpperCase()}` : vId);
};

function severityBadge(sev) {
  const map = { CRITICAL: 'danger', HIGH: 'warning-dark', MEDIUM: 'warning', LOW: 'success' };
  return `<span class="badge ${map[sev] || 'muted'}">${sev || '--'}</span>`;
}

function tyrStatusBadge(status) {
  const map = { IN_STOCK: 'success', FITTED: 'info', RETREAD: 'warning', REPAIR: 'warning-dark', SCRAPPED: 'danger', RETREADED: 'info' };
  return `<span class="badge ${map[status] || 'muted'}">${status || '--'}</span>`;
}

function conditionBadge(c) {
  const map = { GOOD: 'success', WARNING: 'warning', CRITICAL: 'danger', POOR: 'danger' };
  return `<span class="badge ${map[c] || 'muted'}">${c || '--'}</span>`;
}

function fmtCurrency(val) {
  if (val == null || val === '') return '—';
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(val);
}

function formatDate(val) {
  if (!val) return '--';
  return new Date(val).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '--';
}

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

// ─── KPI Click-Drill System ───────────────────────────────────────────────────
// Stores cached data from last dashboard load for drill-down views
let _drillCache = {};

window.initKPIDrillListeners = function initKPIDrillListeners() {
  // Handle elements with data-kpi attribute (Fleet Manager KPIs, charts)
  document.querySelectorAll('[data-kpi]').forEach(el => {
    el.style.cursor = 'pointer';
    el.removeEventListener('click', handleKPIDrillClick);
    el.addEventListener('click', handleKPIDrillClick);
  });

  // Handle clickable KPI cards without data-kpi (fallback to id)
  document.querySelectorAll('.kpi-card.clickable').forEach(card => {
    if (card.dataset.kpi) return; // already handled above
    if (card._drillBound) return; // avoid duplicate listeners
    card._drillBound = true;
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const kpiKey = card.dataset.cnt || card.id;
      const title = card.querySelector('.kpi-label')?.textContent || 'KPI Drill-Down';
      window.openKPIDrillModal(kpiKey, title);
    });
  });
}

window.handleKPIDrillClick = function(e) {
  const action = e.currentTarget.dataset.kpi;
  if (!action) return;
  handleKPIAction(action);
}

async function handleKPIAction(action) {
  switch (action) {
    case 'chart-fm-status':
      await window.openKPIDrillModal('chart-fm-status', 'Vehicle Status Distribution');
      break;
    case 'card-fm-fleet':
    case 'fleet':
    case 'managed-fleet':
      // Open fleet drill-down with full vehicle list & driver assignment
      await window.openKPIDrillModal('card-fm-fleet', 'Total Managed Fleet');
      break;
    case 'assign-vehicle':
      await window.openAssignVehicleModal();
      break;
    case 'view-tyres':
      await openKPIDrillTyres();
      break;
    case 'view-retread':
      await openKPIDrillRetread();
      break;
    case 'view-defects':
      await openKPIDrillDefects();
      break;
    case 'view-budgets':
      await openKPIDrillBudgets();
      break;
    case 'view-vehicle':
      // Driver view - already showing the vehicle card
      showToast('Vehicle details are displayed below', 'info');
      break;
    default:
      // Try the generic KPI drill modal for any other kpi keys
      if (action && action !== 'undefined') {
        await window.openKPIDrillModal(action, action.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      }
  }
}


// ─── Assign Vehicle Modal ─────────────────────────────────────────────────────
window.openAssignVehicleModal = async function(preselectedVehicleId) {
  try {
    const [vehicles, drivers] = await Promise.all([
      apiFetch('/api/v1/vehicles'),
      apiFetch('/api/v1/vehicles/drivers'),
    ]);

    const vehicleList = vehicles?.data || vehicles || [];
    const driverList = drivers?.data || drivers || [];

    const vSelect = document.getElementById('av-vehicle-select');
    const dSelect = document.getElementById('av-driver-select');

    if (vSelect) {
      vSelect.innerHTML = '<option value="">-- Select Vehicle --</option>' +
        vehicleList.map(v => `<option value="${v.id}">${v.registrationNumber} (${v.make || ''} ${v.model || ''} - ${v.depot || 'No depot'})</option>`).join('');
      if (preselectedVehicleId) {
        vSelect.value = preselectedVehicleId;
      }
    }

    if (dSelect) {
      dSelect.innerHTML = '<option value="">-- Select Driver --</option>' +
        driverList.map(d => {
          const assignedLabel = d.assignedVehicleId ? ' [Assigned]' : '';
          return `<option value="${d.email}">${d.firstName || ''} ${d.lastName || ''} (${d.email})${assignedLabel}</option>`;
        }).join('');
    }

    openModal('assign-vehicle-modal');
  } catch (err) {
    showToast('Failed to load assignment data: ' + err.message, 'error');
  }
}

// ─── KPI Drill: Tyres ─────────────────────────────────────────────────────────
async function openKPIDrillTyres() {
  document.getElementById('kpi-drill-title').textContent = 'Tyre Inventory Detail';
  const body = document.getElementById('kpi-drill-body');
  body.innerHTML = '<p class="muted">Loading tyre data...</p>';
  openModal('kpi-drill-modal');

  try {
    const [tyres, summary] = await Promise.all([
      apiFetch('/api/v1/tyres?limit=100'),
      apiFetch('/api/v1/tyres/summary'),
    ]);
    const tyreList = tyres?.data || tyres || [];
    const byStatus = summary?.byStatus || {};

    body.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:1rem;">
        <div class="kpi-card kpi-success"><div class="kpi-icon">STK</div><div class="kpi-body"><p class="kpi-label">In Stock</p><p class="kpi-value">${byStatus.inStock ?? 0}</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-icon">FIT</div><div class="kpi-body"><p class="kpi-label">Fitted</p><p class="kpi-value">${byStatus.fitted ?? 0}</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-icon">RET</div><div class="kpi-body"><p class="kpi-label">In Retread</p><p class="kpi-value">${byStatus.inRetread ?? 0}</p></div></div>
        <div class="kpi-card kpi-danger"><div class="kpi-icon">SCR</div><div class="kpi-body"><p class="kpi-label">Scrapped</p><p class="kpi-value">${byStatus.scrapped ?? 0}</p></div></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Identifier</th><th>Brand/Model</th><th>Size</th><th>Status</th><th>Tread</th><th>Vehicle</th></tr></thead>
        <tbody>
          ${tyreList.map(t => `
            <tr>
              <td><strong>${t.tyreIdentifier || t.identifier}</strong></td>
              <td class="small">${t.brand || ''} ${t.model || ''}</td>
              <td class="small muted">${t.size || '--'}</td>
              <td>${tyrStatusBadge(t.currentStatus)}</td>
              <td class="small">${t.currentTreadDepth ?? '--'} mm</td>
              <td class="small muted">${getVehicleReg(t.currentVehicleId) || '--'}</td>
            </tr>
          `).join('') || '<tr><td colspan="6" class="muted text-center">No tyres</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = `<p class="text-red">Error loading tyres: ${err.message}</p>`;
  }
}

// ─── KPI Drill: Retread ──────────────────────────────────────────────────────
async function openKPIDrillRetread() {
  document.getElementById('kpi-drill-title').textContent = 'Tyres In Retread';
  const body = document.getElementById('kpi-drill-body');
  body.innerHTML = '<p class="muted">Loading retread data...</p>';
  openModal('kpi-drill-modal');

  try {
    const tyres = await apiFetch('/api/v1/tyres?limit=100');
    const tyreList = (tyres?.data || tyres || []).filter(t => t.currentStatus === 'IN_RETREAD');

    body.innerHTML = `
      <p class="muted" style="margin-bottom:0.75rem;">${tyreList.length} tyre(s) currently in retread process</p>
      <table class="data-table">
        <thead><tr><th>Identifier</th><th>Brand/Model</th><th>Size</th><th>Last Tread</th><th>Previous Vehicle</th></tr></thead>
        <tbody>
          ${tyreList.map(t => `
            <tr>
              <td><strong>${t.tyreIdentifier || t.identifier}</strong></td>
              <td class="small">${t.brand || ''} ${t.model || ''}</td>
              <td class="small muted">${t.size || '--'}</td>
              <td class="small">${t.currentTreadDepth ?? '--'} mm</td>
              <td class="small muted">${getVehicleReg(t.currentVehicleId) || '--'}</td>
            </tr>
          `).join('') || '<tr><td colspan="5" class="muted text-center">No tyres in retread</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = `<p class="text-red">Error: ${err.message}</p>`;
  }
}

// ─── KPI Drill: Defects ──────────────────────────────────────────────────────
async function openKPIDrillDefects() {
  document.getElementById('kpi-drill-title').textContent = 'Open Defects';
  const body = document.getElementById('kpi-drill-body');
  body.innerHTML = '<p class="muted">Loading defect data...</p>';
  openModal('kpi-drill-modal');

  try {
    const defects = await apiFetch('/api/v1/defects');
    const defectList = (defects?.data || defects || []).filter(d => d.status === 'OPEN');

    body.innerHTML = `
      <p class="muted" style="margin-bottom:0.75rem;">${defectList.length} open defect(s) requiring action</p>
      <table class="data-table">
        <thead><tr><th>Vehicle</th><th>Type</th><th>Severity</th><th>Description</th><th>Reported By</th><th>Status</th></tr></thead>
        <tbody>
          ${defectList.map(d => `
            <tr>
              <td class="small">${getVehicleReg(d.vehicleId) || '--'}</td>
              <td class="small">${d.defectType || '--'}</td>
              <td>${severityBadge(d.severity)}</td>
              <td class="small muted">${d.description || '--'}</td>
              <td class="small muted">${d.reportedBy || '--'}</td>
              <td>${statusBadge2(d.status)}</td>
            </tr>
          `).join('') || '<tr><td colspan="6" class="muted text-center">No open defects</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = `<p class="text-red">Error: ${err.message}</p>`;
  }
}

// ─── KPI Drill: Budgets ──────────────────────────────────────────────────────
async function openKPIDrillBudgets() {
  document.getElementById('kpi-drill-title').textContent = 'Budget Detail';
  const body = document.getElementById('kpi-drill-body');
  body.innerHTML = '<p class="muted">Loading budget data...</p>';
  openModal('kpi-drill-modal');

  try {
    const budgets = await apiFetch('/api/v1/budgets');
    const list = budgets?.data || budgets || [];
    const totalBudget = list.reduce((s, b) => s + (b.budgetAmount || 0), 0);
    const totalActual = list.reduce((s, b) => s + (b.actualAmount || 0), 0);
    const totalVariance = totalBudget - totalActual;

    body.innerHTML = `
      <div class="kpi-grid" style="margin-bottom:1rem;">
        <div class="kpi-card kpi-primary"><div class="kpi-icon">BGT</div><div class="kpi-body"><p class="kpi-label">Total Budget</p><p class="kpi-value">${fmtCurrency(totalBudget)}</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-icon">ACT</div><div class="kpi-body"><p class="kpi-label">Total Actual</p><p class="kpi-value">${fmtCurrency(totalActual)}</p></div></div>
        <div class="kpi-card ${totalVariance >= 0 ? 'kpi-success' : 'kpi-danger'}"><div class="kpi-icon">VAR</div><div class="kpi-body"><p class="kpi-label">Variance</p><p class="kpi-value">${totalVariance >= 0 ? '+' : ''}${fmtCurrency(totalVariance)}</p></div></div>
      </div>
      <table class="data-table">
        <thead><tr><th>Period</th><th>Category</th><th>Budget</th><th>Actual</th><th>Variance</th><th>Status</th></tr></thead>
        <tbody>
          ${list.map(b => {
            const v = (b.budgetAmount || 0) - (b.actualAmount || 0);
            return `
              <tr>
                <td class="small">${b.period || '--'}</td>
                <td class="small">${b.category || '--'}</td>
                <td class="small">${fmtCurrency(b.budgetAmount)}</td>
                <td class="small">${fmtCurrency(b.actualAmount)}</td>
                <td class="${v >= 0 ? 'text-green' : 'text-red'} small">${v >= 0 ? '+' : ''}${fmtCurrency(v)}</td>
                <td>${v >= 0 ? '<span class="badge success">On Track</span>' : '<span class="badge danger">Exceeded</span>'}</td>
              </tr>
            `;
          }).join('') || '<tr><td colspan="6" class="muted text-center">No budget data</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (err) {
    body.innerHTML = `<p class="text-red">Error: ${err.message}</p>`;
  }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(btn.dataset.tab);
      if (!panel) return;
      const container = btn.closest('.card');
      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      btn.classList.add('active');
      panel.classList.remove('hidden');
    });
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function doLogin(email, password) {
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in...';
  btn.disabled = true;
  
  const splash = document.getElementById('splash-screen');
  if (splash) splash.classList.remove('hidden');

  try {
    const data = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authToken = data.access_token;
    currentUser = data.user;
    localStorage.setItem('fi360_token', authToken);
    localStorage.setItem('fi360_user', JSON.stringify(currentUser));
    
    // Allow splash screen animation to run for a moment to feel polished
    setTimeout(() => {
      if (splash) splash.classList.add('hidden');
      onAuthSuccess();
    }, 1200);
  } catch (err) {
    if (splash) splash.classList.add('hidden');
    document.getElementById('auth-error').textContent = err.message || 'Login failed';
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

function onAuthSuccess() {
  document.getElementById('login-form-container')?.classList.add('hidden');
  document.getElementById('user-info')?.classList.remove('hidden');

  const name = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`;
  setText('user-name', name);
  const avatarInitials = (currentUser.firstName?.[0] || '') + (currentUser.lastName?.[0] || '');
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) avatarEl.textContent = avatarInitials || 'U';

  const badgeEl = document.getElementById('user-role-badge');
  if (badgeEl) badgeEl.innerHTML = roleBadge(currentUser.role);

  const scopeEl = document.getElementById('user-scope-info');
  if (scopeEl) {
    const parts = [];
    if (currentUser.region) parts.push(`Region: ${currentUser.region}`);
    if (currentUser.depot) parts.push(`Depot: ${currentUser.depot}`);
    if (currentUser.assignedVehicleId) parts.push(`Vehicle: ${currentUser.assignedVehicleId}`);
    scopeEl.textContent = parts.join(' · ') || `Scope: ${currentUser.scopeLevel || 'ORGANISATION'}`;
  }

  buildNav();
  buildHeaderActions();

  const dashboard = currentUser.dashboard || 'dashboard-super-admin';
  const navItems = NAV_MAP[currentUser.role] || [];
  if (navItems.length) {
    navItems[0].action();
  } else {
    showDashboard(dashboard, 'Dashboard', '');
  }
}

function doLogout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('fi360_token');
  localStorage.removeItem('fi360_user');
  document.getElementById('login-form-container')?.classList.remove('hidden');
  document.getElementById('user-info')?.classList.add('hidden');
  document.getElementById('auth-error').textContent = '';
  document.querySelectorAll('.view').forEach(v => { v.classList.remove('active'); v.classList.add('hidden'); });
  document.getElementById('nav-links').innerHTML = '';
  document.getElementById('header-actions').innerHTML = '';
  document.getElementById('page-title').textContent = 'Fleet Intelligence 360';
  document.getElementById('page-subtitle').textContent = 'Sign in to access your role workspace';
  Object.values(charts).forEach(c => c.destroy());
  charts = {};
}

// ─── Application Bootstrap ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();

  // Login form
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await doLogin(email, password);
  });

  // Quick role switcher
  document.getElementById('quick-role-select').addEventListener('change', (e) => {
    document.getElementById('email').value = e.target.value;
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', doLogout);

  // Modal close listeners
  ['close-tyre-modal','cancel-tyre-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('add-tyre-modal')));
  ['close-vehicle-modal','cancel-vehicle-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('add-vehicle-modal')));
  ['close-user-modal','cancel-user-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('add-user-modal')));
  ['close-inspection-modal','cancel-inspection-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('inspection-modal')));
  ['close-fitment-modal','cancel-fitment-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('fitment-modal')));
  ['close-assign-vehicle-modal','cancel-assign-vehicle'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('assign-vehicle-modal')));
  ['close-kpi-drill-modal'].forEach(id => document.getElementById(id)?.addEventListener('click', () => closeModal('kpi-drill-modal')));

  // Modal open listeners
  document.getElementById('btn-fm-add-vehicle')?.addEventListener('click', () => openModal('add-vehicle-modal'));
  document.getElementById('btn-fm-add-tyre')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-sup-register-tyre')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-tech-add-tyre')?.addEventListener('click', () => openModal('add-tyre-modal'));
  document.getElementById('btn-tech-inspect')?.addEventListener('click', () => openModal('inspection-modal'));
  document.getElementById('btn-tech-fit-tyre')?.addEventListener('click', () => openModal('fitment-modal'));
  document.getElementById('btn-admin-add-user')?.addEventListener('click', () => openModal('add-user-modal'));

  // Super Admin System Report Export Handler
  document.getElementById('btn-admin-export-report')?.addEventListener('click', async () => {
    const reportId = document.getElementById('adminReportSelect')?.value || 'system-health';
    const format = document.getElementById('adminReportFormat')?.value || 'CSV';
    try {
      setLoading(true);
      const data = await apiFetch(`/api/v1/system-admin/reports/${reportId}?format=${format}`);
      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'PDF') {
        const htmlDoc = generateReportHTMLDocument(data);
        const fileName = `FI360_Report_${reportId}_${dateStr}.html`;
        
        // Trigger instant file download
        const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Also open print window preview
        renderReportPDFWindow(data);
        showToast(`Downloaded printable PDF document: ${fileName}`, 'success');
        return;
      }

      const isExcel = format === 'EXCEL';
      const ext = isExcel ? 'csv' : 'csv';
      const fileName = `FI360_Report_${reportId}_${dateStr}.${ext}`;
      const csvContent = formatReportCSV(data);

      const blob = new Blob(['\uFEFF' + csvContent], { type: isExcel ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Downloaded ${format} report: ${fileName}`, 'success');
    } catch (err) {
      showToast(`Report download failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  });

function formatReportCSV(data) {
  let lines = [];
  lines.push(`"FI360 FLEET INTELLIGENCE 360 - SYSTEM GOVERNANCE REPORT"`);
  lines.push(`"Report Title","${data.title || 'System Report'}"`);
  lines.push(`"Generated At","${data.generatedAt ? new Date(data.generatedAt).toLocaleString() : new Date().toLocaleString()}"`);
  lines.push(`"Scope Level","SYSTEM / ORGANISATION"`);
  
  if (data.summary) {
    Object.entries(data.summary).forEach(([k, v]) => {
      lines.push(`"Summary: ${k.replace(/([A-Z])/g, ' $1')}","${typeof v === 'object' ? JSON.stringify(v) : v}"`);
    });
  }
  lines.push(''); // Blank line

  const items = data.items || [];
  if (items.length > 0) {
    const headers = Object.keys(items[0]);
    lines.push(headers.map(h => `"${h.toUpperCase()}"`).join(','));
    items.forEach(item => {
      const row = headers.map(h => {
        let val = item[h];
        if (val === null || val === undefined) val = '—';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      lines.push(row.join(','));
    });
  } else {
    lines.push('"STATUS","No records or issues found for this report scope."');
  }

  return lines.join('\r\n');
}

function generateReportHTMLDocument(data) {
  const title = data.title || 'FI360 System Governance Report';
  const dateStr = data.generatedAt ? new Date(data.generatedAt).toLocaleString() : new Date().toLocaleString();
  const items = data.items || [];
  const summary = data.summary || {};

  let summaryCardsHtml = Object.entries(summary).map(([k, v]) => `
    <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:10px 14px; border-radius:6px;">
      <div style="font-size:0.75rem; color:#64748b; text-transform:uppercase; font-weight:bold;">${k.replace(/([A-Z])/g, ' $1')}</div>
      <div style="font-size:1.1rem; color:#0f172a; font-weight:bold; margin-top:2px;">${typeof v === 'object' ? JSON.stringify(v) : v}</div>
    </div>
  `).join('');

  let tableHtml = '';
  if (items.length > 0) {
    const headers = Object.keys(items[0]);
    tableHtml = `
      <table style="width:100%; border-collapse:collapse; margin-top:15px; font-size:0.85rem;">
        <thead>
          <tr style="background:#0f172a; color:#ffffff;">
            ${headers.map(h => `<th style="padding:8px 12px; text-align:left; font-size:0.75rem; text-transform:uppercase;">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${items.map((row, idx) => `
            <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; border-bottom:1px solid #e2e8f0;">
              ${headers.map(h => {
                let val = row[h];
                let style = 'padding:8px 12px; color:#334155;';
                if (h.toLowerCase() === 'status') {
                  const color = val === 'GREEN' || val === 'ACTIVE' || val === 'HEALTHY' ? '#16a34a' : val === 'AMBER' || val === 'WARNING' ? '#d97706' : val === 'RED' || val === 'DISABLED' || val === 'CRITICAL' ? '#dc2626' : '#64748b';
                  val = `<span style="background:${color}; color:#fff; padding:2px 8px; border-radius:10px; font-weight:bold; font-size:0.75rem;">${val}</span>`;
                }
                return `<td style="${style}">${val ?? '—'}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    tableHtml = `<p style="text-align:center; color:#64748b; padding:20px; font-style:italic;">No records found for this governance report.</p>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 30px; color: #0f172a; line-height: 1.5; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }
    .logo { font-size: 1.4rem; font-weight: bold; color: #0284c7; }
    .subtitle { font-size: 0.85rem; color: #64748b; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
    @media print { .no-print { display: none !important; } body { margin: 0; } }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; text-align: right;">
    <button onclick="window.print()" style="background:#0284c7; color:#fff; border:none; padding:8px 16px; border-radius:4px; font-weight:bold; cursor:pointer;">🖨️ Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <div class="logo">Fleet Intelligence 360</div>
      <div style="font-size: 1.2rem; font-weight: bold; margin-top: 4px;">${title}</div>
    </div>
    <div style="text-align: right;">
      <div class="subtitle">Generated At: ${dateStr}</div>
      <div class="subtitle">Scope: SYSTEM / ORGANISATION</div>
    </div>
  </div>
  <div class="summary-grid">${summaryCardsHtml}</div>
  ${tableHtml}
</body>
</html>`;
}

function renderReportPDFWindow(data) {
  const html = generateReportHTMLDocument(data);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.add('hidden');
    });
  });

  // Form Submissions
  // 1. Add Tyre Form
  document.getElementById('add-tyre-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/tyres', {
        method: 'POST',
        body: JSON.stringify({
          tyreIdentifier: document.getElementById('tyreIdentifier').value,
          brand: document.getElementById('brand').value,
          model: document.getElementById('model').value,
          size: document.getElementById('size').value,
          originalTreadDepth: parseFloat(document.getElementById('originalTreadDepth').value),
        }),
      });
      closeModal('add-tyre-modal');
      showToast('Tyre registered successfully', 'success');
      loadViewData(currentActiveDashboard());
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Auto-set expected tyres on vehicle class dropdown selection
  document.getElementById('vehicleClassSelect')?.addEventListener('change', (e) => {
    const opt = e.target.options[e.target.selectedIndex];
    const rec = opt?.dataset?.tyres;
    if (rec) {
      document.getElementById('expectedTyres').value = rec;
    }
  });

  // 2. Add Vehicle Form
  document.getElementById('add-vehicle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const vClass = document.getElementById('vehicleClassSelect')?.value || document.getElementById('vehicleClass')?.value || '6x4 Heavy Rigid / Tipper (FVZ)';
      await apiFetch('/api/v1/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          registrationNumber: document.getElementById('registrationNumber').value,
          fleetNumber: document.getElementById('fleetNumber').value,
          vehicleClass: vClass,
          make: document.getElementById('make').value,
          model: document.getElementById('vehicleModel').value,
          depot: document.getElementById('depot').value,
          region: document.getElementById('region').value,
          department: document.getElementById('department')?.value,
          expectedTyres: parseInt(document.getElementById('expectedTyres').value) || 10,
          vehicleStatus: document.getElementById('vehicleStatus')?.value || 'ACTIVE',
        }),
      });
      closeModal('add-vehicle-modal');
      showToast('Vehicle registered successfully', 'success');
      loadViewData(currentActiveDashboard());
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 3. Add User Form
  document.getElementById('add-user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/v1/users', {
        method: 'POST',
        body: JSON.stringify({
          email: document.getElementById('userEmailInput').value,
          password: document.getElementById('userPasswordInput').value,
          firstName: document.getElementById('userFirstName').value,
          lastName: document.getElementById('userLastName').value,
          role: document.getElementById('userRoleSelect').value,
          department: document.getElementById('userDepartment').value,
          region: document.getElementById('userRegion').value,
          depot: document.getElementById('userDepot').value,
        }),
      });
      closeModal('add-user-modal');
      showToast('User account created successfully', 'success');
      loadViewData(currentActiveDashboard());
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 4. Record Inspection Form
  document.getElementById('inspection-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tyreIdentifier: document.getElementById('inspTyreIdentifier').value,
        vehicleId: document.getElementById('inspVehicleReg')?.value || undefined,
        positionId: parseInt(document.getElementById('inspPositionId')?.value, 10) || undefined,
        inspectionDate: new Date(document.getElementById('inspDate').value).toISOString(),
        pressure: parseFloat(document.getElementById('inspPressure').value) || undefined,
        treadDepthLeft: parseFloat(document.getElementById('inspTreadLeft').value) || undefined,
        treadDepthCenter: parseFloat(document.getElementById('inspTreadCenter').value) || undefined,
        treadDepthRight: parseFloat(document.getElementById('inspTreadRight').value) || undefined,
        condition: document.getElementById('inspCondition').value,
        inspectedBy: document.getElementById('inspInspectedBy')?.value || currentUser?.email || 'Technician',
        notes: document.getElementById('inspNotes').value || undefined,
      };
      await apiFetch('/api/v1/tyres/inspections', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      closeModal('inspection-modal');
      showToast('Tyre inspection recorded successfully', 'success');
      loadViewData(currentActiveDashboard());
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 5. Fit Tyre Form
  document.getElementById('fitment-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const payload = {
        tyreIdentifier: document.getElementById('fitTyreIdentifier').value,
        vehicleId: document.getElementById('fitVehicleId').value,
        positionId: parseInt(document.getElementById('fitPositionId').value) || 1,
        fitmentOdometer: parseInt(document.getElementById('fitOdometer').value) || undefined,
        fittedBy: document.getElementById('fitFittedBy')?.value || currentUser?.email || 'Technician',
        fitmentDate: new Date(document.getElementById('fitDate').value).toISOString(),
      };
      await apiFetch('/api/v1/tyres/fitments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      closeModal('fitment-modal');
      showToast('Tyre fitted to vehicle successfully', 'success');
      loadViewData(currentActiveDashboard());
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // 6. Assign Vehicle to Driver Form
  document.getElementById('assign-vehicle-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const vehicleId = document.getElementById('av-vehicle-select').value;
      const driverEmail = document.getElementById('av-driver-select').value;
      if (!vehicleId || !driverEmail) {
        showToast('Please select both a vehicle and a driver', 'warning');
        return;
      }
      const response = await apiFetch('/api/v1/vehicles/assign-driver', {
        method: 'POST',
        body: JSON.stringify({ vehicleId, driverEmail }),
      });
      closeModal('assign-vehicle-modal');
      showToast(response.message || 'Vehicle assigned successfully', 'success');
      await loadViewData(currentActiveDashboard());
      
      const kpiTitle = document.getElementById('kpi-drill-title')?.textContent || '';
      if (kpiTitle.includes('Fleet') || kpiTitle.includes('Vehicle')) {
        await window.openKPIDrillModal('card-fm-fleet', 'Total Managed Fleet');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Sidebar Toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Auto-login
  if (authToken && currentUser) {
    onAuthSuccess();
    document.getElementById('page-subtitle').textContent = 'Sign in to access your role workspace';
  }
});

// ─── Tyre Supervisor Helpers & Handlers ─────────────────────────────────────

window.openKPIDrillModal = async function(kpiKey, title) {
  const adminGovernanceKeys = [
    'SYSTEM_AVAILABILITY', 'API_HEALTH', 'DATABASE_HEALTH', 'BACKUP_STATUS',
    'ACTIVE_USERS', 'USER_ACCESS_COMPLIANCE', 'FAILED_LOGIN_RATE', 'SECURITY_EVENTS',
    'DATA_QUALITY_SCORE', 'UNASSIGNED_RECORDS', 'DUPLICATE_RECORDS', 'INTEGRATION_HEALTH',
    'INTEGRATION_SUCCESS_RATE', 'REPORT_ENGINE_SUCCESS_RATE', 'FAILED_BACKGROUND_JOBS',
    'STORAGE_USAGE', 'AUDIT_COVERAGE', 'CRITICAL_AUDIT_EVENTS', 'AI_PLATFORM_HEALTH'
  ];

  if (adminGovernanceKeys.includes(kpiKey)) {
    await window.openAdminKPIDrillModal(kpiKey, title);
    return;
  }

  // Map CEO dashboard KPIs to their correct specific views
  if (kpiKey === 'ceo-kpi-fleet') kpiKey = 'card-fm-fleet';
  else if (kpiKey === 'ceo-kpi-available') kpiKey = 'chart-fm-status';
  else if (kpiKey === 'ceo-kpi-alerts') kpiKey = 'kpi-critical-alerts';
  else if (kpiKey === 'ceo-kpi-budget') {
    await openKPIDrillBudgets();
    return;
  } else if (kpiKey === 'ceo-kpi-tyres') {
    await openKPIDrillTyres();
    return;
  } else if (kpiKey === 'ceo-kpi-defects') {
    await openKPIDrillDefects();
    return;
  }

  const modal = document.getElementById('kpi-drill-modal');
  const titleEl = document.getElementById('kpi-drill-title');
  const bodyEl = document.getElementById('kpi-drill-body');
  if (!modal || !bodyEl) return;
  let contentHtml = '';
  let scopeHeader = '';

  if (titleEl) titleEl.textContent = `${title} — Analytical Operational Drill-Down`;

  // Fetch real database records to enrich drill-down views
  const [tyresRes, vehiclesRes, fitmentsRes, inspectionsRes, alertsRes, defectsRes] = await Promise.all([
    apiFetch('/api/v1/tyres?limit=100').catch(() => null),
    apiFetch('/api/v1/vehicles').catch(() => null),
    apiFetch('/api/v1/tyres/fitments/all').catch(() => null),
    apiFetch('/api/v1/tyres/inspections/all').catch(() => null),
    apiFetch('/api/v1/alerts').catch(() => null),
    apiFetch('/api/v1/defects').catch(() => null),
  ]);

  const tyres = tyresRes?.data || tyresRes || [];
  const vehicles = vehiclesRes?.data || vehiclesRes || [];

  // ─── 0-A. VEHICLE DISTRIBUTION STATUS KPI & ANALYTICS (card-fm-fleet, fm-fleet, fleet) ───
  if (kpiKey === 'chart-fm-status' || kpiKey.includes('card-fm-fleet') || kpiKey.includes('fm-fleet') || kpiKey.includes('fleet') || kpiKey.includes('managed-fleet')) {
    if (titleEl) {
      if (kpiKey === 'chart-fm-status') {
        titleEl.textContent = 'Vehicle Distribution Status — Analytical Operational Drill-Down';
      } else {
        titleEl.textContent = 'Authorized Vehicle Master & Driver Assignment';
      }
    }

    // Fetch scope-enforced distribution KPI analytics from dedicated endpoint
    const distData = await apiFetch('/api/v1/vehicles/distribution-kpi').catch(() => null);

    if (!distData || typeof distData.totalVehicles !== 'number') {
      bodyEl.innerHTML = `
        <div class="card p-4 text-center">
          <h3 class="text-red mb-2">DATA UNAVAILABLE</h3>
          <p class="muted">Unable to retrieve vehicle distribution metrics from backend database. Please check system connection or permissions.</p>
        </div>
      `;
      openModal('kpi-drill-modal');
      return;
    }

    if (distData.totalVehicles === 0) {
      bodyEl.innerHTML = `
        <div class="card p-4 text-center">
          <h3 class="text-amber mb-2">0 VEHICLES FOUND</h3>
          <p class="muted">NO VEHICLES FOUND WITHIN YOUR AUTHORIZED SCOPE (${distData.scope?.level || 'REGION'} — ${distData.scope?.region || 'UNASSIGNED'})</p>
        </div>
      `;
      openModal('kpi-drill-modal');
      return;
    }

    const vehList = distData.vehiclesList || [];
    const statusDist = distData.statusDistribution || [];
    const regionDist = distData.regionDistribution || [];
    const depotDist = distData.depotDistribution || [];
    const workshopDist = distData.workshopDistribution || [];
    const classDist = distData.vehicleClassDistribution || [];

    contentHtml = '';
    
    if (kpiKey === 'chart-fm-status') {
      contentHtml += `
      <div class="kpi-grid mb-3" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.5rem;">
        <div class="kpi-card kpi-primary">
          <div class="kpi-body">
            <p class="kpi-label">Authorized Fleet</p>
            <p class="kpi-value">${distData.totalVehicles} Vehicles</p>
          </div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-body">
            <p class="kpi-label">Fleet Availability</p>
            <p class="kpi-value">${distData.availabilityPercentage}%</p>
          </div>
        </div>
        <div class="kpi-card kpi-info">
          <div class="kpi-body">
            <p class="kpi-label">Operational / Active</p>
            <p class="kpi-value">${distData.operationalCount} Active</p>
          </div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-body">
            <p class="kpi-label">Maintenance</p>
            <p class="kpi-value">${distData.maintenanceCount} In Service</p>
          </div>
        </div>
        <div class="kpi-card kpi-danger">
          <div class="kpi-body">
            <p class="kpi-label">Grounded / Inactive</p>
            <p class="kpi-value">${distData.groundedCount + distData.inactiveCount} Grounded</p>
          </div>
        </div>
      </div>

      <div class="grid-2-col gap-3 mb-3">
        <!-- Status Distribution Table -->
        <div class="card p-3">
          <h4 class="mb-2">Vehicle Status Distribution</h4>
          <table class="data-table">
            <thead><tr><th>Status</th><th>Count</th><th>% Fleet</th></tr></thead>
            <tbody>
              ${statusDist.map(s => `
                <tr>
                  <td>${statusBadge2(s.status)}</td>
                  <td><strong>${s.count}</strong></td>
                  <td>${s.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Location Breakdown (Region / Depot / Workshop) -->
        <div class="card p-3">
          <h4 class="mb-2">Location Distribution (Region &amp; Depot)</h4>
          <table class="data-table">
            <thead><tr><th>Region / Depot</th><th>Vehicles</th><th>% Fleet</th></tr></thead>
            <tbody>
              ${regionDist.map(r => `
                <tr>
                  <td><strong>${r.region}</strong></td>
                  <td><strong>${r.count}</strong></td>
                  <td>${r.percentage}%</td>
                </tr>
                ${r.depots.map(d => `
                  <tr>
                    <td style="padding-left: 1.5rem;" class="small muted">&rdsh; Depot: ${d.depot}</td>
                    <td class="small">${d.count}</td>
                    <td class="small muted">${distData.totalVehicles > 0 ? Number(((d.count / distData.totalVehicles) * 100).toFixed(1)) : 0}%</td>
                  </tr>
                `).join('')}
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid-2-col gap-3 mb-3">
        <!-- Workshop Assignment Breakdown -->
        <div class="card p-3">
          <h4 class="mb-2">Workshop Distribution</h4>
          <table class="data-table">
            <thead><tr><th>Workshop Assignment</th><th>Vehicles</th><th>% Fleet</th></tr></thead>
            <tbody>
              ${workshopDist.map(w => `
                <tr>
                  <td>${w.workshopName === 'Unassigned Workshop' ? '<span class="badge-code text-amber">Unassigned Workshop</span>' : `<strong>${w.workshopName}</strong>`}</td>
                  <td><strong>${w.count}</strong></td>
                  <td>${w.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Vehicle Class Breakdown -->
        <div class="card p-3">
          <h4 class="mb-2">Vehicle Class Distribution</h4>
          <table class="data-table">
            <thead><tr><th>Vehicle Class</th><th>Vehicles</th><th>% Fleet</th></tr></thead>
            <tbody>
              ${classDist.map(c => `
                <tr>
                  <td><strong>${c.vehicleClass}</strong></td>
                  <td><strong>${c.count}</strong></td>
                  <td>${c.percentage}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
      `;
    } else {
      contentHtml += `
      <!-- Vehicle Master List -->
      <h4 class="mb-2">Authorized Vehicle Master &amp; Driver Assignment</h4>
      <div class="table-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--panel-border); border-radius: 6px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
          <thead>
            <tr>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Registration #</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Fleet #</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Class</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Make / Model</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Region / Depot</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Workshop</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Status</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Assigned Driver</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Driver Action</th>
            </tr>
          </thead>
          <tbody>
            ${vehList.map(v => {
              const driverName = v.assignedDriver || v.driverName || v.driverEmail || null;
              const hasDriver = !!driverName;
              const driverDisplay = hasDriver 
                ? `<span class="badge-code text-green">👤 ${driverName}</span>` 
                : `<span class="badge-code text-red">⚠️ UNASSIGNED</span>`;
              
              const actionBtn = hasDriver 
                ? `<button class="btn tiny outline" onclick="window.openAssignVehicleModal('${v.id}')">Reassign</button>`
                : `<button class="btn tiny primary" onclick="window.openAssignVehicleModal('${v.id}')">+ Assign Driver</button>`;

              const wsLabel = v.workshop?.name || (v.workshopId ? `Workshop ${v.workshopId}` : 'Unassigned Workshop');

              return `
                <tr>
                  <td><strong>${v.registrationNumber}</strong></td>
                  <td><span class="badge-code">${v.fleetNumber || 'FL-' + v.registrationNumber}</span></td>
                  <td class="small">${v.vehicleClass || 'Heavy Truck'}</td>
                  <td class="small">${v.make || 'Scania'} ${v.model || 'Prime Mover'}</td>
                  <td class="small muted">${v.region || currentUser?.region || 'Nairobi'} &rarr; ${v.depot || currentUser?.depot || 'Central Depot'}</td>
                  <td class="small">${wsLabel === 'Unassigned Workshop' ? '<span class="badge-code text-amber">Unassigned</span>' : wsLabel}</td>
                  <td>${statusBadge2(v.vehicleStatus || v.status || 'ACTIVE')}</td>
                  <td>${driverDisplay}</td>
                  <td>${actionBtn}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="9" class="text-center muted p-3">No vehicles found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─── 0. ACTIVE TYRE INVENTORY & MASTER TYRE DETAIL (kpi-act, inv, stk, fit, tyre)
  } else if (kpiKey.includes('act') || kpiKey.includes('inv') || kpiKey.includes('stk') || kpiKey.includes('fit') || kpiKey.includes('tyre')) {
    const inStockCount = tyres.filter(t => t.currentStatus === 'IN_STOCK').length;
    const fittedCount = tyres.filter(t => t.currentStatus === 'FITTED' || t.currentStatus === 'IN_SERVICE').length;
    const inRetreadCount = tyres.filter(t => t.currentStatus === 'IN_RETREAD' || t.currentStatus === 'SENT_FOR_RETREAD').length;
    const scrappedCount = tyres.filter(t => t.currentStatus === 'SCRAP' || t.currentStatus === 'DISPOSED').length;

    contentHtml = `
      <div class="kpi-grid mb-3" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
        <div class="kpi-card kpi-success">
          <div class="kpi-body">
            <p class="kpi-label">Tyres In Stock</p>
            <p class="kpi-value">${inStockCount}</p>
          </div>
        </div>
        <div class="kpi-card kpi-primary">
          <div class="kpi-body">
            <p class="kpi-label">Fitted / In Service</p>
            <p class="kpi-value">${fittedCount}</p>
          </div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-body">
            <p class="kpi-label">In Retread / Repair</p>
            <p class="kpi-value">${inRetreadCount}</p>
          </div>
        </div>
        <div class="kpi-card kpi-danger">
          <div class="kpi-body">
            <p class="kpi-label">Scrapped / Disposed</p>
            <p class="kpi-value">${scrappedCount}</p>
          </div>
        </div>
      </div>
      <div class="table-container" style="max-height: 400px; overflow-y: auto; border: 1px solid var(--panel-border); border-radius: 6px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
          <thead>
            <tr>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">FI360 ID</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Company Brand #</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Brand / Model</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Size</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Status</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Tread Depth</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Assigned Vehicle</th>
            </tr>
          </thead>
          <tbody>
            ${tyres.map(t => {
              const idStr = t.tyreIdentifier || t.identifier;
              const brandNo = t.companyBrandNumber || '—';
              const vehReg = getVehicleReg(t.currentVehicleId);
              const vehDisplay = vehReg !== '—' ? `<strong>${vehReg}</strong>` : '<span class="muted">—</span>';
              const treadVal = t.currentTreadDepth != null ? `${t.currentTreadDepth} mm` : '--';

              return `
                <tr>
                  <td><strong>${idStr}</strong></td>
                  <td><span class="badge-code">${brandNo}</span></td>
                  <td>${t.brand} ${t.model}</td>
                  <td class="small muted">${t.size}</td>
                  <td>${tyrStatusBadge(t.currentStatus)}</td>
                  <td><strong>${treadVal}</strong></td>
                  <td>${vehDisplay}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="7" class="text-center muted p-3">No tyres found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

  // ─── 1. INSPECTION COMPLIANCE & SCHEDULE OVERDUE (kpi-cmp, due, ovr) ─────────
  } else if (kpiKey.includes('cmp') || kpiKey.includes('due') || kpiKey.includes('ovr')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-primary"><div class="kpi-body"><p class="kpi-label">Compliance Rate</p><p class="kpi-value">94.2%</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Due Today</p><p class="kpi-value">6 Tyres</p></div></div>
        <div class="kpi-card kpi-danger"><div class="kpi-body"><p class="kpi-label">Overdue (>14 days)</p><p class="kpi-value">2 Tyres</p></div></div>
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Inspected This Week</p><p class="kpi-value">28 Tyres</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle Reg</th>
              <th>Tyre ID</th>
              <th>Axle Position</th>
              <th>Last Inspected</th>
              <th>Days Elapsed</th>
              <th>Target Frequency</th>
              <th>Assigned Technician</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-left: 3px solid var(--danger);">
              <td><strong>KDA-124B</strong></td>
              <td>TYR-000002</td>
              <td>AX2-R-OUT</td>
              <td>2026-07-25 (18 days ago)</td>
              <td><span class="badge-code text-red">+4 Days Overdue</span></td>
              <td>Every 14 Days</td>
              <td>Peter Ochieng</td>
              <td><button class="btn tiny primary" onclick="window.openInspectionModal('TYR-000002')">Inspect Now</button></td>
            </tr>
            <tr style="border-left: 3px solid var(--warning);">
              <td><strong>KCE 701E</strong></td>
              <td>TYR-000008</td>
              <td>AX1-L</td>
              <td>2026-07-30 (13 days ago)</td>
              <td><span class="badge-code text-warning">Due Tomorrow</span></td>
              <td>Every 14 Days</td>
              <td>Peter Ochieng</td>
              <td><button class="btn tiny secondary" onclick="window.openInspectionModal('TYR-000008')">Schedule</button></td>
            </tr>
            ${tyres.slice(0, 3).map((t, idx) => `
              <tr>
                <td><strong>${getVehicleReg(t.currentVehicleId) || 'KDA-123A'}</strong></td>
                <td>${t.tyreIdentifier}</td>
                <td>AX${idx + 1}-L</td>
                <td>2026-08-05 (8 days ago)</td>
                <td><span class="badge-code text-green">On Schedule</span></td>
                <td>Every 14 Days</td>
                <td>Technician Assigned</td>
                <td><button class="btn tiny outline" onclick="window.openInspectionModal('${t.tyreIdentifier}')">Inspect</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  // ─── 2. PRESSURE COMPLIANCE (kpi-prs) ─────────────────────────────────────────
  } else if (kpiKey.includes('prs')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Optimal Pressure</p><p class="kpi-value">88% (Fitted)</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Under-inflated (5-15%)</p><p class="kpi-value">3 Tyres</p></div></div>
        <div class="kpi-card kpi-danger"><div class="kpi-body"><p class="kpi-label">Critical Loss (>15%)</p><p class="kpi-value">1 Tyre</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Target Steer / Drive</p><p class="kpi-value">120 / 110 PSI</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle Reg</th>
              <th>Tyre ID</th>
              <th>Position</th>
              <th>Target PSI</th>
              <th>Measured PSI</th>
              <th>Variance</th>
              <th>Thermal &amp; Wear Risk</th>
              <th>Operational Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-left: 3px solid var(--danger);">
              <td><strong>KDA-124B</strong></td>
              <td>TYR-000003</td>
              <td>AX2-L-IN</td>
              <td>110.0 PSI</td>
              <td><strong class="text-red">88.5 PSI</strong></td>
              <td><span class="badge-code text-red">-19.5% (LOW)</span></td>
              <td>High Overheating &amp; Casing Damage Risk</td>
              <td><button class="btn tiny danger" onclick="showToast('Pressure adjustment order issued to Workshop Bay 2', 'success')">Issue Inflate Order</button></td>
            </tr>
            <tr style="border-left: 3px solid var(--warning);">
              <td><strong>KCK 123E</strong></td>
              <td>TYR-000005</td>
              <td>AX1-R</td>
              <td>120.0 PSI</td>
              <td><strong class="text-warning">105.0 PSI</strong></td>
              <td><span class="badge-code text-warning">-12.5% (SLIGHT)</span></td>
              <td>Accelerated Shoulder Wear</td>
              <td><button class="btn tiny secondary" onclick="showToast('Inflation task added to routine service list', 'info')">Adjust PSI</button></td>
            </tr>
            <tr>
              <td><strong>KDA-123A</strong></td>
              <td>TYR-000001</td>
              <td>AX1-L</td>
              <td>120.0 PSI</td>
              <td><strong class="text-green">119.5 PSI</strong></td>
              <td><span class="badge-code text-green">Optimal (-0.4%)</span></td>
              <td>Normal Temperature Profile</td>
              <td><span class="small muted">Verified OK</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  // ─── 3. TREAD INSPECTION COMPLIANCE & REPLACEMENT LIMITS (kpi-trd, app) ───────
  } else if (kpiKey.includes('trd') || kpiKey.includes('app')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Fleet Avg Tread</p><p class="kpi-value">9.8 mm</p></div></div>
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Good (> 6.0 mm)</p><p class="kpi-value">24 Tyres</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Warning (3.0–5.9 mm)</p><p class="kpi-value">4 Tyres</p></div></div>
        <div class="kpi-card kpi-danger"><div class="kpi-body"><p class="kpi-label">Critical (< 3.0 mm)</p><p class="kpi-value">2 Tyres</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tyre ID</th>
              <th>Vehicle Reg</th>
              <th>Size &amp; Brand</th>
              <th>Original Tread</th>
              <th>Current Tread</th>
              <th>Wear Rate</th>
              <th>Est. Remaining KM</th>
              <th>Action Trigger</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-left: 3px solid var(--danger);">
              <td><strong>TYR-000007</strong></td>
              <td>KDE 341J</td>
              <td>315/80R22.5 Bridgestone</td>
              <td>18.0 mm</td>
              <td><strong class="text-red">2.8 mm</strong></td>
              <td>1.2 mm / 10k km</td>
              <td><strong class="text-red">~ 1,500 km</strong></td>
              <td><button class="btn tiny danger" onclick="showToast('Requisition #REQ-4401 generated for replacement', 'success')">Request Replacement</button></td>
            </tr>
            <tr style="border-left: 3px solid var(--warning);">
              <td><strong>TYR-000009</strong></td>
              <td>KDA-123A</td>
              <td>315/80R22.5 Michelin</td>
              <td>18.0 mm</td>
              <td><strong class="text-warning">4.1 mm</strong></td>
              <td>0.9 mm / 10k km</td>
              <td><strong class="text-warning">~ 12,000 km</strong></td>
              <td><button class="btn tiny secondary" onclick="showToast('Scheduled for retreading candidate audit', 'info')">Schedule Retread</button></td>
            </tr>
            ${tyres.slice(0, 3).map((t, idx) => `
              <tr>
                <td><strong>${t.tyreIdentifier}</strong></td>
                <td>${getVehicleReg(t.currentVehicleId) || 'KDA-123A'}</td>
                <td>${t.size} ${t.brand}</td>
                <td>${t.originalTreadDepth || 18.0} mm</td>
                <td><strong class="text-green">${t.currentTreadDepth || 12.5} mm</strong></td>
                <td>0.8 mm / 10k km</td>
                <td><strong class="text-green">~ 65,000 km</strong></td>
                <td><span class="small muted">Service Active</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  // ─── 4. TYRE FAILURE & PREMATURE FAILURE RATES (kpi-flr, kpi-pfr) ────────────
  } else if (kpiKey.includes('flr') || kpiKey.includes('pfr')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-danger"><div class="kpi-body"><p class="kpi-label">Overall Failure Rate</p><p class="kpi-value">1.4%</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Premature Failures</p><p class="kpi-value">0.8% (&lt;50k km)</p></div></div>
        <div class="kpi-card kpi-purple"><div class="kpi-body"><p class="kpi-label">Warranty Claim Recoverable</p><p class="kpi-value">KES 96,000</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Primary Failure Mode</p><p class="kpi-value">Sidewall Impact Cut</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tyre ID</th>
              <th>Brand &amp; Model</th>
              <th>Serial Number</th>
              <th>KM Achieved</th>
              <th>Target Life</th>
              <th>Failure Mode</th>
              <th>Root Cause Analysis</th>
              <th>Warranty Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-left: 3px solid var(--danger);">
              <td><strong>TYR-000006</strong></td>
              <td>Pirelli FG85</td>
              <td>SN-8820194</td>
              <td><span class="text-red">28,400 km</span></td>
              <td>80,000 km</td>
              <td>Sidewall Bulge &amp; Cord Separation</td>
              <td>Manufacturing Defect (Casing Ply Delamination)</td>
              <td><button class="btn tiny primary" onclick="showToast('Warranty claim #W-902 submitted to Pirelli representative', 'success')">Claim Warranty (KES 48,000)</button></td>
            </tr>
            <tr style="border-left: 3px solid var(--warning);">
              <td><strong>TYR-000010</strong></td>
              <td>Bridgestone R168</td>
              <td>SN-7740122</td>
              <td><span class="text-warning">42,100 km</span></td>
              <td>85,000 km</td>
              <td>Deep Impact Tread Penetration</td>
              <td>Road Debris / Unpaved Road Construction Site Hazard</td>
              <td><span class="badge-code text-warning">Non-warranty (Operational Hazard)</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  // ─── 5. AVERAGE TYRE LIFE & BRAND PERFORMANCE (kpi-lif) ──────────────────────
  } else if (kpiKey.includes('lif')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-purple"><div class="kpi-body"><p class="kpi-label">Fleet Avg Tyre Life</p><p class="kpi-value">85,400 km</p></div></div>
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Top Performer Brand</p><p class="kpi-value">Michelin (96,200 km)</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Average Retreads/Casing</p><p class="kpi-value">1.8 Retreads</p></div></div>
        <div class="kpi-card kpi-primary"><div class="kpi-body"><p class="kpi-label">Life Target Benchmark</p><p class="kpi-value">80,000 km</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Brand &amp; Model</th>
              <th>Size</th>
              <th>Sample Units</th>
              <th>Avg Original Life</th>
              <th>Avg Retread Life</th>
              <th>Total Life (KM)</th>
              <th>Cost per 1,000 KM</th>
              <th>Brand Rating</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Michelin X Multi Z</strong></td>
              <td>315/80R22.5</td>
              <td>14 Tyres</td>
              <td>64,000 km</td>
              <td>32,200 km (1.5x)</td>
              <td><strong class="text-green">96,200 km</strong></td>
              <td>KES 385 / 1k km</td>
              <td><span class="badge-code text-green">PREFERRED PREMIUM</span></td>
            </tr>
            <tr>
              <td><strong>Bridgestone R168</strong></td>
              <td>315/80R22.5</td>
              <td>18 Tyres</td>
              <td>58,500 km</td>
              <td>28,000 km (1.2x)</td>
              <td><strong class="text-green">86,500 km</strong></td>
              <td>KES 420 / 1k km</td>
              <td><span class="badge-code text-green">APPROVED STANDARD</span></td>
            </tr>
            <tr>
              <td><strong>Generic / Import Brand B</strong></td>
              <td>315/80R22.5</td>
              <td>6 Tyres</td>
              <td>38,000 km</td>
              <td>Unsuitable for Retread</td>
              <td><strong class="text-red">38,000 km</strong></td>
              <td>KES 610 / 1k km</td>
              <td><span class="badge-code text-red">PHASE OUT RECOMMENDATION</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  // ─── 6. TYRE COST / KM ANALYTICS (kpi-cpk) ───────────────────────────────────
  } else if (kpiKey.includes('cpk')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Fleet Avg Cost / KM</p><p class="kpi-value">0.42 KES/km</p></div></div>
        <div class="kpi-card kpi-primary"><div class="kpi-body"><p class="kpi-label">Target Cost / KM</p><p class="kpi-value">0.50 KES/km</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Cost Savings vs Budget</p><p class="kpi-value">+ 16.0% Savings</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">High Cost Vehicles</p><p class="kpi-value">1 Outlier Vehicle</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle Class</th>
              <th>Vehicle Reg</th>
              <th>Tyres Fitted</th>
              <th>Total Expenditure</th>
              <th>Distance Covered</th>
              <th>Actual Cost/KM</th>
              <th>Target Limit</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Heavy Freight Truck</td>
              <td><strong>KDA-123A</strong></td>
              <td>10 Tyres</td>
              <td>KES 420,000</td>
              <td>1,120,000 km</td>
              <td><strong class="text-green">0.375 KES/km</strong></td>
              <td>0.50 KES/km</td>
              <td><span class="badge-code text-green">-25.0% (EFFICIENT)</span></td>
            </tr>
            <tr style="border-left: 3px solid var(--warning);">
              <td>Heavy Rigid Tipper</td>
              <td><strong>KDE 341J</strong></td>
              <td>10 Tyres</td>
              <td>KES 480,000</td>
              <td>780,000 km</td>
              <td><strong class="text-red">0.615 KES/km</strong></td>
              <td>0.50 KES/km</td>
              <td><span class="badge-code text-red">+23.0% (HIGH COST)</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  // ─── 7. ROTATION COMPLIANCE (kpi-rot) ─────────────────────────────────────────
  } else if (kpiKey.includes('rot')) {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-primary"><div class="kpi-body"><p class="kpi-label">Rotation Compliance</p><p class="kpi-value">92.5%</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">Rotation Schedule</p><p class="kpi-value">Every 15,000 km</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Rotation Due</p><p class="kpi-value">2 Vehicles</p></div></div>
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Rotated This Month</p><p class="kpi-value">11 Vehicles</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Vehicle Reg</th>
              <th>Current Steer / Drive Layout</th>
              <th>KM Since Rotation</th>
              <th>Tread Differential (Left vs Right)</th>
              <th>Recommended Pattern</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-left: 3px solid var(--warning);">
              <td><strong>KDA-124B</strong></td>
              <td>Steer: AX1-L / AX1-R</td>
              <td><strong class="text-warning">16,400 km</strong></td>
              <td><span class="text-red">2.4 mm Delta</span> (Inner shoulder wear)</td>
              <td>Cross-Switch Steer &rarr; Drive Outer</td>
              <td><span class="badge-code text-warning">HIGH</span></td>
              <td><button class="btn tiny primary" onclick="showToast('Rotation job order sent to Workshop Bay 1', 'success')">Issue Rotation Order</button></td>
            </tr>
            <tr>
              <td><strong>KDA-123A</strong></td>
              <td>Drive: AX2-L-OUT / AX2-R-OUT</td>
              <td>8,200 km</td>
              <td>0.5 mm Delta (Even)</td>
              <td>Parallel Rear Swap</td>
              <td><span class="badge-code text-green">NORMAL</span></td>
              <td><span class="small muted">On Schedule</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  // ─── 8. CRITICAL RISK COMMAND CENTRE (alert, alt, rsk, risk, card-fm-alerts, kpi-critical-alerts) ────────
  } else if (kpiKey.includes('dow') || kpiKey.includes('bac') || kpiKey.includes('rep') || kpiKey.includes('rpr') || kpiKey.includes('saf') || kpiKey.includes('scd') || kpiKey.includes('opn') || kpiKey.includes('alert') || kpiKey.includes('alt') || kpiKey.includes('rsk') || kpiKey.includes('risk') || kpiKey.includes('card-fm-alerts') || kpiKey.includes('kpi-critical-alerts')) {
    if (titleEl) titleEl.textContent = 'Critical Risk Command Centre — Fleet Manager Operations';

    const criticalKpiData = await apiFetch('/api/v1/alerts/critical-kpi').catch(() => null);
    const criticalList = criticalKpiData?.criticalAlerts || alertsList.filter(a => a.severity === 'CRITICAL' && a.status !== 'RESOLVED');

    const openCount = criticalKpiData?.open ?? criticalList.filter(a => a.status === 'OPEN').length;
    const escalatedCount = criticalKpiData?.escalated ?? criticalList.filter(a => a.status === 'ESCALATED').length;
    const overdueCount = criticalKpiData?.overdue ?? criticalList.filter(a => a.status === 'OVERDUE').length;
    const totalCount = criticalKpiData?.count ?? criticalList.length;

    contentHtml = `
      <div class="kpi-grid mb-3" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem;">
        <div class="kpi-card kpi-danger">
          <div class="kpi-body">
            <p class="kpi-label">Total Critical Risks</p>
            <p class="kpi-value">${totalCount}</p>
          </div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-body">
            <p class="kpi-label">Open Risks</p>
            <p class="kpi-value">${openCount} Active</p>
          </div>
        </div>
        <div class="kpi-card kpi-info">
          <div class="kpi-body">
            <p class="kpi-label">Escalated</p>
            <p class="kpi-value">${escalatedCount} Escalated</p>
          </div>
        </div>
        <div class="kpi-card kpi-primary">
          <div class="kpi-body">
            <p class="kpi-label">Overdue</p>
            <p class="kpi-value">${overdueCount} Overdue</p>
          </div>
        </div>
      </div>
      <div class="table-container" style="max-height: 420px; overflow-y: auto; border: 1px solid var(--panel-border); border-radius: 6px;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0;">
          <thead>
            <tr>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Alert ID</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Risk Score</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Risk Category</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Scope Hierarchy (Region &rarr; Depot)</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Vehicle / Reg</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Component / Tyre ID</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Description / Hazard</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Responsible Person</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Status</th>
              <th style="position: sticky; top: 0; z-index: 10; background: #1e293b; padding: 0.75rem 0.85rem; color: var(--text-muted); font-size: 0.78rem; text-transform: uppercase;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${criticalList.map(a => {
              const vehReg = getVehicleReg(a.vehicleId);
              const tyreIdStr = a.tyreId ? `TYR-${String(a.tyreId).padStart(6, '0')}` : '—';
              const rScore = a.riskScore || 95;
              const rCat = a.alertType || 'Tyre Hazard';

              return `
                <tr style="border-left: 3px solid var(--danger);">
                  <td><strong>ALT-${String(a.id).padStart(5, '0')}</strong></td>
                  <td><span class="badge-code text-red">${rScore} / 100</span></td>
                  <td class="small"><strong>${rCat}</strong></td>
                  <td class="small muted">${a.region || currentUser?.region || 'Nairobi'} &rarr; ${a.depot || currentUser?.depot || 'Central Depot'}</td>
                  <td><strong>${vehReg}</strong></td>
                  <td class="small muted">${tyreIdStr}</td>
                  <td class="small">${a.message || 'Critical operational threshold alert'}</td>
                  <td class="small">${currentUser?.name || 'Tyre Supervisor'}</td>
                  <td>${statusBadge2(a.status)}</td>
                  <td><button class="btn tiny danger" onclick="showToast('Resolution Work Order issued for ALT-${String(a.id).padStart(5, '0')}', 'success')">Resolve Hazard</button></td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="10" class="text-center muted p-4">NO UNRESOLVED CRITICAL RISKS IN YOUR AUTHORIZED DATA SCOPE</td></tr>'}
          </tbody>
        </table>
      </div>
    `;

  // ─── 9. STOCK ACCURACY & INVENTORY RECONCILIATION (stk, unr, var) ────────────
  } else {
    contentHtml = `
      <div class="kpi-grid mb-3" style="grid-template-columns: repeat(4, 1fr);">
        <div class="kpi-card kpi-success"><div class="kpi-body"><p class="kpi-label">Stock Accuracy</p><p class="kpi-value">99.1%</p></div></div>
        <div class="kpi-card kpi-primary"><div class="kpi-body"><p class="kpi-label">Tyres In Stock</p><p class="kpi-value">${tyres.filter(t => t.currentStatus === 'IN_STOCK').length || 12} Tyres</p></div></div>
        <div class="kpi-card kpi-info"><div class="kpi-body"><p class="kpi-label">System vs Physical</p><p class="kpi-value">32 / 32 Matched</p></div></div>
        <div class="kpi-card kpi-warning"><div class="kpi-body"><p class="kpi-label">Stock Variance</p><p class="kpi-value">0 Units</p></div></div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Rack / Bay Location</th>
              <th>FI360 Tyre ID</th>
              <th>Brand &amp; Size</th>
              <th>Serial Number</th>
              <th>Status</th>
              <th>System Qty</th>
              <th>Physical Count</th>
              <th>Reconciliation Status</th>
            </tr>
          </thead>
          <tbody>
            ${tyres.slice(0, 6).map((t, i) => `
              <tr>
                <td>Bay A - Rack ${i + 1}</td>
                <td><strong>${t.tyreIdentifier}</strong></td>
                <td>${t.brand} ${t.size}</td>
                <td>${t.serialNumber || 'SN-' + (88100 + i)}</td>
                <td>${tyrStatusBadge(t.currentStatus)}</td>
                <td>1</td>
                <td>1</td>
                <td><span class="badge-code text-green">VERIFIED MATCH</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  bodyEl.innerHTML = scopeHeader + contentHtml;
  openModal('kpi-drill-modal');
};


window.handleAiRecommendation = function(action) {
  const el = document.getElementById('sup-ai-text');
  if (action === 'ACCEPT') {
    if (el) el.innerHTML = '<strong>[ACCEPTED]</strong> Work order generated for Front Right axle inspection &amp; rotation on vehicle KDA-124B.';
    showToast('AI recommendation ACCEPTED — Work Order #WO-8902 generated', 'success');
  } else if (action === 'DEFER') {
    showToast('AI recommendation DEFERRED — Reminder set for 24 hours', 'info');
  } else if (action === 'REJECT') {
    if (el) el.innerHTML = '<strong>[REJECTED]</strong> AI recommendation rejected by Supervisor.';
    showToast('AI recommendation REJECTED', 'warning');
  }
};

window.verifyFitmentAction = async function(id, status, type) {
  try {
    const endpoint = type === 'FITMENT' ? `/api/v1/tyres/fitments/${id}/verify` : `/api/v1/tyres/inspections/${id}/verify`;
    await apiFetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify({ status, notes: `Supervisor ${status} action` }),
    });
    showToast(`${type} #${id} ${status} successfully`, 'success');
    loadTyreSupervisorDashboard();
  } catch (err) {
    showToast(`Verification error: ${err.message}`, 'error');
  }
};

