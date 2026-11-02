/* Stand-in for the claude.ai runtime (window.claude.use) so the page runs on GitHub Pages.
   - downloads: saves the result card as a PNG through a normal browser download
   - db + user: Firebase Firestore with anonymous sign-in, only when firebase-config.js has a config.
     Without a config both resolve null and the page keeps each visitor's stars on their own device. */
(function () {
  var V = '10.12.2', BASE = 'https://www.gstatic.com/firebasejs/' + V + '/';
  function load(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s);
    });
  }
  var fb = null;
  function firebaseReady() {
    if (fb) return fb;
    var cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey) return (fb = Promise.resolve(null));
    fb = load(BASE + 'firebase-app-compat.js')
      .then(function () { return Promise.all([load(BASE + 'firebase-auth-compat.js'), load(BASE + 'firebase-firestore-compat.js')]); })
      .then(function () {
        var app = firebase.initializeApp(cfg);
        return app.auth().signInAnonymously().then(function (cred) {
          return { db: app.firestore(), uid: cred.user.uid };
        });
      })
      .catch(function (e) { console.warn('[thinking-room] Firebase unavailable, using this device only', e); return null; });
    return fb;
  }
  var downloads = {
    save: function (o) {
      var url = URL.createObjectURL(o.data), a = document.createElement('a');
      a.href = url; a.download = o.filename || 'download'; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      return Promise.resolve({ ok: true });
    }
  };
  window.claude = {
    use: function (name) {
      if (name === 'downloads') return Promise.resolve(downloads);
      if (name === 'db') return firebaseReady().then(function (f) { return f ? f.db : null; });
      if (name === 'user') return firebaseReady().then(function (f) {
        return f ? { id: function () { return Promise.resolve(f.uid); }, isOwner: function () { return Promise.resolve(false); } } : null;
      });
      return Promise.resolve(null);
    }
  };
})();
