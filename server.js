const express = require('express');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

// Load .env manually (no dotenv dependency)
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
  }
} catch (e) {}

const app = express();
const PORT = process.env.PORT || 3000;

// --- JSON File Database ---
const DB_PATH = path.join(__dirname, 'db', 'calls.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (e) {}
  return { calls: [], nextId: 1 };
}

function saveDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Middleware ---
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// --- Claude API Client ---
function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set. Create a .env file with your key.');
  return new Anthropic.default({ apiKey });
}

// --- The Rubric System Prompt ---
const SYSTEM_PROMPT = `You are an elite sales call reviewer trained on the NEPQ (Neuro-Emotional Persuasion Questioning) framework, specifically adapted for high-ticket biz-op / crypto payment processing sales calls. You review calls using a proprietary rubric built by Niko Kountouriotis based on Johnny Mau's HTS (How to Sell) framework.

## SCORING SYSTEM

Score each item on a 1-5 scale:
- 1 = Missed / Harmful
- 2 = Attempted, Ineffective
- 3 = Adequate / Hit Basics
- 4 = Strong, Good Adaptation
- 5 = Elite / Natural Flow

## PART 1: STAGE EXECUTION (60% of total â scored out of 45)

Stage 1 â Report Phase (Weight: 8%, ~3 min target)
Context: Many prospects are vague or don't know what they want yet. Closer needs to guide without leading.
Required Outcomes:
- Got the prospect's desired outcome (what they want to achieve)
- Identified what they need help with to get there
- Uncovered WHY that specifically â got to experience / tangible problem
- If prospect was vague/confused: provided options tied to problems the offer solves
1-2: Skipped or rushed. Accepted vague answers. Didn't uncover why now.
3: Got desired outcome and general "need help with." Didn't dig into WHY.
4-5: All outcomes achieved. Used softeners/mirrors. Got to tangible problem. Conversational, not interrogative.

Stage 2 â Exploratory Phase (Weight: 7%)
Context: Their "current situation" is their job or whatever they've been doing.
Required Outcomes:
- Established what they're currently doing (job, side hustle, previous attempt)
- How long they've been in that situation
- Got them to subconsciously blame their current process/situation for their results
1-2: Skipped or asked about crypto experience (irrelevant). No blame transfer.
3: Established situation but didn't anchor how long or blame transfer.
4-5: Clear situation, duration, blame shifted naturally to current path.

Stage 3 â Problem Phase (Weight: 10%)
Context: Problems built around their current life â stuck at job, no freedom, capped income.
Required Outcomes (The Big Three):
- Problem identified clearly
- Cause uncovered (root cause)
- Impact extracted (life/business/emotional consequences)
- Timeline anchor: "How long has this been going on?"
- Adapted depth to prospect sophistication
1-2: Only surface problem. No cause/impact. Wrong tone for prospect type.
3: Got problem + one of cause/impact. Missing full triangle.
4-5: All three locked in. Problem feels heavy and real. Timeline anchored.

Stage 4 â Alignment / Pre-Handling (Weight: 12%)
Context: Most common is Route 2 (haven't invested). Expand the time gap.
Required Outcomes:
- Discovered behavior pattern: investor, DIYer, or do-nothing
- Used BROAD â NARROW questioning
- If Route 2: uncovered real reason â money, time, fear, excuses
- Called out excuses and reframed around resourcefulness
- Expanded time gap
- Pre-handled likely objection
- If limiting belief: found EXPERIENCE behind it, used IFâTHENâMEANS
1-2: Went narrow immediately. Accepted excuses. No pre-handling. Set up objection to explode.
3: Broad questions but weak follow-through. Some pre-handling but scripted.
4-5: Full broadânarrow funnel. Expanded time gap. Called out excuses. Natural pre-handling.

Stage 5 â Buying Criteria (Weight: 5%)
Context: Prospects don't know what they need in crypto training. Stage becomes: what do they value in a program?
Required Outcomes:
- Uncovered what they value (accountability, proven system, community, etc.)
- Got specific enough to tailor presentation
- Wrote down exact words for callback
1-2: Skipped or too narrow. No ammo for presentation.
3: General sense but not specific.
4-5: Specific criteria captured in prospect's exact words. Shows up in presentation.

Stage 6 â Desired State (Weight: 10%)
Context: BUILD THE DREAM. Push past humble goals. Usain Bolt technique.
Required Outcomes (In Order):
- Income goal extracted (pushed past safe answers)
- Tangible outcome â lifestyle, car, house, quitting job
- Emotional outcome â how it FEELS
- The GAP â contrasted desired vs current feeling
- Timeline â "How long have you felt this way?"
- Consequence of feeling
1-2: Accepted "make more money." No layering. No gap. No roller coaster.
3: Income + some lifestyle. Attempted gap but didn't let prospect sit in it.
4-5: Full roller coaster UPâDOWN. Pushed past humble goals. Consequenced the FEELING not the activity.

Stage 7 â Reality Check (Weight: 5%)
Context: "What happens if you never escape the 9-to-5?" Should land hard after strong desired state.
Required Outcomes:
- Prospect articulated what happens if nothing changes
- Emotional weight (not deflection)
- If weak: re-asked or identified upstream problem
1-2: Skipped or accepted "I'll be fine."
3: Asked, got reasonable answer. Didn't amplify or sit in it.
4-5: Prospect felt cost of inaction. Closer let silence land. Bridge to presentation felt inevitable.

Stage 8 â Presentation (Weight: 8%)
Context: Should feel like program was BUILT for this prospect. Use their words.
Required Outcomes:
- Referenced buying criteria using EXACT words
- Normalized the problem
- Delivered solution using how they want to learn
- Anchored to desired state/emotional outcome
- Checked: "Does that resonate?"
- Pre-handling labels included
1-2: Generic pitch. No callbacks. Prospect heard a sales pitch not a solution.
3: Some callbacks but forced. Didn't label or pre-handle.
4-5: White glove. Exact words echoed. Felt like "they built this for me."

Stage 9 â Objection Handling (Weight: 10%)
Context: Most common: money, spouse, "need to think," identity. Heavy objections = upstream problem.
Required Outcomes:
- Identified REAL objection (not smokescreen)
- Isolated: "Aside from X, is there anything else?"
- Channeled â stayed on right objection
- Used appropriate reframe (NLP 4-step, Sleight of Mouth, Advanced Reframing, identity)
- Anchored back to desired state, pain, buying criteria
- Got commitment to overcoming excuse
- If identity: used aspirational figure or core identity reframe
1-2: Caved to first objection. Argued instead of reframed. Got aggressive.
3: Identified and attempted reframe. Felt scripted. Didn't isolate.
4-5: Smooth four-step: identifyâisolateâchannelâreframe. Right framework. Prospect argued FOR action.

## PART 2: CROSS-CUTTING TECHNIQUES (25% â scored out of 35, 7 techniques x 5 pts)

1. Villainizing the Current Situation â Did prospect come to blame their own situation?
2. Labels & Tactical Vulnerability â Pre-labeled prospect as action-taker. Shared vulnerability to lower guard.
3. Pre-Handling (Throughout) â Addressed objections throughout, not just Stage 4.
4. Calling Out Deflection â Caught BS, used softeners, re-asked for real answer.
5. Topic Proximity / Third-Party Analogies â Used stories/analogies before applying to prospect.
6. Bridging (AcknowledgeâResonateâTransition) â Natural stage transitions, not robotic.
7. Softeners & Mirror Questions â Re-asked without pressure. Kept going for outcomes.

## PART 3: UPSTREAM DIAGNOSIS + COACHING (15% â scored out of 20)

For each objection at close, trace backwards to where it was born.
- Money â Was resourcefulness pre-handled in Stage 4? Dream big enough in Stage 6?
- Spouse â Was certainty built first?
- "Think about it" â Was reality check strong enough? Urgency?
- Identity â Right language for prospect type from minute 1?

## PROSPECT TYPE AWARENESS

Emotional 9-to-5er: Lean into feelings, paint vivid pictures, "how does that make you feel?" freely, build dream big.
Type A / High Earner: Business-impact language, "what are the ramifications?", respect intelligence, challenge intellectually.

## GRADE SCALE
- 0-39: F â Fundamentals Missing
- 40-54: D â Gaps in Core Stages
- 55-69: C â Functional, Needs Work
- 70-84: B â Strong, Polish Needed
- 85-100: A â Elite Execution

## OUTPUT FORMAT

You MUST respond with valid JSON only. No markdown, no code blocks, no extra text. The JSON must match this structure exactly:

{
  "prospect_type": "Emotional 9-to-5er" or "Type A / Sophisticated" or "Mixed",
  "call_duration": "estimated from transcript",
  "outcome": "Closed / No Close / Callback Scheduled / etc",
  "total_score": <number 0-100>,
  "grade": "A/B/C/D/F",
  "grade_label": "Elite Execution / Strong, Polish Needed / etc",
  "stage_execution_total": <number 0-45>,
  "technique_total": <number 0-35>,
  "coaching_total": <number 0-20>,
  "stages": [
    {
      "number": 1,
      "name": "Report Phase",
      "score": <1-5>,
      "weight": "8%",
      "hits": [{"text": "description of what was done well", "timestamp": "MM:SS if available", "quote": "exact quote if available"}],
      "misses": [{"text": "description of what was missed", "timestamp": "MM:SS if available", "quote": "exact quote if available"}],
      "word_tracks": [{"context": "when to use this", "lines": ["Rep: exact words to say", "Prospect: likely response", "Rep: follow-up"]}],
      "coach_notes": ["specific coaching observation"]
    }
  ],
  "techniques": [
    {
      "name": "Villainizing the Current Situation",
      "score": <1-5>,
      "details": "what happened",
      "improvement": "what to do differently"
    }
  ],
  "upstream_diagnosis": [
    {
      "objection": "what objection came up",
      "root_stage": "which stage it was born in",
      "explanation": "why it happened",
      "fix": "what to do next time"
    }
  ],
  "top_3_improvements": [
    {
      "area": "short label",
      "description": "specific actionable improvement",
      "priority": "HIGH/MEDIUM/LOW"
    }
  ],
  "rewrites": [
    {
      "title": "Rewrite: [moment name]",
      "context": "what was happening",
      "original_lines": ["Rep: what was actually said"],
      "rewrite_lines": ["Rep: what should have been said", "Prospect: likely response"],
      "why": "explanation of why this is better"
    }
  ],
  "action_plan": [
    {
      "priority": "THIS WEEK / NEXT 2 WEEKS / ONGOING",
      "action": "specific actionable step"
    }
  ]
}`;

// --- API Routes ---

// Submit a new call for review
app.post('/api/review', async (req, res) => {
  try {
    const { transcript, rep_name, prospect_name, call_date } = req.body;
    if (!transcript || !rep_name || !prospect_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const client = getClient();

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Review this sales call transcript. The closer is ${rep_name}. The prospect is ${prospect_name}. Call date: ${call_date || 'today'}.\n\n--- TRANSCRIPT ---\n${transcript}\n--- END TRANSCRIPT ---\n\nProvide your review as JSON matching the format specified in your instructions.`
        }
      ]
    });

    let reviewText = message.content[0].text;
    reviewText = reviewText.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

    let review;
    try {
      review = JSON.parse(reviewText);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse AI review. Try again.', raw: reviewText.substring(0, 500) });
    }

    // Save to database
    const database = loadDB();
    const callRecord = {
      id: database.nextId++,
      rep_name,
      prospect_name,
      prospect_type: review.prospect_type || '',
      call_date: call_date || new Date().toISOString().split('T')[0],
      call_duration: review.call_duration || '',
      outcome: review.outcome || '',
      total_score: review.total_score || 0,
      grade: review.grade || '',
      stage_score: review.stage_execution_total || 0,
      technique_score: review.technique_total || 0,
      coaching_score: review.coaching_total || 0,
      review: review,
      stages: (review.stages || []).map(s => ({ name: s.name, number: s.number, score: s.score })),
      techniques: (review.techniques || []).map(t => ({ name: t.name, score: t.score })),
      created_at: new Date().toISOString()
    };

    database.calls.push(callRecord);
    saveDB(database);

    res.json({ id: callRecord.id, review });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get all calls
app.get('/api/calls', (req, res) => {
  const database = loadDB();
  const calls = database.calls.map(c => ({
    id: c.id,
    rep_name: c.rep_name,
    prospect_name: c.prospect_name,
    prospect_type: c.prospect_type,
    call_date: c.call_date,
    outcome: c.outcome,
    total_score: c.total_score,
    grade: c.grade,
    stage_score: c.stage_score,
    technique_score: c.technique_score,
    coaching_score: c.coaching_score,
    created_at: c.created_at
  })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(calls);
});

// Get single call with full review
app.get('/api/calls/:id', (req, res) => {
  const database = loadDB();
  const call = database.calls.find(c => c.id === parseInt(req.params.id));
  if (!call) return res.status(404).json({ error: 'Call not found' });
  res.json(call);
});

// Delete a call
app.delete('/api/calls/:id', (req, res) => {
  const database = loadDB();
  database.calls = database.calls.filter(c => c.id !== parseInt(req.params.id));
  saveDB(database);
  res.json({ success: true });
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  const database = loadDB();
  const rep = req.query.rep || null;
  const calls = rep ? database.calls.filter(c => c.rep_name === rep) : database.calls;

  const totalCalls = calls.length;
  const avgScore = totalCalls > 0 ? Math.round((calls.reduce((sum, c) => sum + (c.total_score || 0), 0) / totalCalls) * 10) / 10 : 0;

  const sorted = [...calls].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestGrade = sorted[0]?.grade || 'â';

  // Stage averages
  const stageMap = {};
  calls.forEach(c => {
    (c.stages || []).forEach(s => {
      if (!stageMap[s.number]) stageMap[s.number] = { stage_name: s.name, stage_number: s.number, total: 0, count: 0 };
      stageMap[s.number].total += s.score;
      stageMap[s.number].count++;
    });
  });
  const stageAvgs = Object.values(stageMap)
    .map(s => ({ ...s, avg_score: Math.round((s.total / s.count) * 10) / 10 }))
    .sort((a, b) => a.stage_number - b.stage_number);

  // Technique averages
  const techMap = {};
  calls.forEach(c => {
    (c.techniques || []).forEach(t => {
      if (!techMap[t.name]) techMap[t.name] = { technique_name: t.name, total: 0, count: 0 };
      techMap[t.name].total += t.score;
      techMap[t.name].count++;
    });
  });
  const techAvgs = Object.values(techMap)
    .map(t => ({ ...t, avg_score: Math.round((t.total / t.count) * 10) / 10 }));

  // Score trend
  const trend = [...calls].sort((a, b) => new Date(a.call_date) - new Date(b.call_date))
    .map(c => ({ call_date: c.call_date, total_score: c.total_score, grade: c.grade, prospect_name: c.prospect_name }));

  // Reps list
  const reps = [...new Set(database.calls.map(c => c.rep_name))].sort();

  // Weakest areas
  const allAreas = [
    ...stageAvgs.map(s => ({ name: s.stage_name, avg: s.avg_score, type: 'stage' })),
    ...techAvgs.map(t => ({ name: t.technique_name, avg: t.avg_score, type: 'technique' }))
  ];
  allAreas.sort((a, b) => a.avg - b.avg);
  const weakest = allAreas.slice(0, 5);

  res.json({
    total_calls: totalCalls,
    avg_score: avgScore,
    latest_grade: latestGrade,
    stage_averages: stageAvgs,
    technique_averages: techAvgs,
    trend,
    reps,
    weakest_areas: weakest
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  Sales Coach is running at http://localhost:${PORT}\n`);
});
