const STORAGE_KEY = 'naughty-dashboard-leads-v1';

const seedLeads = [
  { id: '1', username: 'tg_luna', platform: 'TG', status: 'HOT_DATE_BOUND', tags: ['vip', 'repeat', 'feet'], lastTouch: '12m ago', nextAction: 'Today 09:00', predictedValue7d: 180, confidence: 0.9 },
  { id: '2', username: 'pd_nova', platform: 'PD', status: 'HOT_DATE_BOUND', tags: ['new', 'tease'], lastTouch: '2h ago', nextAction: 'Today 18:00', predictedValue7d: 75, confidence: 0.72 },
  { id: '3', username: 'snif_astro', platform: 'SNIFFR', status: 'PREDICTIVE_SOON', tags: ['cadence-14d', 'scented'], lastTouch: '1d ago', nextAction: 'Tomorrow 11:00', predictedValue7d: 95, confidence: 0.68 },
  { id: '4', username: 'kik_orion', platform: 'KIK', status: 'COOLING', tags: ['manual-assist', 'roleplay'], lastTouch: '5d ago', nextAction: 'In 2 days', predictedValue7d: 45, confidence: 0.45 },
  { id: '5', username: 'tg_ember', platform: 'TG', status: 'DORMANT', tags: ['high-aov', 'custom'], lastTouch: '13d ago', nextAction: 'In 14 days', predictedValue7d: 30, confidence: 0.28 }
];

const sample = {
  queue: [
    '09:00 · TG · tg_luna · hot_t_minus_1d',
    '11:00 · SNIFFR · snif_astro · predictive_window_open',
    '18:00 · PD · pd_nova · hot_day_of'
  ],
  approvals: [
    { id: 'a1', text: 'PD / pd_nova / hot_day_of', state: 'awaiting_approval' },
    { id: 'a2', text: 'KIK / kik_orion / cooling_nudge_1', state: 'awaiting_approval' }
  ],
  agents: [
    { name: 'telegram-agent-1', platform: 'TG', online: true, queueDepth: 4, lastError: null },
    { name: 'pd-agent-1', platform: 'PD', online: true, queueDepth: 9, lastError: '429 throttle 15m' },
    { name: 'snifffr-agent-1', platform: 'SNIFFR', online: true, queueDepth: 6, lastError: null },
    { name: 'kik-assist-1', platform: 'KIK', online: false, queueDepth: 0, lastError: 'manual mode only' }
  ]
};

let killSwitch = false;
let editingLeadId = null;
const state = { search: '', platform: 'ALL', status: 'ALL' };

function loadLeads() {
  try {
    const fromStorage = localStorage.getItem(STORAGE_KEY);
    if (!fromStorage) return [...seedLeads];
    const parsed = JSON.parse(fromStorage);
    return Array.isArray(parsed) ? parsed : [...seedLeads];
  } catch {
    return [...seedLeads];
  }
}

function saveLeads() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sample.leads));
}

sample.leads = loadLeads();

const kpiStrip = document.getElementById('kpiStrip');
const searchInput = document.getElementById('searchInput');
const platformFilter = document.getElementById('platformFilter');
const stateFilter = document.getElementById('stateFilter');
const leadCrudBody = document.getElementById('leadCrudBody');
const leadForm = document.getElementById('leadForm');
const usernameInput = document.getElementById('usernameInput');
const platformInput = document.getElementById('platformInput');
const kinkInput = document.getElementById('kinkInput');
const statusInput = document.getElementById('statusInput');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

function uid() {
  return String(Date.now() + Math.floor(Math.random() * 1000));
}

function filteredLeads() {
  return sample.leads.filter((l) => {
    const query = state.search.toLowerCase();
    const hitsQuery = !query || l.username.toLowerCase().includes(query) || l.tags.join(' ').toLowerCase().includes(query);
    const hitsPlatform = state.platform === 'ALL' || l.platform === state.platform;
    const hitsState = state.status === 'ALL' || l.status === state.status;
    return hitsQuery && hitsPlatform && hitsState;
  });
}

function renderKpis(list) {
  const hot = list.filter((l) => l.status === 'HOT_DATE_BOUND').length;
  const dueToday = sample.queue.filter((q) => q.includes('09:00') || q.includes('18:00')).length;
  const unreplied = list.filter((l) => ['COOLING', 'DORMANT'].includes(l.status)).length;
  const expected7d = list.reduce((sum, l) => sum + l.predictedValue7d * (l.confidence || 0), 0);
  const risk = sample.leads.filter((l) => l.status === 'DO_NOT_CONTACT').length;

  const items = [
    ['Hot Now', hot],
    ['Due Today', dueToday],
    ['Unreplied', unreplied],
    ['Expected 7 Days', `$${expected7d.toFixed(0)}`],
    ['Risk (DNC)', risk]
  ];

  kpiStrip.innerHTML = items.map(([label, value]) => `
    <div class="kpi">
      <div class="label">${label}</div>
      <div class="value">${value}</div>
    </div>
  `).join('');
}

function laneContainer(status) {
  return document.getElementById(`lane-${status}`);
}

function makeLeadCard(lead) {
  const template = document.getElementById('leadCardTemplate');
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector('.platform-pill').textContent = lead.platform;
  card.querySelector('.lead-name').textContent = lead.username;
  card.querySelector('.value-chip').textContent = `$${lead.predictedValue7d}`;
  card.querySelector('.lead-meta').textContent = `Last: ${lead.lastTouch} · Next: ${lead.nextAction}`;
  card.querySelector('.lead-tags').innerHTML = lead.tags.slice(0, 3).map((t) => `<span>${t}</span>`).join('');

  card.querySelectorAll('button[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'dnc') {
        lead.status = 'DO_NOT_CONTACT';
      }
      if (action === 'pause') {
        lead.nextAction = 'Paused';
      }
      saveLeads();
      render();
    });
  });
  return card;
}

function renderLanes(list) {
  ['HOT_DATE_BOUND', 'PREDICTIVE_SOON', 'COOLING', 'DORMANT'].forEach((status) => {
    const container = laneContainer(status);
    container.innerHTML = '';
    const leads = list.filter((l) => l.status === status);
    if (!leads.length) {
      container.innerHTML = '<small class="muted">No leads in this lane.</small>';
      return;
    }
    leads.forEach((l) => container.appendChild(makeLeadCard(l)));
  });
}

function renderCrudTable() {
  leadCrudBody.innerHTML = '';
  sample.leads.forEach((lead) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${lead.username}</td>
      <td>${lead.platform}</td>
      <td>${lead.tags[lead.tags.length - 1] || '-'}</td>
      <td>${lead.status}</td>
      <td>
        <button data-action="edit" data-id="${lead.id}">Edit</button>
        <button data-action="delete" data-id="${lead.id}" class="danger">Delete</button>
      </td>
    `;
    leadCrudBody.appendChild(tr);
  });
}

function renderList(id, rows, renderRow) {
  const el = document.getElementById(id);
  el.innerHTML = '';
  rows.forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = renderRow(row);
    el.appendChild(li);
  });
}

function resetForm() {
  editingLeadId = null;
  leadForm.reset();
  submitBtn.textContent = 'Add Lead';
  cancelEditBtn.hidden = true;
  platformInput.value = 'TG';
  kinkInput.value = 'feet';
  statusInput.value = 'PREDICTIVE_SOON';
}

function render() {
  const list = filteredLeads();
  renderKpis(list);
  renderLanes(list);
  renderCrudTable();

  renderList('queueList', sample.queue.slice(0, 10), (item) => item);
  renderList('approvalList', sample.approvals, (item) => `${item.text} <span class="badge warn">${item.state}</span>`);
  renderList('agentList', sample.agents, (a) => {
    const badge = a.online ? '<span class="badge ok">online</span>' : '<span class="badge danger">offline</span>';
    return `${a.platform} · ${a.name} ${badge}<br/><small>Queue: ${a.queueDepth} · Last error: ${a.lastError ?? 'none'}</small>`;
  });
}

leadForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const platform = platformInput.value;
  const kink = kinkInput.value;
  const status = statusInput.value;

  if (!username) return;

  if (editingLeadId) {
    const existing = sample.leads.find((l) => l.id === editingLeadId);
    if (!existing) return;
    existing.username = username;
    existing.platform = platform;
    existing.status = status;
    existing.tags = [...new Set([...existing.tags.filter((t) => !['feet', 'scented', 'roleplay', 'tease', 'custom'].includes(t)), kink])];
  } else {
    sample.leads.unshift({
      id: uid(),
      username,
      platform,
      status,
      tags: ['new', kink],
      lastTouch: 'just now',
      nextAction: 'Pending schedule',
      predictedValue7d: 40,
      confidence: 0.5
    });
  }

  saveLeads();
  resetForm();
  render();
});

leadCrudBody.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  const lead = sample.leads.find((l) => l.id === id);
  if (!lead) return;

  if (action === 'delete') {
    sample.leads = sample.leads.filter((l) => l.id !== id);
    saveLeads();
    if (editingLeadId === id) resetForm();
    render();
    return;
  }

  if (action === 'edit') {
    editingLeadId = id;
    usernameInput.value = lead.username;
    platformInput.value = lead.platform;
    statusInput.value = lead.status;
    kinkInput.value = lead.tags.find((t) => ['feet', 'scented', 'roleplay', 'tease', 'custom'].includes(t)) || 'custom';
    submitBtn.textContent = 'Update Lead';
    cancelEditBtn.hidden = false;
  }
});

cancelEditBtn.addEventListener('click', resetForm);

searchInput.addEventListener('input', (e) => {
  state.search = e.target.value;
  render();
});
platformFilter.addEventListener('change', (e) => {
  state.platform = e.target.value;
  render();
});
stateFilter.addEventListener('change', (e) => {
  state.status = e.target.value;
  render();
});

document.getElementById('approveAllBtn').addEventListener('click', () => {
  sample.approvals = [];
  render();
});

document.getElementById('killSwitchBtn').addEventListener('click', (e) => {
  killSwitch = !killSwitch;
  e.target.textContent = `Global Kill Switch: ${killSwitch ? 'ON' : 'OFF'}`;
  e.target.classList.toggle('danger', !killSwitch);
});

document.getElementById('refreshBtn').addEventListener('click', render);

resetForm();
render();
