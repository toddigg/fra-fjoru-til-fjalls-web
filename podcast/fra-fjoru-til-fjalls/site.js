(function () {
  'use strict';

  /* ---------- contour lines on film frames, drawn from the theme tokens ---------- */
  function drawContours(c) {
    var w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
    var g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    var cs = getComputedStyle(c);
    var moss = cs.getPropertyValue('--moss').trim() || '#6f8a52';
    var faint = cs.getPropertyValue('--moss-faint').trim() || '#b9c7a4';
    var seed = parseFloat(c.getAttribute('data-seed')) || 1;
    var n = parseInt(c.getAttribute('data-lines'), 10) || 4;
    var from = parseFloat(c.getAttribute('data-from')); if (isNaN(from)) from = 0.5;
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (var i = 0; i < n; i++) {
      var x0 = w * (from + i * 0.06);
      var rise = h * Math.max(0.14, 0.62 - i * 0.12);
      g.beginPath();
      for (var s = 0; s <= 80; s++) {
        var u = s / 80;
        var x = x0 + (w - x0) * u;
        var y = h - rise * Math.pow(u, 0.82)
              + Math.sin(u * 3.1 + seed + i * 0.9) * h * 0.035 * u
              + Math.sin(u * 7.3 + seed * 2.1 + i * 1.7) * h * 0.014 * u;
        if (s === 0) g.moveTo(x, h + 2); else g.lineTo(x, y);
      }
      var last = i === n - 1;
      g.strokeStyle = last ? moss : faint;
      g.lineWidth = last ? 2 : 1.5;
      g.stroke();
    }
  }
  function drawAll() { document.querySelectorAll('canvas.contours').forEach(drawContours); }
  var raf = 0;
  function redrawSoon() { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawAll); }
  window.addEventListener('resize', redrawSoon);
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', redrawSoon); } catch (e) {}
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(redrawSoon);

  /* ---------- video: nothing loads from YouTube until someone presses play ---------- */
  var playBtn = document.getElementById('play-btn');
  var videoFrame = playBtn ? playBtn.parentNode : null;
  var videoId = playBtn ? playBtn.getAttribute('data-yt') : '';
  function loadVideo(start) {
    if (!videoFrame || !videoId) return false;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + videoId + '?autoplay=1&rel=0' + (start ? '&start=' + start : '');
    f.title = 'Myndband: ' + document.title;
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    f.allowFullscreen = true;
    videoFrame.textContent = '';
    videoFrame.className = 'frame r16x9 film video';
    videoFrame.appendChild(f);
    videoFrame.scrollIntoView({ block: 'start' });
    return true;
  }
  if (playBtn) playBtn.addEventListener('click', function (e) { if (loadVideo(0)) e.preventDefault(); });
  document.querySelectorAll('a.t[data-t]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (loadVideo(parseInt(link.getAttribute('data-t'), 10) || 0)) e.preventDefault();
    });
  });

  /* ---------- newsletter: honest stub until a provider is chosen ---------- */
  var form = document.getElementById('signup-form');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = document.getElementById('signup-msg');
    var v = document.getElementById('signup-email').value.trim();
    if (!v || v.indexOf('@') === -1) { msg.textContent = 'Sláðu inn netfang, til dæmis nafn@dæmi.is.'; return; }
    msg.textContent = 'Skráning er ekki virk enn. Netfangið var ekki vistað.';
  });

  /* ---------- video stills: fall back to the smaller frame, hide if blocked ---------- */
  document.querySelectorAll('img.poster').forEach(function (im) {
    function check() {
      var f = im.getAttribute('data-fallback');
      if (f && im.naturalWidth && im.naturalWidth < 200) { im.removeAttribute('data-fallback'); im.src = f; }
    }
    if (im.complete) check(); else im.addEventListener('load', check);
    im.addEventListener('error', function () { im.style.display = 'none'; });
  });

  drawAll();
})();
