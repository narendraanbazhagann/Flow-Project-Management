let currentView = 'table';
let exp = new Set(), tabs = {}, filt = 'all', srch = '', sPick = null, pPick = null, dragId = null, dark = false;
let collapsedNodes = new Set();

// ── HELPERS ──────────────────────────────────
function dd(s) {
  if (!s || s === 'TBD') return null;
  const mo = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [m, d] = s.split(' '); return Math.ceil((new Date(2026, mo[m], +d) - TODAY) / 864e5);
}

function taskOk(t) {
  const d = dd(t.dt);
  if (filt === 'urgent' && t.pri !== 'urgent') return false;
  if (filt === 'stuck' && t.st !== 'stuck') return false;
  if (filt === 'overdue' && !(d !== null && d < 0)) return false;
  if (filt === 'mine' && t.own !== 'AK') return false;
  if (srch) { const q = srch.toLowerCase(); if (!t.nm.toLowerCase().includes(q)) return false; }
  return true;
}

// ── RENDER ────────────────────────────────────
function setView(v) {
  currentView = v;
  document.querySelectorAll('.sb-row').forEach(x => x.classList.remove('on'));
  const sbItem = document.getElementById('sb-' + v);
  if(sbItem) sbItem.classList.add('on');
  
  document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('on'));
  const segItem = document.getElementById('seg-' + v);
  if(segItem) segItem.classList.add('on');
  
  render();
}

function render() {
  const content = document.getElementById('content');
  if (content) {
    if (currentView === 'table') content.innerHTML = grps.map(rGrp).join('');
    else if (currentView === 'board') content.innerHTML = rKanban();
    else if (currentView === 'overview') content.innerHTML = rOverview();
    else if (currentView === 'reports') content.innerHTML = rReports();
    else if (currentView === 'hierarchy') content.innerHTML = rHierarchy();
    else if (currentView === 'timeline') content.innerHTML = rTimeline();
    else {
      content.innerHTML = `<div class="placeholder-view">
        <div class="ic">🚧</div>
        <h3>View in Development</h3>
        <p>The ${currentView} view is coming soon. Select Table, Board, Overview, or Hierarchy.</p>
      </div>`;
    }
  }
  
  const sbCount = document.getElementById('sb-table-count');
  if (sbCount) {
    let tCount = 0;
    grps.forEach(g => tCount += g.tasks.filter(taskOk).length);
    sbCount.textContent = tCount;
  }
  rNotifs();
}

function rKanban() {
  const cols = [
    { st: 'todo', name: 'To Do', color: '#8e8e93' },
    { st: 'wip', name: 'In Progress', color: '#ff9500' },
    { st: 'stuck', name: 'Stuck', color: '#ff3b30' },
    { st: 'review', name: 'In Review', color: '#af52de' },
    { st: 'done', name: 'Done', color: '#34c759' }
  ];
  
  let allTasks = [];
  grps.forEach(g => { g.tasks.filter(taskOk).forEach(t => allTasks.push({...t, gId: g.id, gCol: g.col})) });

  let html = '<div class="kanban-board">';
  cols.forEach(c => {
    let tasksInfo = allTasks.filter(t => t.st === c.st);
    html += `
      <div class="k-col" 
        ondragover="kDOv(event, this)" 
        ondragleave="kDLv(event, this)" 
        ondrop="kDDp(event, '${c.st}')">
        <div class="k-hdr" style="border-top: 3px solid ${c.color}">
          <span>${c.name}</span>
          <span class="k-count">${tasksInfo.length}</span>
        </div>
        <div class="k-body">
          ${tasksInfo.map(t => {
            const p = PR[t.pri] || PR.low;
            const tfH = t.tf.slice(0,3).map(id => {
              const x = T[id] || {};
              return `<div class="av" style="background:${x.c};color:${x.t}">${id}</div>`;
            }).join('');
            return `<div class="k-card" 
              draggable="true" 
              ondragstart="kDSt(event, '${t.gId}', '${t.id}')"
              onclick="setView('table'); togExpTab('${t.id}','subtasks');">
              <div style="font-size:0.6rem; font-weight:700; color:${p.col}; margin-bottom:0.25rem;">${p.l.toUpperCase()}</div>
              <div class="k-title">${t.nm}</div>
              <div class="k-meta">
                <span style="color:${t.gCol}; font-weight:600;">${t.dt}</span>
                <div class="k-av-group">${tfH}</div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  });
  html += '</div>';
  return html;
}

function rOverview() {
  let allTasks = [];
  grps.forEach(g => { g.tasks.filter(taskOk).forEach(t => allTasks.push(t)) });
  const total = allTasks.length;
  const done = allTasks.filter(t => t.st === 'done').length;
  const wip = allTasks.filter(t => t.st === 'wip').length;
  const stuck = allTasks.filter(t => t.st === 'stuck').length;
  let html = `
    <div style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 1.2rem; color: var(--ink);">Project Overview</h2>
      <div class="dash-grid">
        <div class="dash-card">
          <div class="dc-lbl">Total Tasks</div>
          <div class="dc-val">${total}</div>
        </div>
        <div class="dash-card">
          <div class="dc-lbl">Done</div>
          <div class="dc-val" style="color: var(--green);">${done}</div>
        </div>
        <div class="dash-card">
          <div class="dc-lbl">In Progress</div>
          <div class="dc-val" style="color: var(--amber);">${wip}</div>
        </div>
        <div class="dash-card">
          <div class="dc-lbl">Blocked / Stuck</div>
          <div class="dc-val" style="color: var(--red);">${stuck}</div>
        </div>
      </div>
      <div>
        <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 0.8rem; color: var(--ink2);">Recent Activity</h3>
        <div class="tbl" style="max-width: 600px;">
          ${notifs.slice(0, 4).map(n => {
            const m = T[n.by] || {};
            return `<div class="trow" style="grid-template-columns: 1fr;">
              <div class="tc" style="gap: 0.6rem;">
                <div class="np-av" style="background:${m.c};color:${m.t}; width:24px; height:24px; font-size:0.45rem; display:flex; align-items:center; justify-content:center; border-radius:50%;">${n.by}</div>
                <div style="font-size:0.8rem;">${n.tx} <span style="color:var(--ghost);font-size:0.7rem;margin-left:0.5rem;">${n.tm}</span></div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  return html;
}



function rHierarchy() {
  const allTasks = [];
  grps.forEach(g => g.tasks.forEach(t => allTasks.push(t)));
  
  const getWorkload = (id) => allTasks.filter(t => t.own === id && t.st !== 'done').length;
  const getAvgProgress = (id) => {
    const ts = allTasks.filter(t => t.own === id);
    return ts.length ? Math.round(ts.reduce((a, b) => a + b.pg, 0) / ts.length) : 0;
  };

  const cardHtml = (id) => {
    const p = T[id];
    if (!p) return '';
    const load = getWorkload(id);
    const progress = getAvgProgress(id);
    const hasChildren = Object.values(T).some(x => x.reportsTo === id);
    const isCollapsed = collapsedNodes.has(id);

    return `
      <div class="org-card" style="border-left: 4px solid ${p.c};">
        <div style="position:absolute; top:8px; right:8px; display:flex; gap:4px;">
          ${hasChildren ? `<button class="ic-btn" style="width:20px; height:20px; font-size:0.6rem;" onclick="event.stopPropagation(); toggleOrgBranch('${id}')">${isCollapsed ? '+' : '-'}</button>` : ''}
          <button class="ic-btn" title="View Workload" style="width:20px; height:20px; font-size:0.6rem;" onclick="event.stopPropagation(); showWorkloadModal('${id}')">📋</button>
        </div>
        <div class="org-av" style="background:${p.c};color:${p.t}">
          ${id}
          <div class="av-dot ${p.online ? 'd-on' : 'd-off'}" style="width:10px;height:10px;border-width:2px;bottom:2px;right:2px;"></div>
        </div>
        <div class="org-nm">${p.name}</div>
        <div class="org-rl">${p.role}</div>
        <div style="margin:0.6rem 0 0.4rem; font-size:0.6rem; font-weight:700; color:var(--ghost); display:flex; justify-content:center; gap:0.4rem; align-items:center;">
          <span style="background:var(--surface3); padding:0.1rem 0.4rem; border-radius:4px;">${p.dept}</span>
          <span style="color:${load > 2 ? 'var(--red)' : 'var(--green)'}">${load} active tasks</span>
        </div>
        <div class="prog-wrap" style="padding:0 0.4rem;">
          <div class="prog-bg" style="height:3px;"><div class="prog-fill" style="width:${progress}%; background:var(--accent)"></div></div>
          <div style="font-size:0.55rem; color:var(--ghost); text-align:center;">${progress}% Avg Productivity</div>
        </div>
      </div>
    `;
  };

  const buildTree = (managerId) => {
    if (collapsedNodes.has(managerId)) return '';
    const reports = Object.keys(T).filter(id => T[id].reportsTo === managerId);
    if (reports.length === 0) return '';
    
    return `
      <ul>
        ${reports.map(id => `
          <li>
            ${cardHtml(id)}
            ${buildTree(id)}
          </li>
        `).join('')}
      </ul>
    `;
  };

  const roots = Object.keys(T).filter(id => !T[id].reportsTo);

  return `
    <div style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.4rem; font-weight: 700; color: var(--ink);">Organization Chart</h2>
          <p style="font-size: 0.85rem; color: var(--ghost);">Operational topology & performance metrics.</p>
        </div>
        <div style="display:flex; gap:0.5rem;">
           <button class="btn-ghost" style="font-size:0.7rem;" onclick="collapsedNodes.clear(); render();">Expand All</button>
           <button class="btn-ghost" style="font-size:0.7rem;" onclick="collapseAll();">Collapse All</button>
        </div>
      </div>
      <div class="org-tree-wrapper">
        <div class="org-tree">
          <ul>
            ${roots.map(id => `
              <li class="org-root">
                ${cardHtml(id)}
                ${buildTree(id)}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;
}

function toggleOrgBranch(id) {
  if (collapsedNodes.has(id)) collapsedNodes.delete(id);
  else collapsedNodes.add(id);
  render();
}

function collapseAll() {
  Object.keys(T).forEach(id => {
    if (Object.values(T).some(x => x.reportsTo === id)) collapsedNodes.add(id);
  });
  render();
}

function showWorkloadModal(id) {
  const p = T[id];
  const allTasks = [];
  grps.forEach(g => g.tasks.forEach(t => { if(t.own === id) allTasks.push(t); }));
  
  modalMode = 'workload';
  document.getElementById('modalTitle').textContent = `${p.name}'s Workload`;
  document.getElementById('modalBody').innerHTML = `
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem; padding-bottom:1rem; border-bottom:1px solid var(--border);">
       <div class="org-av" style="background:${p.c};color:${p.t}; margin:0;">${id}</div>
       <div>
         <div style="font-weight:700; font-size:1.1rem;">${p.name}</div>
         <div style="font-size:0.8rem; color:var(--ghost);">${p.role} • ${p.dept}</div>
       </div>
    </div>
    <div style="max-height: 300px; overflow-y: auto;">
      <div style="font-size:0.65rem; font-weight:700; color:var(--ghost); text-transform:uppercase; margin-bottom:0.5rem;">Assigned Tasks (${allTasks.length})</div>
      ${allTasks.map(t => {
        const s = SM[t.st] || SM.todo;
        return `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem; background:var(--surface2); border:1px solid var(--border); border-radius:8px; margin-bottom:0.4rem;">
            <div>
              <div style="font-weight:600; font-size:0.8rem;">${t.nm}</div>
              <div style="font-size:0.7rem; color:var(--ghost);">${t.dt}</div>
            </div>
            <div class="stbadge ${s.cls}" style="width:auto; font-size:0.6rem; padding:2px 8px;">${s.l}</div>
          </div>
        `;
      }).join('') || '<div style="text-align:center; padding:1rem; color:var(--ghost);">No tasks assigned</div>'}
    </div>
  `;
  document.getElementById('modalSubmit').style.display = 'none';
  document.getElementById('sysModal').classList.add('open');
}

function rTimeline() {
  let html = `
    <div style="padding: 0 0 1rem; height: 100%; display: flex; flex-direction: column;">
      <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.2rem; color: var(--ink);">Gantt Timeline</h2>
      <p style="font-size: 0.85rem; color: var(--ghost); margin-bottom: 1.5rem;">Visual schedule of active tasks mapped over sprints.</p>
      
      <div style="flex: 1; overflow: auto; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; box-shadow: var(--shadow-card); position: relative;">
        <!-- Timeline Header -->
        <div style="display: flex; border-bottom: 1px solid var(--border); background: var(--surface2); position: sticky; top: 0; z-index: 10;">
          <div style="width: 200px; padding: 1rem 1.2rem; font-weight: 600; font-size: 0.75rem; color: var(--ghost); border-right: 1px solid var(--border); flex-shrink: 0; text-transform: uppercase;">Task</div>
          <div style="display: flex; flex: 1; min-width: 600px;">
            ${['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'].map(w => `
              <div style="flex: 1; text-align: center; padding: 1rem; font-weight: 600; font-size: 0.75rem; color: var(--ghost); border-right: 1px solid var(--border2); text-transform: uppercase;">${w}</div>
            `).join('')}
          </div>
        </div>
  `;

  grps.forEach(g => {
    html += `
        <div style="display: flex; border-bottom: 1px solid var(--border2); background: rgba(0,0,0,0.01);">
          <div style="width: 200px; padding: 0.7rem 1.2rem; font-weight: 700; font-size: 0.85rem; color: ${g.col}; border-right: 1px solid var(--border); flex-shrink: 0;">${g.name}</div>
          <div style="flex: 1; min-width: 600px; border-right: 1px solid var(--border2);"></div>
        </div>
    `;
    g.tasks.forEach((t, i) => {
      // Simulate random duration for visual effect based on name length to ensure consistency on re-renders
      const startBase = (t.nm.length * 7) % 60;
      const widthBase = 15 + ((t.nm.length * 3) % 40);
      const s = SM[t.st] || SM.todo;
      
      html += `
        <div style="display: flex; border-bottom: 1px solid var(--border2); position: relative; transition: background 0.15s;" onmouseover="this.style.background='var(--sel-row)'" onmouseout="this.style.background='transparent'">
          <div style="width: 200px; padding: 0.6rem 1.2rem; font-weight: 500; font-size: 0.8rem; color: var(--ink); border-right: 1px solid var(--border); flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" onclick="setView('table'); togExpTab('${t.id}','subtasks');" style="cursor: pointer;">${t.nm}</div>
          <div style="flex: 1; min-width: 600px; position: relative; display: flex; align-items: center; border-right: 1px solid var(--border2);">
            <!-- BG grid lines -->
            <div style="position: absolute; inset: 0; display: flex;">
              <div style="flex: 1; border-right: 1px dashed var(--border2);"></div>
              <div style="flex: 1; border-right: 1px dashed var(--border2);"></div>
              <div style="flex: 1; border-right: 1px dashed var(--border2);"></div>
              <div style="flex: 1;"></div>
            </div>
            <!-- Bar -->
            <div style="position: relative; left: ${startBase}%; width: ${widthBase}%; background: ${s.cls === 's-done' ? 'var(--green)' : 'var(--accent)'}; opacity: 0.9; border-radius: 6px; padding: 0.35rem 0.6rem; color: #fff; font-size: 0.7rem; font-weight: 600; white-space: nowrap; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.15s;" title="Status: ${s.l}" onmouseover="this.style.transform='scaleY(1.1)'" onmouseout="this.style.transform='none'" onclick="setView('table'); togExpTab('${t.id}','subtasks');">
              ${t.nm}
            </div>
          </div>
        </div>
      `;
    });
  });

  html += `
      </div>
    </div>
  `;
  return html;
}

function rReports() {
  const tot = grps.reduce((acc, g) => acc + g.tasks.length, 0);
  const done = grps.reduce((acc, g) => acc + g.tasks.filter(x => x.st==='done').length, 0);
  const pct = tot === 0 ? 0 : Math.round((done/tot)*100);

  return `
    <div style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.2rem; color: var(--ink);">Analytics & Reports</h2>
      <p style="font-size: 0.85rem; color: var(--ghost); margin-bottom: 1.5rem;">Burn down and velocity reports.</p>
      
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Circular Progress -->
        <div class="dash-card" style="flex: 1; min-width: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem;">
          <div style="position: relative; width: 160px; height: 160px; border-radius: 50%; background: conic-gradient(var(--accent) ${pct}%, var(--surface3) 0); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 10px rgba(0,0,0,0.05);">
            <div style="width: 140px; height: 140px; background: var(--surface); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
              <span style="font-size: 2.4rem; font-weight: 700; color: var(--ink);">${pct}%</span>
              <span style="font-size: 0.65rem; font-weight: 600; color: var(--ghost); text-transform: uppercase;">Completed</span>
            </div>
          </div>
        </div>
        
        <!-- Bar Chart -->
        <div class="dash-card" style="flex: 2; min-width: 400px; display: flex; flex-direction: column;">
          <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--ink); margin-bottom: 1.5rem;">Tasks by Assignee</h3>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 1.2rem; padding-right: 1rem;">
            ${Object.entries(T).map(([id, mem]) => {
              const ct = grps.reduce((acc, g) => acc + g.tasks.filter(x => x.own===id).length, 0);
              const maxCt = Math.max(...Object.keys(T).map(k => grps.reduce((a, g) => a + g.tasks.filter(x => x.own===k).length, 0)));
              const wd = maxCt === 0 ? 0 : Math.round((ct/maxCt)*100);
              if (ct === 0) return '';
              return `
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 100px; font-size: 0.85rem; font-weight: 600; color: var(--ink2);">${mem.name}</div>
                <div style="flex: 1; background: var(--surface3); height: 14px; border-radius: 99px; overflow: hidden; box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);">
                  <div style="height: 100%; width: ${wd}%; background: ${mem.c || 'var(--accent)'}; border-radius: 99px;"></div>
                </div>
                <div style="width: 24px; font-size: 0.85rem; font-weight: 700; color: var(--ink); text-align: right;">${ct}</div>
              </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

function rGrp(g) {
  const vis = g.tasks.filter(taskOk);
  const rows = g.open ? vis.map(t => rRow(g, t)).join('') : '';
  return `<div class="grp${g.open ? '' : ' collapsed'}" id="grp-${g.id}">
    <div class="grp-hdr" onclick="togGrp('${g.id}')">
      <div class="grp-pip" style="background:${g.col}"></div>
      <div class="grp-name" style="color:${g.col}">${g.name}</div>
      <div class="grp-ct">${vis.length}/${g.tasks.length}</div>
      <div class="grp-chev">▾</div>
    </div>
    <div class="tbl">
      <div class="tbl-head tbl-cols">
        <div class="th"></div><div class="th"></div>
        <div class="th">Task</div><div class="th">Owner</div>
        <div class="th">Taskforce</div><div class="th">Date</div>
        <div class="th">Status</div><div class="th">Progress</div>
        <div class="th">Files</div><div class="th">💬</div>
      </div>
      ${rows}
      <div class="add-row" onclick="addTask('${g.id}')">+ Add item</div>
    </div>
  </div>`;
}

function rRow(g, t) {
  const s = SM[t.st] || SM.todo, p = PR[t.pri] || PR.low;
  const dv = dd(t.dt), late = dv !== null && dv < 0 && t.st !== 'done', soon = dv !== null && dv >= 0 && dv <= 3 && t.st !== 'done';
  const isExp = exp.has(t.id), tab = tabs[t.id] || 'subtasks';
  const m = T[t.own] || {};
  const tf = t.tf.slice(0, 3), ex = t.tf.length - 3;
  const tfH = tf.map(id => { const x = T[id] || {}; return `<div class="av" style="background:${x.c};color:${x.t}">${id}</div>`; }).join('') + (ex > 0 ? `<div class="tf-more">+${ex}</div>` : '');
  return `
  <div class="trow tbl-cols${isExp ? ' exp' : ''}" id="tr-${t.id}"
    draggable="true"
    ondragstart="dSt(event,'${g.id}','${t.id}')"
    ondragover="dOv(event,'${t.id}')"
    ondragleave="dLv(event,'${t.id}')"
    ondrop="dDp(event,'${g.id}','${t.id}')">
    <div class="tc tc-drag">⠿</div>
    <div class="tc tc-pri" onclick="oPri('${g.id}','${t.id}',event)">
      <div class="ppip" style="background:${p.col};box-shadow:0 0 4px ${p.col}55"></div>
    </div>
    <div class="tc tc-name" onclick="togExp('${t.id}')">
      <span class="t-chev">▶</span>
      <span class="tname">${t.nm}</span>
      ${late ? '<span class="late-tag">OVERDUE</span>' : ''}
    </div>
    <div class="tc tc-own">
      <div class="av" style="background:${m.c};color:${m.t}">${t.own}</div>
      <span class="oname">${m.name}</span>
    </div>
    <div class="tc tc-tf"><div class="tf-stk">${tfH}</div></div>
    <div class="tc tc-date"><span class="${late ? 'dt-late' : soon ? 'dt-soon' : ''}">${t.dt}${late ? ' ⚠' : soon ? ' 🕐' : ''}</span></div>
    <div class="tc tc-st">
      <div class="stbadge ${s.cls}" onclick="oSt('${g.id}','${t.id}',event)">${s.l}</div>
    </div>
    <div class="tc tc-prog">
      <div class="prog-wrap">
        <div class="prog-bg"><div class="prog-fill" style="width:${t.pg}%;background:${g.col}"></div></div>
        <div class="prog-pct">${t.pg}%</div>
      </div>
    </div>
    <div class="tc tc-files" onclick="togExpTab('${t.id}','files')">
      <div class="mini-pill">${t.att.length ? '📎 ' + t.att.length : '+'}</div>
    </div>
    <div class="tc tc-cmt" onclick="togExpTab('${t.id}','comments')">
      <div class="mini-pill${tab === 'comments' && isExp ? ' hl' : ''}">${t.cmts.length}</div>
    </div>
  </div>
  <div class="ep${isExp ? ' open' : ''}" id="ep-${t.id}">
    ${isExp ? rPanel(g, t, tab) : ''}
  </div>`;
}

function rPanel(g, t, tab) {
  const ds = t.subs.filter(s => s.done).length;
  return `<div class="ep-inner">
    <div class="ep-tabs">
      <button class="ep-tab${tab === 'subtasks' ? ' on' : ''}" onclick="setTab('${t.id}','subtasks')">✓ Subtasks ${ds}/${t.subs.length}</button>
      <button class="ep-tab${tab === 'files' ? ' on' : ''}" onclick="setTab('${t.id}','files')">📎 Files ${t.att.length}</button>
      <button class="ep-tab${tab === 'comments' ? ' on' : ''}" onclick="setTab('${t.id}','comments')">💬 Comments ${t.cmts.length}</button>
    </div>
    <div class="ep-sec${tab === 'subtasks' ? ' on' : ''}">
      ${t.subs.map(s => {
    const sv = T[s.own] || {}; return `
      <div class="sub-row${s.done ? ' done' : ''}" id="sb-${s.id}">
        <div class="sub-cb" onclick="togSub('${g.id}','${t.id}','${s.id}')">${s.done ? '✓' : ''}</div>
        <div class="sub-nm">${s.n}</div>
        <span class="sub-ptag spt-${s.pri}">${PR[s.pri]?.l}</span>
        <div class="av" style="background:${sv.c};color:${sv.t};width:18px;height:18px;font-size:0.42rem">${s.own}</div>
      </div>`;
  }).join('')}
      <div class="sub-row">
        <div class="sub-cb"></div>
        <input class="sub-inp" placeholder="+ Add subtask  (Enter)" onkeydown="addSub(event,'${g.id}','${t.id}')">
      </div>
    </div>
    <div class="ep-sec${tab === 'files' ? ' on' : ''}">
      <div class="files-grid">
        ${t.att.map(a => `<div class="file-item">${a.ic} ${a.n} <span class="file-sz">${a.s}</span></div>`).join('')}
        <button class="file-add" onclick="addFile('${g.id}','${t.id}')">📎 Attach file</button>
      </div>
    </div>
    <div class="ep-sec${tab === 'comments' ? ' on' : ''}">
      <div class="cmt-list">
        ${t.cmts.map(c => {
    const cm = T[c.by] || {}; const stag = c.st ? `<span class="ci-stag" style="background:${SM[c.st]?.col}">${SM[c.st]?.l}</span>` : ''; const rxn = c.rx.length ? `<div class="ci-rxn">${c.rx.map(r => `<div class="rxn">${r}</div>`).join('')}</div>` : ''; return `
        <div class="ci">
          <div class="ci-av" style="background:${cm.c};color:${cm.t}">${c.by}</div>
          <div class="ci-body">
            <div class="ci-hd"><span class="ci-nm">${cm.name}</span><span class="ci-ts">${c.ts}</span>${stag}</div>
            <div class="ci-txt">${c.tx}</div>${rxn}
          </div>
        </div>`;
  }).join('')}
      </div>
      <div class="compose">
        <div class="c-me">AK</div>
        <div class="c-field"><input class="c-inp" id="ci-${t.id}" placeholder="Add a comment…" onkeydown="postCmt(event,'${g.id}','${t.id}')"></div>
        <button class="c-send" onclick="postCmtB('${g.id}','${t.id}')">Send</button>
      </div>
    </div>
  </div>`;
}

function rNotifs() {
  const u = notifs.filter(n => !n.r).length;
  const ndot = document.getElementById('ndot');
  if (ndot) ndot.className = 'notif-dot' + (u > 0 ? ' on' : '');
  const notifList = document.getElementById('notifList');
  if (notifList) {
    notifList.innerHTML = notifs.map(n => {
      const m = T[n.by] || {};
      return `<div class="np-item${n.r ? '' : ' unread'}" onclick="readN('${n.id}')">
        <div class="np-av" style="background:${m.c};color:${m.t}">${n.by}</div>
        <div class="np-bd"><div class="np-txt">${n.tx}</div><div class="np-tm">${n.tm}</div></div>
        ${n.r ? '' : '<div class="np-unread"></div>'}
      </div>`;
    }).join('');
  }
}

// ── INTERACTIONS ─────────────────────────────
function togGrp(id) { const g = grps.find(x => x.id === id); if (g) { g.open = !g.open; render(); } }

function togExp(tid) {
  if (exp.has(tid)) exp.delete(tid);
  else { exp.add(tid); if (!tabs[tid]) tabs[tid] = 'subtasks'; }
  render();
}

function togExpTab(tid, tab) {
  tabs[tid] = tab; exp.add(tid); render();
  setTimeout(() => document.getElementById('ep-' + tid)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 40);
}

function setTab(tid, tab) { tabs[tid] = tab; render(); setTimeout(() => document.getElementById('ep-' + tid)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 30); }

function togSub(gid, tid, sid) {
  const g = grps.find(x => x.id === gid), t = g?.tasks.find(x => x.id === tid), s = t?.subs.find(x => x.id === sid);
  if (!s) return; s.done = !s.done;
  const dn = t.subs.filter(x => x.done).length;
  t.pg = t.subs.length ? Math.round(dn / t.subs.length * 100) : t.pg;
  render(); setTimeout(() => { exp.add(tid); render(); }, 8);
  toast(s.done ? '✓ Subtask complete' : 'Subtask reopened');
}

function addSub(e, gid, tid) {
  if (e.key !== 'Enter') return;
  const v = e.target.value.trim(); if (!v) return;
  const g = grps.find(x => x.id === gid), t = g?.tasks.find(x => x.id === tid);
  t?.subs.push({ id: 's_' + Date.now(), n: v, done: false, pri: 'med', own: 'AK' });
  render(); setTimeout(() => { exp.add(tid); render(); }, 8); toast('Subtask added');
}

function addFile(gid, tid) {
  const opts = [['Design.fig', '🎨', '1.2 MB'], ['Report.pdf', '📄', '340 KB'], ['Data.xlsx', '📊', '890 KB'], ['Mockup.png', '🖼️', '2.4 MB'], ['Notes.docx', '📝', '56 KB']];
  const [n, ic, s] = opts[Math.floor(Math.random() * 5)];
  const g = grps.find(x => x.id === gid), t = g?.tasks.find(x => x.id === tid);
  t?.att.push({ n, ic, s });
  notifs.unshift({ id: 'n_' + Date.now(), by: 'AK', tx: `<strong>You</strong> attached <strong>${n}</strong> to <strong>${t.nm}</strong>`, tm: 'Just now', r: false });
  render(); setTimeout(() => { exp.add(tid); tabs[tid] = 'files'; render(); }, 8); toast('📎 File attached');
}

// STATUS
function oSt(gid, tid, e) {
  e.stopPropagation(); sPick = { gid, tid };
  const pop = document.getElementById('stPop');
  pop.innerHTML = Object.entries(SM).map(([k, v]) => `<div class="po-opt" onclick="apSt('${k}')"><div class="po-dot" style="background:${v.col}"></div>${v.l}</div>`).join('');
  pop.style.display = 'block'; posP(pop, e);
}
function apSt(s) {
  if (!sPick) return;
  const g = grps.find(x => x.id === sPick.gid), t = g?.tasks.find(x => x.id === sPick.tid);
  if (t) {
    t.st = s; if (s === 'done') t.pg = 100;
    t.cmts.push({ id: 'a_' + Date.now(), by: 'AK', ts: 'Just now', tx: 'Updated status to', st: s, rx: [] });
    notifs.unshift({ id: 'n_' + Date.now(), by: 'AK', tx: `<strong>You</strong> changed <strong>${t.nm}</strong> to <strong>${SM[s].l}</strong>`, tm: 'Just now', r: false });
    exp.add(t.id); tabs[t.id] = 'comments';
  }
  document.getElementById('stPop').style.display = 'none'; sPick = null;
  render(); toast('Status → ' + SM[s]?.l);
}

// PRIORITY
function oPri(gid, tid, e) {
  e.stopPropagation(); pPick = { gid, tid };
  const g = grps.find(x => x.id === gid), t = g?.tasks.find(x => x.id === tid);
  const pop = document.getElementById('prPop');
  pop.innerHTML = Object.entries(PR).map(([k, v]) => `<div class="po-opt" onclick="apPr('${k}')"><div class="po-dot" style="background:${v.col}"></div>${v.l}${t?.pri === k ? '<span class="po-check">✓</span>' : ''}</div>`).join('');
  pop.style.display = 'block'; posP(pop, e);
}
function apPr(p) {
  if (!pPick) return;
  const g = grps.find(x => x.id === pPick.gid), t = g?.tasks.find(x => x.id === pPick.tid);
  if (t) t.pri = p;
  document.getElementById('prPop').style.display = 'none'; pPick = null;
  render(); toast('Priority → ' + PR[p]?.l);
}
function posP(pop, e) { const x = Math.min(e.clientX, innerWidth - 160), y = Math.min(e.clientY + 8, innerHeight - 200); pop.style.left = x + 'px'; pop.style.top = y + 'px'; }
document.addEventListener('click', () => {
  const stPop = document.getElementById('stPop');
  const prPop = document.getElementById('prPop');
  if (stPop) stPop.style.display = 'none';
  if (prPop) prPop.style.display = 'none';
});

// COMMENTS
function postCmt(e, gid, tid) { if (e.key === 'Enter') postCmtB(gid, tid); }
function postCmtB(gid, tid) {
  const inp = document.getElementById('ci-' + tid); if (!inp) return;
  const v = inp.value.trim(); if (!v) return;
  const g = grps.find(x => x.id === gid), t = g?.tasks.find(x => x.id === tid); if (!t) return;
  t.cmts.push({ id: 'c_' + Date.now(), by: 'AK', ts: 'Just now', tx: v, st: null, rx: [] });
  notifs.unshift({ id: 'n_' + Date.now(), by: 'AK', tx: `<strong>You</strong> commented on <strong>${t.nm}</strong>`, tm: 'Just now', r: false });
  render(); setTimeout(() => { exp.add(tid); tabs[tid] = 'comments'; render(); }, 8); toast('Comment posted');
}

// ADD MODALS
let modalMode = null;
let targetGid = null;

function closeModal(cancel) {
  document.getElementById('sysModal').classList.remove('open');
  modalMode = null; targetGid = null;
  document.getElementById('modalSubmit').style.display = 'block'; // Reset display
}

function addGrpPrompt() {
  modalMode = 'group';
  document.getElementById('modalTitle').textContent = 'Create New Group';
  document.getElementById('modalBody').innerHTML = `
    <div class="input-grp">
      <label>Group / Milestone Name</label>
      <input type="text" id="mGrpName" placeholder="e.g. Q4 Marketing Plan" autocomplete="off" autofocus>
    </div>
  `;
  document.getElementById('modalSubmit').textContent = 'Create Group';
  document.getElementById('modalSubmit').onclick = saveGroup;
  document.getElementById('sysModal').classList.add('open');
  setTimeout(() => document.getElementById('mGrpName')?.focus(), 100);
}

function saveGroup() {
  const n = document.getElementById('mGrpName').value.trim();
  if(!n) return toast('Group name required');
  const cs = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']; 
  grps.push({ id: 'g_' + Date.now(), name: n, col: cs[grps.length % cs.length], open: true, tasks: [] }); 
  closeModal(); render(); toast('Group created');
}

function addTask(gid) {
  modalMode = 'task'; targetGid = gid;
  document.getElementById('modalTitle').textContent = 'Create New Task';
  
  const gOpts = grps.map(g => `<option value="${g.id}" ${g.id === gid ? 'selected' : ''}>${g.name}</option>`).join('');
  
  document.getElementById('modalBody').innerHTML = `
    <div class="input-grp">
      <label>Task Name</label>
      <input type="text" id="mTaskName" placeholder="What needs to be done?" autocomplete="off" autofocus>
    </div>
    <div class="input-row">
      <div class="input-grp">
        <label>Group</label>
        <select id="mTaskGroup">${gOpts}</select>
      </div>
      <div class="input-grp">
        <label>Assignee</label>
        <select id="mTaskAssignee">
          ${Object.entries(T).map(([id, mem]) => `<option value="${id}">${mem.name}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="input-row">
      <div class="input-grp">
        <label>Status</label>
        <select id="mTaskStatus">
          <option value="todo">To Do</option>
          <option value="wip">In Progress</option>
          <option value="review">In Review</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div class="input-grp">
        <label>Priority</label>
        <select id="mTaskPri">
          <option value="low">Low</option>
          <option value="med" selected>Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>
  `;
  document.getElementById('modalSubmit').textContent = 'Create Task';
  document.getElementById('modalSubmit').onclick = saveTask;
  document.getElementById('sysModal').classList.add('open');
  setTimeout(() => document.getElementById('mTaskName')?.focus(), 100);
}

function saveTask() {
  const nm = document.getElementById('mTaskName').value.trim();
  if(!nm) return toast('Task name required');
  const selGid = document.getElementById('mTaskGroup').value;
  const own = document.getElementById('mTaskAssignee').value;
  const st = document.getElementById('mTaskStatus').value;
  const pri = document.getElementById('mTaskPri').value;
  
  const g = grps.find(x => x.id === (selGid || targetGid));
  if(g) {
    g.tasks.push({ 
      id: 't_' + Date.now(), nm, own, tf: [], 
      dt: 'TBD', st, pri, pg: 0, att: [], subs: [], cmts: [] 
    });
  }
  closeModal(); 
  if (currentView !== 'board' && currentView !== 'table' && currentView !== 'overview') {
    setView('table');
  } else {
    render(); 
  }
  toast('Task created');
}

// DRAG
function dSt(e, gid, tid) { dragId = { gid, tid }; document.getElementById('tr-' + tid)?.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function dOv(e, tid) { e.preventDefault(); document.getElementById('tr-' + tid)?.classList.add('drag-over'); }
function dLv(e, tid) { document.getElementById('tr-' + tid)?.classList.remove('drag-over'); }
function dDp(e, gid, tid) {
  e.preventDefault(); document.getElementById('tr-' + tid)?.classList.remove('drag-over');
  if (!dragId || dragId.tid === tid) return;
  const sg = grps.find(x => x.id === dragId.gid), dg = grps.find(x => x.id === gid);
  const si = sg?.tasks.findIndex(x => x.id === dragId.tid), di = dg?.tasks.findIndex(x => x.id === tid);
  if (si < 0 || di < 0) return;
  const [task] = sg.tasks.splice(si, 1); dg.tasks.splice(di, 0, task);
  dragId = null; render(); toast('Task moved');
}

// KANBAN DRAG
function kDSt(e, gid, tid) { dragId = { gid, tid }; e.dataTransfer.effectAllowed = 'move'; }
function kDOv(e, el) { e.preventDefault(); el.classList.add('k-drag-over'); }
function kDLv(e, el) { el.classList.remove('k-drag-over'); }
function kDDp(e, targetStatus) {
  e.preventDefault(); 
  document.querySelectorAll('.k-col').forEach(c => c.classList.remove('k-drag-over'));
  if (!dragId) return;
  
  const g = grps.find(x => x.id === dragId.gid);
  const t = g?.tasks.find(x => x.id === dragId.tid);
  
  if (t) {
    if (t.st !== targetStatus) {
      t.st = targetStatus;
      if (targetStatus === 'done') t.pg = 100;
      t.cmts.push({ id: 'a_' + Date.now(), by: 'AK', ts: 'Just now', tx: 'Moved to', st: targetStatus, rx: [] });
      toast(`Moved to ${SM[targetStatus]?.l || targetStatus}`);
    }
  }
  dragId = null; render();
}

// FILTER
function setFilter(el, f) { document.querySelectorAll('.fpill').forEach(c => c.classList.remove('on')); el.classList.add('on'); filt = f; render(); }
function onSearch(q) { srch = q; render(); }

// NOTIFS
function toggleNotif() { document.getElementById('notifPanel').classList.toggle('open'); }
function readN(id) { const n = notifs.find(x => x.id === id); if (n) n.r = true; rNotifs(); }

// DARK
function toggleDark() {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  const darkBtn = document.getElementById('darkBtn');
  if (darkBtn) darkBtn.textContent = dark ? '☀️' : '🌙';
}

// Initialize sidebar listeners
function initSidebar() {
  // Sidebar clicks now managed by inline onclick="setView('...')"
}

function rSidebarTeam() {
  const list = document.getElementById('sb-team-list');
  if (!list) return;
  list.innerHTML = Object.entries(T).map(([id, p]) => `
    <div class="sb-member" onclick="toast('${p.name} - ${p.role}')">
      <div class="sb-av" style="background:${p.c};color:${p.t}">
        ${id}
        <div class="av-dot ${p.online ? 'd-on' : 'd-off'}"></div>
      </div>
      <span class="sb-mname">${p.name}</span>
      <span class="sb-mrole">${p.dept}</span>
    </div>
  `).join('');
}

// TOAST
let _tt;
function toast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg; t.classList.add('show'); clearTimeout(_tt);
    _tt = setTimeout(() => t.classList.remove('show'), 2000);
  }
}

// ON LOAD
window.addEventListener('DOMContentLoaded', () => {
  render();
  rSidebarTeam();
  initSidebar();
});
