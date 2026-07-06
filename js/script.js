window.addEventListener('scroll', function() {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
});

var callCount = 0, lastCallTime = 0, callBlocked = false;
function handleCall() {
  var now = Date.now();
  var btn = document.getElementById('callBtn');
  if (callBlocked) { showToast('Too many attempts. Please wait 2 minutes.'); return; }
  if (now - lastCallTime < 60000) {
    callCount++;
    if (callCount >= 3) {
      callBlocked = true; btn.disabled = true; btn.innerText = 'Try Again Later';
      showToast('Blocked for 2 minutes.');
      setTimeout(function() { callBlocked=false; callCount=0; btn.disabled=false; btn.innerText='Call Now'; }, 120000);
      return;
    }
  } else { callCount = 1; }
  lastCallTime = now;
  if (confirm('Call Infinity Fitness at 9846247613?')) {
    btn.disabled = true; btn.innerText = 'Calling...';
    setTimeout(function() { btn.disabled=false; btn.innerText='Call Now'; }, 8000);
    var a = document.createElement('a'); a.href = 'tel:9846247613';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
}

function sendToWhatsApp() {
  var name = document.getElementById('fname').value.trim();
  var phone = document.getElementById('fphone').value.trim();
  var msg = document.getElementById('fmsg').value.trim();
  if (!name || !phone) { showToast('Please fill in your name and phone number!'); return; }
  var text = 'Hello Infinity Womens Fitness Studio!\n\nName: ' + name + '\nPhone: ' + phone + '\nInterested in: ' + (msg || 'General enquiry') + '\n\nI found you on your website!';
  var a = document.createElement('a');
  a.href = 'https://wa.me/919846247613?text=' + encodeURIComponent(text);
  a.target = '_blank'; a.rel = 'noopener noreferrer';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function showToast(msg) {
  var t = document.getElementById('toast');
  t.innerText = msg; t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 3500);
}
