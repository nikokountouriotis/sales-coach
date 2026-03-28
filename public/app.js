// --- Navigation ---
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  document.getElementById('page-' + pageId)?.classList.add('active');
  document.querySelector(`[data-page="${pageId}"]`)?.classList.add('active');
  if (pageId === 'dashboard') loadDashboard();
  if (pageId === 'calls') loadCalls();
}

navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

// Hero CTA button
document.getElementById('hero-cta')?.addEventListener('click', e => {
  e.preventDefault();
  showPage('submit');
});

document.getElementById('back-btn').addEventListener('click', () => showPage('calls'));

// Set today's date as default
document.getElementById('call-date').valueAsDate = new Date();

// --- Helpers ---
function gradeColor(grade) {
  const g = (grade || '').toUpperCase();
  if (g === 'A') return 'green';
  if (g === 'B') return 'cyan';
  if (g === 'C') return 'yellow';
  if (g === 'D') return 'orange';
  return 'red';
}

function gradeClass(grade) {
  return 'grade-' + (grade || 'f').toLowerCase();
}

function scoreClass(grade) {
  return 'score-' + (grade || 'f').toLowerCase();
}

function pillClass(score) {
  return 'pill pill-' + Math.min(5, Math.max(1, Math.round(score)));
}

function barColor(score, max) {
  const pct = score / max;
  if (pct >= 0.8) return 'var(--green)';
  if (pct >= 0.6) return 'var(--cyan)';
  if (pct >= 0.4) return 'var(--yellow)';
  if (pct >= 0.2) return 'var(--orange)';
  return 'var(--red)';
}

// --- Demo Data ---
const DEMO_DATA = {
  total_calls: 12,
  avg_score: 71.5,
  latest_grade: 'B',
  reps: ['Niko', 'Sarah', 'Marcus'],
  trend: [
    { prospect_name: 'Colin M.', total_score: 46 },
    { prospect_name: 'Ezekiel R.', total_score: 42 },
    { prospect_name: 'Bryan B.', total_score: 58 },
    { prospect_name: 'Linda K.', total_score: 65 },
    { prospect_name: 'James W.', total_score: 72 },
    { prospect_name: 'Tanya H.', total_score: 68 },
    { prospect_name: 'Derek P.', total_score: 78 },
    { prospect_name: 'Michelle S.', total_score: 82 },
    { prospect_name: 'Robert C.', total_score: 75 },
    { prospect_name: 'Amanda L.', total_score: 85 },
    { prospect_name: 'Kevin T.', total_score: 79 },
    { prospect_name: 'Jessica N.', total_score: 88 }
  ],
  weakest_areas: [
    { name: 'Connecting Statement', type: 'stage', avg: 2.1 },
    { name: 'Qualifying Questions', type: 'stage', avg: 2.4 },
    { name: 'Tonality Control', type: 'technique', avg: 2.7 },
    { name: 'Consequence Questions', type: 'stage', avg: 3.0 },
    { name: 'Labeling', type: 'technique', avg: 3.2 }
  ],
  stage_averages: [
    { stage_name: '1. Connecting Statement', avg_score: 2.1 },
    { stage_name: '2. Situation Questions', avg_score: 3.8 },
    { stage_name: '3. Problem Awareness', avg_score: 3.5 },
    { stage_name: '4. Solution Awareness', avg_score: 3.2 },
    { stage_name: '5. Consequence Questions', avg_score: 3.0 },
    { stage_name: '6. Qualifying Questions', avg_score: 2.4 },
    { stage_name: '7. Transition', avg_score: 4.1 },
    { stage_name: '8. Presentation', avg_score: 3.6 },
    { stage_name: '9. Close', avg_score: 3.3 }
  ],
  technique_averages: [
    { technique_name: 'Tonality Control', avg_score: 2.7 },
    { technique_name: 'Labeling', avg_score: 3.2 },
    { technique_name: 'Mirroring', avg_score: 3.5 },
    { technique_name: 'Pacing & Leading', avg_score: 3.8 },
    { technique_name: 'Reframing', avg_score: 3.4 },
    { technique_name: 'Future Pacing', avg_score: 4.0 },
    { technique_name: 'Sleight of Mouth', avg_score: 2.9 }
  ]
};

// --- Submit Form ---
document.getElementById('submit-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');

  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline-flex';

  try {
    const body = {
      rep_name: document.getElementById('rep-name').value.trim(),
      prospect_name: document.getElementById('prospect-name').value.trim(),
      call_date: document.getElementById('call-date').value,
      transcript: document.getElementById('transcript').value.trim()
    };

    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Review failed');

    showReview(data.id, data.review, body.rep_name, body.prospect_name, body.call_date);
    document.getElementById('transcript').value = '';

  } catch (err) {
    alert('Error: ' + err.message);
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
});

// --- Dashboard ---
async function loadDashboard() {
  const rep = document.getElementById('rep-filter').value;
  const url = rep ? `/api/stats?rep=${encodeURIComponent(rep)}` : '/api/stats';

  let data;
  let isDemo = false;

  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (err) {
    console.error('Dashboard error:', err);
    data = { total_calls: 0, avg_score: 0, latest_grade: '', reps: [], trend: [], weakest_areas: [], stage_averages: [], technique_averages: [] };
  }

  // If no real data, show demo
  if (data.total_calls === 0) {
    isDemo = true;
    data = DEMO_DATA;
  }

  // Toggle hero section
  const hero = document.getElementById('hero-section');
  const demoDash = document.getElementById('demo-dashboard');
  if (hero) {
    hero.style.display = isDemo ? 'block' : 'none';
  }
  if (demoDash && isDemo) {
    demoDash.classList.add('demo-mode');
  } else if (demoDash) {
    demoDash.classList.remove('demo-mode');
  }

  // Update title
  const titleEl = document.getElementById('dashboard-title');
  if (titleEl) {
    titleEl.textContent = isDemo ? 'Preview Dashboard (Demo Data)' : 'Performance Dashboard';
  }

  document.getElementById('stat-total').textContent = data.total_calls;
  document.getElementById('stat-avg').textContent = data.avg_score || '--';
  const gradeEl = document.getElementById('stat-grade');
  gradeEl.textContent = data.latest_grade || '--';
  gradeEl.className = 'stat-value ' + scoreClass(data.latest_grade);

  // Rep filter
  const filter = document.getElementById('rep-filter');
  const currentVal = filter.value;
  filter.innerHTML = '<option value="">All Reps</option>';
  (data.reps || []).forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    if (r === currentVal) opt.selected = true;
    filter.appendChild(opt);
  });

  // Trend chart
  const trendDiv = document.getElementById('trend-chart');
  if ((data.trend || []).length === 0) {
    trendDiv.innerHTML = '<div class="empty-state">Submit calls to see your score trend</div>';
  } else {
    trendDiv.innerHTML = data.trend.map(t => {
      const h = Math.max(8, (t.total_score / 100) * 170);
      const color = barColor(t.total_score, 100);
      return `<div class="trend-bar-wrap">
        <div class="trend-bar" style="height:${h}px; background:${color};" title="${t.prospect_name}: ${t.total_score}/100">
          <span class="trend-bar-score">${t.total_score}</span>
        </div>
        <span class="trend-bar-label">${t.prospect_name}</span>
      </div>`;
    }).join('');
  }

  // Weakest areas
  const weakDiv = document.getElementById('weakest-areas');
  if ((data.weakest_areas || []).length === 0) {
    weakDiv.innerHTML = '<div class="empty-state">No data yet</div>';
  } else {
    weakDiv.innerHTML = data.weakest_areas.map((w, i) => `
      <div class="weakness-item">
        <span class="weakness-rank">#${i + 1}</span>
        <span class="weakness-name">${w.name}</span>
        <span class="weakness-type ${w.type}">${w.type}</span>
        <span class="weakness-score" style="color:${barColor(w.avg, 5)}">${w.avg.toFixed(1)}/5</span>
      </div>
    `).join('');
  }

  // Stage averages
  const stageDiv = document.getElementById('stage-averages');
  if ((data.stage_averages || []).length === 0) {
    stageDiv.innerHTML = '<div class="empty-state">No data yet</div>';
  } else {
    stageDiv.innerHTML = data.stage_averages.map(s => `
      <div class="bar-row">
        <span class="bar-label">${s.stage_name}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(s.avg_score / 5) * 100}%; background:${barColor(s.avg_score, 5)};"></div>
        </div>
        <span class="bar-value" style="color:${barColor(s.avg_score, 5)}">${s.avg_score.toFixed(1)}</span>
      </div>
    `).join('');
  }

  // Technique averages
  const techDiv = document.getElementById('technique-averages');
  if ((data.technique_averages || []).length === 0) {
    techDiv.innerHTML = '<div class="empty-state">No data yet</div>';
  } else {
    techDiv.innerHTML = data.technique_averages.map(t => `
      <div class="bar-row">
        <span class="bar-label">${t.technique_name}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${(t.avg_score / 5) * 100}%; background:${barColor(t.avg_score, 5)};"></div>
        </div>
        <span class="bar-value" style="color:${barColor(t.avg_score, 5)}">${t.avg_score.toFixed(1)}</span>
      </div>
    `).join('');
  }
}

document.getElementById('rep-filter').addEventListener('change', loadDashboard);

// --- Call History ---
async function loadCalls() {
  try {
    const res = await fetch('/api/calls');
    const calls = await res.json();
    const list = document.getElementById('calls-list');

    if (calls.length === 0) {
      list.innerHTML = '<div class="empty-state">No calls reviewed yet. Submit your first call to get started.</div>';
      return;
    }

    list.innerHTML = calls.map(c => `
      <div class="call-row" data-id="${c.id}">
        <span class="call-rep">${c.rep_name}</span>
        <span class="call-prospect">${c.prospect_name}</span>
        <span class="call-date">${c.call_date}</span>
        <span class="call-score ${scoreClass(c.grade)}">${c.total_score}/100</span>
        <span class="call-grade ${gradeClass(c.grade)}">${c.grade}</span>
        <button class="btn btn-danger delete-call" data-id="${c.id}" title="Delete">Delete</button>
      </div>
    `).join('');

    list.querySelectorAll('.call-row').forEach(row => {
      row.addEventListener('click', async e => {
        if (e.target.classList.contains('delete-call')) return;
        const id = row.dataset.id;
        const res = await fetch(`/api/calls/${id}`);
        const data = await res.json();
        if (data.review) {
          showReview(id, data.review, data.rep_name, data.prospect_name, data.call_date);
        }
      });
    });

    list.querySelectorAll('.delete-call').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        if (!confirm('Delete this call review?')) return;
        await fetch(`/api/calls/${btn.dataset.id}`, { method: 'DELETE' });
        loadCalls();
      });
    });
  } catch (err) {
    console.error('Load calls error:', err);
  }
}

// --- Show Review ---
function showReview(id, review, repName, prospectName, callDate) {
  pages.forEach(p => p.classList.remove('active'));
  navLinks.forEach(l => l.classList.remove('active'));
  document.getElementById('page-review').classList.add('active');

  const gc = gradeColor(review.grade);
  const content = document.getElementById('review-content');

  let html = '';

  html += `<div class="review-header">
    <h1>Call Review - ${prospectName}</h1>
    <div class="review-meta">${repName} | ${callDate} | ${review.call_duration || ''} | ${review.outcome || ''}</div>
  </div>`;

  html += `<div class="prospect-card-review">
    <div><span class="pc-label">Prospect Type</span><br><span class="pc-value" style="font-weight:600; color:var(--cyan);">${review.prospect_type || '-'}</span></div>
    <div><span class="pc-label">Outcome</span><br><span class="pc-value">${review.outcome || '-'}</span></div>
  </div>`;

  html += `<div class="score-banner">
    <h3>Scoring Summary</h3>
    <div class="score-row">
      <div class="score-box"><div class="num">${review.stage_execution_total || 0}</div><div class="lbl">Stage Execution / 45</div></div>
      <div class="score-box"><div class="num">${review.technique_total || 0}</div><div class="lbl">Techniques / 35</div></div>
      <div class="score-box"><div class="num">${review.coaching_total || 0}</div><div class="lbl">Coaching / 20</div></div>
    </div>
    <div class="total-score-box" style="border-color:var(--${gc}); background:rgba(${gc === 'red' ? '239,68,68' : gc === 'orange' ? '249,115,22' : gc === 'yellow' ? '234,179,8' : gc === 'cyan' ? '6,182,212' : '34,197,94'},0.1);">
      <div class="num" style="color:var(--${gc});">${review.total_score}/100</div>
      <div class="grade-text" style="color:var(--${gc});">Grade ${review.grade} - ${review.grade_label || ''}</div>
    </div>
  </div>`;

  html += `<div class="section-hdr"><h2>Part 1 - Stage Execution</h2><span class="badge badge-stage">60% of total</span></div>`;

  if (review.stages) {
    review.stages.forEach(stage => {
      html += `<div class="stage-card">
        <div class="stage-top">
          <span class="stage-name">Stage ${stage.number} - ${stage.name}</span>
          <span class="${pillClass(stage.score)}">${stage.score}/5</span>
        </div>`;

      if (stage.hits?.length) {
        html += `<div class="hm-label hit-label">Hits</div>`;
        stage.hits.forEach(h => {
          html += `<div class="hm-item hit-item">`;
          if (h.timestamp) html += `<span class="timestamp">[${h.timestamp}]</span> `;
          html += h.text;
          if (h.quote) html += ` <span class="quote">"${h.quote}"</span>`;
          html += `</div>`;
        });
      }

      if (stage.misses?.length) {
        html += `<div class="hm-label miss-label">Misses</div>`;
        stage.misses.forEach(m => {
          html += `<div class="hm-item miss-item">`;
          if (m.timestamp) html += `<span class="timestamp">[${m.timestamp}]</span> `;
          html += m.text;
          if (m.quote) html += ` <span class="quote">"${m.quote}"</span>`;
          html += `</div>`;
        });
      }

      if (stage.word_tracks?.length) {
        stage.word_tracks.forEach(wt => {
          html += `<div class="wt-box"><div class="wt-label">Suggested Word Track</div>`;
          if (wt.context) html += `<p style="color:var(--text-muted); font-style:italic; margin-bottom:0.5rem;">${wt.context}</p>`;
          wt.lines?.forEach(line => { html += `<p>${line}</p>`; });
          html += `</div>`;
        });
      }

      if (stage.coach_notes?.length) {
        html += `<div class="coach-box"><div class="coach-label">Coach Notes</div>`;
        stage.coach_notes.forEach(n => html += `<p>${n}</p>`);
        html += `</div>`;
      }

      html += `</div>`;
    });
  }

  html += `<div class="section-hdr"><h2>Part 2 - Cross-Cutting Techniques</h2><span class="badge badge-tech">25% of total</span></div>`;

  if (review.techniques) {
    review.techniques.forEach(tech => {
      html += `<div class="stage-card">
        <div class="stage-top">
          <span class="stage-name">${tech.name}</span>
          <span class="${pillClass(tech.score)}">${tech.score}/5</span>
        </div>
        <p style="font-size:0.88rem; color:#d1d5db; margin-bottom:0.5rem;">${tech.details || ''}</p>`;
      if (tech.improvement) {
        html += `<div class="coach-box"><div class="coach-label">Improvement</div><p>${tech.improvement}</p></div>`;
      }
      html += `</div>`;
    });
  }

  if (review.rewrites?.length) {
    html += `<div class="section-hdr"><h2>Script Rewrites</h2><span class="badge badge-stage">What to say instead</span></div>`;
    review.rewrites.forEach(rw => {
      html += `<div class="rewrite-card">
        <div class="rewrite-title">${rw.title}</div>
        <div class="rewrite-context">${rw.context || ''}</div>`;
      if (rw.original_lines?.length) {
        html += `<p style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--red); font-weight:700; margin-bottom:0.4rem;">What was said:</p>`;
        rw.original_lines.forEach(l => html += `<div class="rewrite-line" style="opacity:0.6;">${l}</div>`);
        html += `<p style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.04em; color:var(--green); font-weight:700; margin:0.75rem 0 0.4rem;">What to say instead:</p>`;
      }
      rw.rewrite_lines?.forEach(l => html += `<div class="rewrite-line">${l}</div>`);
      if (rw.why) html += `<div class="rewrite-why">${rw.why}</div>`;
      html += `</div>`;
    });
  }

  if (review.upstream_diagnosis?.length) {
    html += `<div class="section-hdr"><h2>Part 3 - Upstream Diagnosis</h2><span class="badge badge-coach">Root cause analysis</span></div>`;
    review.upstream_diagnosis.forEach(u => {
      html += `<div class="upstream-card">
        <div class="upstream-title">${u.objection}</div>
        <div class="upstream-detail"><strong>Root stage:</strong> ${u.root_stage}</div>
        <div class="upstream-detail">${u.explanation}</div>
        <div class="upstream-detail" style="color:var(--green);"><strong>Fix:</strong> ${u.fix}</div>
      </div>`;
    });
  }

  if (review.top_3_improvements?.length) {
    html += `<div class="improvement-card">
      <div class="improvement-title">Top 3 Areas to Improve</div>`;
    review.top_3_improvements.forEach(imp => {
      html += `<div class="improvement-item"><strong>${imp.area}</strong> <span class="action-priority" style="color:${imp.priority === 'HIGH' ? 'var(--red)' : imp.priority === 'MEDIUM' ? 'var(--orange)' : 'var(--yellow)'};">[${imp.priority}]</span> - ${imp.description}</div>`;
    });
    html += `</div>`;
  }

  if (review.action_plan?.length) {
    html += `<div class="action-card">
      <div class="action-title">Action Plan</div>`;
    review.action_plan.forEach(a => {
      html += `<div class="action-item"><span class="action-priority" style="color:var(--orange);">[${a.priority}]</span> ${a.action}</div>`;
    });
    html += `</div>`;
  }

  content.innerHTML = html;
}

// --- Init ---
loadDashboard();
