const T = {
  JP: { name: 'James P.', c: '#ede9fe', t: '#5b21b6', role: 'Project Manager', dept: 'Operations', reportsTo: null, online: true },
  AK: { name: 'Alex K.', c: '#c7f2dc', t: '#166534', role: 'Design Lead', dept: 'Creative', reportsTo: 'JP', online: true },
  SR: { name: 'Sara R.', c: '#dbeafe', t: '#1e40af', role: 'Engineering Lead', dept: 'Tech', reportsTo: 'JP', online: true },
  RC: { name: 'Rachel', c: '#fce7f3', t: '#9d174d', role: 'UX Designer', dept: 'Creative', reportsTo: 'AK', online: true },
  MN: { name: 'Maya N.', c: '#fef3c7', t: '#92400e', role: 'Frontend Dev', dept: 'Tech', reportsTo: 'SR', online: true },
  ED: { name: 'Eddie', c: '#d1fae5', t: '#065f46', role: 'Backend Dev', dept: 'Tech', reportsTo: 'SR', online: false },
};

const SM = {
  done: { l: 'Done', cls: 's-done', col: '#34c759' },
  wip: { l: 'Working on it', cls: 's-wip', col: '#ff9500' },
  stuck: { l: 'Stuck', cls: 's-stuck', col: '#ff3b30' },
  review: { l: 'In review', cls: 's-review', col: '#af52de' },
  todo: { l: 'To do', cls: 's-todo', col: '#8e8e93' },
};

const PR = {
  urgent: { col: '#ff3b30', l: 'Urgent' },
  high: { col: '#ff9500', l: 'High' },
  med: { col: '#007aff', l: 'Medium' },
  low: { col: '#8e8e93', l: 'Low' },
};

const TODAY = new Date('2026-03-04');

let grps = [
  {
    id: 'g1', name: 'Planning', col: '#007aff', open: true, tasks: [
      {
        id: 't1', nm: 'Stakeholder sync', own: 'AK', tf: ['SR', 'JP'], dt: 'Mar 02', st: 'done', pri: 'med', pg: 100,
        att: [{ n: 'Notes.pdf', s: '124 KB', ic: '📄' }, { n: 'Agenda.docx', s: '48 KB', ic: '📝' }],
        subs: [{ id: 's1', n: 'Prepare agenda', done: true, pri: 'high', own: 'AK' }, { id: 's2', n: 'Send invites', done: true, pri: 'med', own: 'SR' }, { id: 's3', n: 'Upload recording', done: true, pri: 'low', own: 'JP' }],
        cmts: [{ id: 'c1', by: 'AK', ts: 'Mar 2 · 10:14am', tx: 'Done! Meeting recorded and shared.', st: 'done', rx: ['👍 3', '✅ 2'] }, { id: 'c2', by: 'SR', ts: 'Mar 2 · 11:02am', tx: 'Notes are in the shared doc.', st: null, rx: ['❤️ 2'] }]
      },
      {
        id: 't2', nm: 'Project brief', own: 'SR', tf: ['AK', 'JP', 'MN'], dt: 'Mar 08', st: 'wip', pri: 'high', pg: 55,
        att: [{ n: 'Brief_v2.pdf', s: '890 KB', ic: '📄' }],
        subs: [{ id: 's4', n: 'Executive summary', done: true, pri: 'high', own: 'SR' }, { id: 's5', n: 'Budget breakdown', done: false, pri: 'urgent', own: 'MN' }, { id: 's6', n: 'Timeline draft', done: false, pri: 'high', own: 'JP' }],
        cmts: [{ id: 'c3', by: 'SR', ts: 'Mar 4 · 9:30am', tx: 'Drafting section 2. On track.', st: 'wip', rx: ['👍 1'] }, { id: 'c4', by: 'JP', ts: 'Mar 4 · 10:45am', tx: '@Sara add the budget breakdown?', st: null, rx: [] }, { id: 'c5', by: 'MN', ts: 'Mar 4 · 2:10pm', tx: 'Added Q4 targets on page 4.', st: null, rx: ['🔥 2', '👍 1'] }]
      },
      {
        id: 't3', nm: 'Research', own: 'MN', tf: ['SR'], dt: 'Mar 03', st: 'wip', pri: 'med', pg: 40,
        att: [],
        subs: [{ id: 's7', n: 'Competitor analysis', done: false, pri: 'high', own: 'MN' }, { id: 's8', n: 'Market data', done: false, pri: 'med', own: 'SR' }],
        cmts: [{ id: 'c6', by: 'MN', ts: 'Mar 3 · 3:00pm', tx: '60% done. Finishing tomorrow.', st: 'wip', rx: ['👍 2'] }]
      },
      {
        id: 't4', nm: 'Kickoff meeting', own: 'JP', tf: ['AK', 'SR', 'MN', 'RC'], dt: 'Mar 03', st: 'stuck', pri: 'urgent', pg: 10,
        att: [{ n: 'Kickoff_deck.pptx', s: '2.1 MB', ic: '📊' }],
        subs: [{ id: 's9', n: 'Legal sign-off', done: false, pri: 'urgent', own: 'JP' }, { id: 's10', n: 'Book room', done: true, pri: 'low', own: 'RC' }],
        cmts: [{ id: 'c7', by: 'JP', ts: 'Mar 3 · 4:15pm', tx: 'Waiting for legal. Blocked.', st: 'stuck', rx: ['😬 3'] }, { id: 'c8', by: 'RC', ts: 'Mar 4 · 8:50am', tx: "@James I'll follow up now.", st: null, rx: ['🙏 2'] }]
      },
    ]
  },
  {
    id: 'g2', name: 'Execution', col: '#ff6b35', open: true, tasks: [
      {
        id: 't5', nm: 'Create brand assets', own: 'RC', tf: ['AK', 'MN'], dt: 'Mar 10', st: 'wip', pri: 'high', pg: 60,
        att: [{ n: 'Assets_v1.fig', s: '4.2 MB', ic: '🎨' }, { n: 'Icons.zip', s: '780 KB', ic: '📦' }],
        subs: [{ id: 's11', n: 'Logo variants', done: true, pri: 'high', own: 'AK' }, { id: 's12', n: 'Social banners', done: false, pri: 'high', own: 'MN' }, { id: 's13', n: 'Email templates', done: false, pri: 'med', own: 'RC' }],
        cmts: [{ id: 'c9', by: 'RC', ts: 'Mar 4 · 11:00am', tx: "Here's the assets link. Wdyt?", st: 'wip', rx: ['👍 4', '🔥 2'] }, { id: 'c10', by: 'ED', ts: 'Mar 4 · 11:45am', tx: 'Looks great, left comments in file.', st: null, rx: ['👌 1'] }, { id: 'c11', by: 'MN', ts: 'Mar 4 · 12:30pm', tx: 'Amazing work 👏👏👏', st: null, rx: ['❤️ 5'] }]
      },
      {
        id: 't6', nm: 'Book conference hall', own: 'AK', tf: ['JP', 'RC'], dt: 'Mar 15', st: 'wip', pri: 'med', pg: 30,
        att: [],
        subs: [{ id: 's14', n: 'Get venue quotes', done: true, pri: 'high', own: 'AK' }, { id: 's15', n: 'Confirm booking', done: false, pri: 'urgent', own: 'AK' }],
        cmts: [{ id: 'c12', by: 'AK', ts: 'Mar 3 · 2:00pm', tx: 'Contacted 3 venues. Waiting for quotes.', st: 'wip', rx: ['👍 1'] }]
      },
      {
        id: 't7', nm: 'Project sync call', own: 'SR', tf: ['AK', 'JP'], dt: 'Mar 12', st: 'done', pri: 'low', pg: 100,
        att: [{ n: 'Sync_recording.mp4', s: '68 MB', ic: '🎥' }],
        subs: [{ id: 's16', n: 'Prepare agenda', done: true, pri: 'med', own: 'SR' }, { id: 's17', n: 'Upload recording', done: true, pri: 'low', own: 'JP' }],
        cmts: [{ id: 'c13', by: 'SR', ts: 'Mar 4 · 5:00pm', tx: 'Sync done ✅ Recording uploaded.', st: 'done', rx: ['🎉 4', '👍 3'] }]
      },
      {
        id: 't8', nm: 'Launch update', own: 'JP', tf: ['AK', 'SR', 'MN', 'RC'], dt: 'Mar 06', st: 'stuck', pri: 'urgent', pg: 15,
        att: [],
        subs: [{ id: 's18', n: 'Fix build pipeline', done: false, pri: 'urgent', own: 'SR' }, { id: 's19', n: 'Deploy to staging', done: false, pri: 'high', own: 'MN' }, { id: 's20', n: 'Write release notes', done: false, pri: 'med', own: 'JP' }],
        cmts: [{ id: 'c14', by: 'JP', ts: 'Mar 3 · 3:30pm', tx: 'Build blocked. Escalating to infra.', st: 'stuck', rx: ['😩 2'] }, { id: 'c15', by: 'SR', ts: 'Mar 3 · 4:00pm', tx: "Let's debug together on a call.", st: null, rx: ['🙏 3'] }]
      },
    ]
  },
];

let notifs = [
  { id: 'n1', by: 'SR', tx: '<strong>Sara R.</strong> commented on <strong>Project brief</strong>', tm: '5 min ago', r: false },
  { id: 'n2', by: 'JP', tx: '<strong>James P.</strong> changed <strong>Kickoff</strong> to Stuck', tm: '32 min ago', r: false },
  { id: 'n3', by: 'MN', tx: '<strong>Maya N.</strong> attached a file to <strong>Create assets</strong>', tm: '1 hr ago', r: false },
  { id: 'n4', by: 'RC', tx: '<strong>Rachel</strong> mentioned @Everyone in <strong>Create assets</strong>', tm: '2 hr ago', r: false },
  { id: 'n5', by: 'AK', tx: '<strong>Alex K.</strong> completed subtask <strong>Logo variants</strong>', tm: '3 hr ago', r: true },
];
