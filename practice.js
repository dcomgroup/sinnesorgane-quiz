// Additional practice sessions, without resetting long-term progress.
let practiceQueue = [];
let practiceMode = false;
const originalNext = next;
const originalRate = rate;
const practiceButton = document.createElement('button');
practiceButton.textContent = 'Noch eine Runde üben';
practiceButton.className = 'primary';
practiceButton.style.marginTop = '12px';
practiceButton.style.display = 'none';
practiceButton.onclick = startPractice;
$('stats').after(practiceButton);

function difficulty(c, s) {
  const v = s[c.id] || {};
  return (v.reps === 0 ? 12 : 0) + (v.ease ? Math.max(0, 2.5 - v.ease) * 12 : 0)
    + (v.interval ? 8 / (1 + v.interval) : 7)
    + (v.lastRating === 1 ? 12 : v.lastRating === 2 ? 8 : v.lastRating === 3 ? 2 : 0);
}
function startPractice() {
  const s = state();
  const pool = cards.filter(c => $('group').value === 'Alle' || c.group === $('group').value);
  practiceQueue = pool.map(c => ({id:c.id, weight:difficulty(c,s)}))
    .sort((a,b) => b.weight-a.weight)
    .map(x=>x.id);
  // One extra pass through the difficult half.
  const difficult = practiceQueue.slice(0, Math.max(1,Math.ceil(practiceQueue.length/2)));
  practiceQueue.push(...difficult);
  practiceMode = true;
  next();
}
next = function() {
  if (!practiceMode) {
    originalNext();
    const done = !active || !$('pic').getAttribute('src');
    practiceButton.style.display = done ? 'inline-block' : 'none';
    if (done) $('stats').textContent = 'Alle Karten für heute erledigt. Du kannst direkt weiterüben.';
    return;
  }
  practiceButton.style.display = 'none';
  if (!practiceQueue.length) {
    practiceMode = false;
    active = null;
    $('pic').removeAttribute('src');
    $('answer').style.display = 'none';
    $('guess').style.display = 'none';
    $('stats').textContent = 'Übungsrunde abgeschlossen.';
    practiceButton.style.display = 'inline-block';
    return;
  }
  const id = practiceQueue.shift();
  active = cards.find(c => c.id === id);
  $('pic').src = active.q;
  $('label').textContent = '';
  $('details').textContent = '';
  $('answer').style.display = 'none';
  $('guess').style.display = 'block';
  $('typed').value = '';
  $('stats').textContent = 'Zusatzrunde · noch ' + (practiceQueue.length + 1) + ' Karten · Profil: ' + current;
};
rate = function(r) {
  const id = active.id;
  originalRate(r);
  const s = state();
  if (s[id]) { s[id].lastRating = r; store(s); }
  if (practiceMode && r <= 2 && !practiceQueue.includes(id)) {
    // Difficult cards are asked again near the end of the round.
    practiceQueue.splice(Math.max(0,practiceQueue.length-2),0,id);
  }
  if (practiceMode) next();
};
const previousProfileChange = $('profile').onchange;
$('profile').onchange = e => { practiceMode = false; practiceQueue = []; previousProfileChange(e); };
const previousGroupChange = $('group').onchange;
$('group').onchange = e => { practiceMode = false; practiceQueue = []; previousGroupChange(e); };
// Show the button immediately if today's scheduled cards are already finished.
next();
