/* ============================================================
   从有托位到能入托 · 交互脚本
   阅读进度 / 导航高亮 / 滚动显现 / 华夫图 / 移动菜单
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 华夫图：100 个托位，47 个被使用 ---------- */
  var waffle = document.getElementById('waffle');
  if (waffle) {
    var FILLED = 47; // 使用率 46.7%，四舍五入显示为 47
    for (var i = 0; i < 100; i++) {
      var cell = document.createElement('i');
      if (i < FILLED) cell.className = 'filled';
      cell.style.transitionDelay = (i * 0.012) + 's';
      waffle.appendChild(cell);
    }
  }

  /* ---------- 滚动显现 ---------- */
  var revealEls = document.querySelectorAll('.reveal, .reveft');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 顶部章节进度：目录 + 读数 ---------- */
  var header = document.getElementById('siteHeader');
  var track = document.getElementById('chapterTrack');
  var ticking = false;

  // 章节起点：与文中的 chapter-tag 一一对应
  var CHAPTERS = [
    ['cover', '封面', '从有托位到能入托'],
    ['why', '第一章', '为什么需要托育'],
    ['gap', '第二章', '供需矛盾'],
    ['mismatch', '第三章', '错位之困'],
    ['policy', '第四章', '普惠托育政策'],
    ['effect-ch', '第五章', '普惠效果'],
    ['method', '附录', '资料与方法']
  ];

  var segs = [], starts = [], ends = [], totalH = 1, lastCur = -1;

  // 窄屏目录条可横向滚动：让当前章节始终停留在可见范围内
  function followActive(i) {
    if (!track || !segs[i] || track.scrollWidth <= track.clientWidth + 1) return;
    var r = segs[i].el.getBoundingClientRect();
    var tr = track.getBoundingClientRect();
    var delta = 0;
    if (r.left < tr.left + 12) delta = r.left - tr.left - 12;
    else if (r.right > tr.right - 12) delta = r.right - tr.right + 12;
    if (delta) track.scrollLeft += delta;
  }

  function layoutChapters() {
    if (!track) return;
    totalH = Math.max(1, document.documentElement.scrollHeight);
    starts = CHAPTERS.map(function (c) {
      var el = document.getElementById(c[0]);
      return el ? el.getBoundingClientRect().top + window.pageYOffset : 0;
    });
    ends = starts.map(function (s, i) {
      return i < starts.length - 1 ? Math.max(starts[i + 1], s + 1) : totalH;
    });

    if (!segs.length) {
      CHAPTERS.forEach(function (c) {
        var item = document.createElement('a');
        item.className = 'ct-item';
        item.href = '#' + c[0];
        item.setAttribute('data-ch', c[0]);

        var lbl = document.createElement('span');
        lbl.className = 'ct-lbl';
        var idx = document.createElement('span');
        idx.className = 'ct-idx';
        idx.textContent = c[1];
        var name = document.createElement('span');
        name.className = 'ct-name';
        name.textContent = c[2];
        lbl.appendChild(idx);
        lbl.appendChild(name);

        var barEl = document.createElement('span');
        barEl.className = 'ct-bar';
        var f = document.createElement('i');
        f.className = 'ct-fill';
        barEl.appendChild(f);

        item.appendChild(lbl);
        item.appendChild(barEl);
        track.appendChild(item);
        segs.push({ el: item, fill: f });
      });
    }
    paintChapters();
  }

  function paintChapters() {
    if (!segs.length) return;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var ref = y + window.innerHeight * 0.35;
    if (y + window.innerHeight >= totalH - 2) ref = totalH;
    var cur = 0;
    for (var i = 0; i < starts.length; i++) { if (ref >= starts[i]) cur = i; }

    segs.forEach(function (s, i) {
      var done = i < cur;
      var p = i === cur ? Math.min(1, Math.max(0, (ref - starts[i]) / (ends[i] - starts[i]))) : 0;
      s.fill.style.width = (p * 100) + '%';
      s.el.classList.toggle('done', done);
      s.el.classList.toggle('active', i === cur);
    });

    if (cur !== lastCur) { lastCur = cur; followActive(cur); }
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop;
    header.classList.toggle('scrolled', y > 8);
    paintChapters();
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', function () { window.requestAnimationFrame(layoutChapters); });
  window.addEventListener('load', layoutChapters);
  layoutChapters();
  onScroll();

  /* ---------- 导航当前章节高亮 ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
  var linkMap = {};
  navLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    linkMap[id] = a;
  });
  var spyIds = Object.keys(linkMap);
  var spyTargets = spyIds.map(function (id) { return document.getElementById(id); })
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(function (a) { a.classList.remove('active'); });
    if (linkMap[id]) linkMap[id].classList.add('active');
  }

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    spyTargets.forEach(function (t) { spy.observe(t); });
  }

  /* ---------- 一日排程：交互式圆环 ---------- */
  var donutHost = document.getElementById('dayDonut');
  if (donutHost) {
    var SVGNS = 'http://www.w3.org/2000/svg';
    var CX = 280, CY = 280, R = 202, r = 126;

    // 时段类别
    var CATS = {
      prep:    { label: '晨起预备', color: '#9DB8AE' },
      routine: { label: '日常照护', color: '#16796F' },
      meal:    { label: '进餐',     color: '#C96842' },
      play:    { label: '游戏活动', color: '#5E9E8E' },
      nap:     { label: '午睡',     color: '#A5C6B8' },
      night:   { label: '夜间睡眠', color: '#C3D2CB' }
    };

    // 排程数据：s/e 为距当日00:00的分钟（次日时间 >1440）
    var SEGS = [
      { t: '06:30–07:00', cat: 'prep', child: '孩子尚在睡眠', adult: '准备早餐、食材与当天用品', s: 390, e: 420 },
      { t: '07:00–07:30', cat: 'routine', child: '起床、清洁、按需饮奶', adult: '换尿布 / 协助如厕，回应喂养需要', s: 420, e: 450 },
      { t: '07:30–08:30', cat: 'meal', child: '早餐 → 餐后清洁', adult: '洗手、陪伴进食，清理孩子与餐具', s: 450, e: 510 },
      { t: '08:30–09:30', cat: 'play', child: '户外走动、探索', adult: '穿衣、准备外出用品、看护与饮水', s: 510, e: 570 },
      { t: '09:30–10:00', cat: 'meal', child: '上午加餐', adult: '准备食物、陪伴进食、收拾残渣', s: 570, e: 600 },
      { t: '10:00–11:30', cat: 'play', child: '自由活动、互动游戏', adult: '陪伴；在安全看护下准备午餐', s: 600, e: 690 },
      { t: '11:30–12:30', cat: 'meal', child: '午餐 → 准备午睡', adult: '陪伴进食、清洁、换尿布与安抚', s: 690, e: 750 },
      { t: '12:30–14:30', cat: 'nap', child: '午睡', adult: '成人可吃饭、休息或家务；醒来时回应', s: 750, e: 870 },
      { t: '14:30–15:00', cat: 'meal', child: '下午加餐', adult: '清洁、准备加餐、陪伴进食与收尾', s: 870, e: 900 },
      { t: '15:00–17:30', cat: 'play', child: '活动、自由游戏', adult: '陪伴活动；在安全看护下准备晚餐', s: 900, e: 1050 },
      { t: '17:30–18:00', cat: 'meal', child: '晚餐', adult: '陪伴进食、观察饥饱信号、餐后清洁', s: 1050, e: 1080 },
      { t: '18:00–19:00', cat: 'play', child: '轻松游戏、亲子交流', adult: '清理环境，陪伴并逐步降低活动强度', s: 1080, e: 1140 },
      { t: '19:00–20:00', cat: 'routine', child: '清洁、按需饮奶、睡前阅读', adult: '清洁 / 刷牙、换衣、阅读与安抚', s: 1140, e: 1200 },
      { t: '20:00–次日06:30', cat: 'night', child: '夜间睡眠', adult: '成人个人生活与睡眠；如夜醒按需回应', s: 1200, e: 1830 }
    ];

    // 06:00 位于正上方
    function ang(m) { return (m - 360) / 1440 * 360 - 90; }
    function pt(rad, deg) {
      var r0 = deg * Math.PI / 180;
      return [CX + rad * Math.cos(r0), CY + rad * Math.sin(r0)];
    }

    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 560 560');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', '一天24小时排程圆环，点击扇区查看详情');
    donutHost.appendChild(svg);

    var PAD = 0.22; // 扇区间隙（度）
    var paths = [];
    var activeIdx = -1;

    SEGS.forEach(function (seg, i) {
      var a0 = ang(seg.s) + PAD, a1 = ang(seg.e) - PAD;
      var p1 = pt(R, a0), p2 = pt(R, a1), p3 = pt(r, a1), p4 = pt(r, a0);
      var large = (a1 - a0) > 180 ? 1 : 0;
      var d = 'M' + p1[0] + ',' + p1[1] +
        ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p2[0] + ',' + p2[1] +
        ' L' + p3[0] + ',' + p3[1] +
        ' A' + r + ',' + r + ' 0 ' + large + ' 0 ' + p4[0] + ',' + p4[1] + ' Z';

      var path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', CATS[seg.cat].color);
      path.setAttribute('class', 'donut-seg');
      var mid = (a0 + a1) / 2 * Math.PI / 180;
      path._ux = Math.cos(mid); path._uy = Math.sin(mid);

      function shift() {
        var d0 = activeIdx === i ? 10 : (path._hv ? 6 : 0);
        path.style.transform = 'translate(' + (path._ux * d0) + 'px,' + (path._uy * d0) + 'px)';
        path.style.filter = activeIdx === i ? 'brightness(.8)' : (path._hv ? 'brightness(.92)' : 'none');
      }
      path.addEventListener('mouseenter', function () { path._hv = true; if (activeIdx !== i) shift(); });
      path.addEventListener('mouseleave', function () { path._hv = false; if (activeIdx !== i) shift(); });
      path.addEventListener('click', function () { select(i); });

      svg.appendChild(path);
      paths.push(path);
    });

    // 时钟刻度（每3小时）
    var ticks = [[360, '06:00'], [540, '09:00'], [720, '12:00'], [900, '15:00'],
                 [1080, '18:00'], [1260, '21:00'], [1440, '00:00'], [180, '03:00']];
    ticks.forEach(function (tk) {
      var a = ang(tk[0]), dot = pt(R + 11, a), tp = pt(R + 26, a);
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', dot[0]); c.setAttribute('cy', dot[1]); c.setAttribute('r', 2);
      c.setAttribute('fill', '#C9C4B8');
      svg.appendChild(c);
      var t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', tp[0]); t.setAttribute('y', tp[1] + 4);
      t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'donut-tick');
      t.textContent = tk[1];
      svg.appendChild(t);
    });

    // 中心内容：默认 / 选中
    var centerDef = document.createElementNS(SVGNS, 'g');
    centerDef.setAttribute('class', 'donut-center is-show');
    centerDef.innerHTML =
      '<circle cx="' + CX + '" cy="' + (CY - 34) + '" r="15" fill="none" stroke="#808B85" stroke-width="2"/>' +
      '<path d="M' + CX + ',' + (CY - 45) + ' V' + (CY - 34) + ' L' + (CX + 9) + ',' + (CY - 28) +
      '" fill="none" stroke="#16796F" stroke-width="2" stroke-linecap="round"/>' +
      '<text x="' + CX + '" y="' + CY + 6 + '" text-anchor="middle" class="dc-main">24小时</text>' +
      '<text x="' + CX + '" y="' + CY + 26 + '" text-anchor="middle" class="dc-sub">全天排程</text>';
    svg.appendChild(centerDef);

    var centerAct = document.createElementNS(SVGNS, 'g');
    centerAct.setAttribute('class', 'donut-center');
    var ctCat = document.createElementNS(SVGNS, 'text');
    ctCat.setAttribute('x', CX); ctCat.setAttribute('y', CY - 16);
    ctCat.setAttribute('text-anchor', 'middle'); ctCat.setAttribute('class', 'dc-cat');
    var ctTime = document.createElementNS(SVGNS, 'text');
    ctTime.setAttribute('x', CX); ctTime.setAttribute('y', CY + 12);
    ctTime.setAttribute('text-anchor', 'middle'); ctTime.setAttribute('class', 'dc-time');
    var ctDur = document.createElementNS(SVGNS, 'text');
    ctDur.setAttribute('x', CX); ctDur.setAttribute('y', CY + 38);
    ctDur.setAttribute('text-anchor', 'middle'); ctDur.setAttribute('class', 'dc-sub');
    centerAct.appendChild(ctCat); centerAct.appendChild(ctTime); centerAct.appendChild(ctDur);
    svg.appendChild(centerAct);

    // 图例
    var legend = document.createElement('div');
    legend.className = 'donut-legend';
    [['meal', '进餐'], ['routine', '日常照护'], ['play', '游戏活动'], ['nap', '睡眠']].forEach(function (li) {
      legend.innerHTML += '<span><i style="background:' + CATS[li[0]].color + '"></i>' + li[1] + '</span>';
    });
    donutHost.appendChild(legend);

    // 右侧信息面板
    var panel = document.getElementById('donutPanel');
    panel.innerHTML =
      '<div class="dp-prompt">' +
      '  <div class="dp-prompt-ico"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></div>' +
      '  <b>点击圆环扇区</b>' +
      '  <p>圆环按一天24小时划分。点任意扇区，查看该时段孩子的安排与成人需要完成的照护任务。</p>' +
      '</div>' +
      '<div class="dp-detail"><span class="dp-pill"><i></i><em></em></span>' +
      '  <div class="dp-time"></div>' +
      '  <div class="dp-line"><label>孩子</label><p class="dp-child"></p></div>' +
      '  <div class="dp-line"><label>成人</label><p class="dp-adult"></p></div>' +
      '</div>';

    function select(i) {
      var changed = activeIdx !== i;
      activeIdx = i;
      // 更新所有扇区位移/亮度
      paths.forEach(function (p, j) {
        var d0 = j === i ? 10 : 0;
        p.style.transform = 'translate(' + (p._ux * d0) + 'px,' + (p._uy * d0) + 'px)';
        p.style.filter = j === i ? 'brightness(.8)' : 'none';
      });

      var seg = SEGS[i], cat = CATS[seg.cat];
      // 中心
      centerDef.classList.remove('is-show');
      centerAct.classList.add('is-show');
      ctCat.textContent = cat.label; ctCat.setAttribute('fill', cat.color);
      ctTime.textContent = seg.t;
      var mins = seg.e - seg.s;
      ctDur.textContent = mins >= 60 ? '约' + (mins / 60).toFixed(mins % 60 ? 1 : 0) + '小时' : mins + '分钟';

      // 面板
      panel.classList.add('has-detail');
      var pillI = panel.querySelector('.dp-pill i'), pillE = panel.querySelector('.dp-pill em');
      pillI.style.background = cat.color; pillE.textContent = cat.label;
      panel.querySelector('.dp-time').textContent = seg.t;
      panel.querySelector('.dp-child').textContent = seg.child;
      panel.querySelector('.dp-adult').textContent = seg.adult;
      if (changed) {
        var detail = panel.querySelector('.dp-detail');
        detail.classList.remove('in');
        void detail.offsetWidth;
        detail.classList.add('in');
      }
    }
  }

  /* ---------- 图21：送托地点散点示意 ---------- */
  var dropSvg = document.getElementById('dropScatter');
  if (dropSvg) {
    var NSD = 'http://www.w3.org/2000/svg';
    var C_COMM = [130, 130], C_WORK = [130, 310];
    var placed = [];

    // 确定性伪随机（mulberry32），保证每次刷新散点布局一致
    function mulberry32(a) {
      return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }
    var rnd = mulberry32(3537);

    function d2(x, y, px, py) {
      var dx = x - px, dy = y - py;
      return dx * dx + dy * dy;
    }
    function tooClose(x, y) {
      for (var i = 0; i < placed.length; i++) {
        if (d2(x, y, placed[i][0], placed[i][1]) < 132) return true; // 最小间距约11.5px
      }
      return false;
    }
    function addDot(x, y, cls) {
      var c = document.createElementNS(NSD, 'circle');
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', 5);
      c.setAttribute('class', 'dot ' + cls);
      dropSvg.appendChild(c);
      placed.push([x, y]);
    }

    // 就近圈内的点：社区 44 / 单位 10（环状散布，避开中心图标）
    function ringDots(cen, cls, n) {
      var got = 0, guard = 0;
      while (got < n && guard < 5000) {
        guard++;
        var a = rnd() * Math.PI * 2;
        var rr = 40 + Math.sqrt(rnd()) * 30;
        var x = cen[0] + Math.cos(a) * rr;
        var y = cen[1] + Math.sin(a) * rr;
        if (d2(x, y, cen[0], cen[1] + 2) < 1764) continue; // 图标避让（42px）
        if (tooClose(x, y)) continue;
        addDot(x, y, cls); got++;
      }
    }
    ringDots(C_COMM, 'd-community', 44);
    ringDots(C_WORK, 'd-work', 10);

    // 圈外的点：46 个，散布在两个原点就近圈之外
    var gotFar = 0, guardF = 0;
    while (gotFar < 46 && guardF < 20000) {
      guardF++;
      var fx = 36 + rnd() * 670;
      var fy = 26 + rnd() * 388;
      if (d2(fx, fy, C_COMM[0], C_COMM[1]) < 10816) continue; // 104px 圈外
      if (d2(fx, fy, C_WORK[0], C_WORK[1]) < 10816) continue;
      if (tooClose(fx, fy)) continue;
      addDot(fx, fy, 'd-far'); gotFar++;
    }

    // 图例悬停高亮对应点群
    var lgSpans = dropSvg.parentNode.querySelectorAll('.scatter-legend span[data-grp]');
    Array.prototype.forEach.call(lgSpans, function (sp) {
      sp.addEventListener('mouseenter', function () {
        dropSvg.setAttribute('data-hl', sp.getAttribute('data-grp'));
      });
      sp.addEventListener('mouseleave', function () {
        dropSvg.removeAttribute('data-hl');
      });
    });
  }

  /* ---------- 政策阶梯：点击年份查看内容 ---------- */
  (function () {
    var chart = document.getElementById('policyStairs');
    var panel = document.getElementById('stairPanel');
    if (!chart || !panel) return;
    var steps = Array.prototype.slice.call(chart.querySelectorAll('.stair-block'));
    function show(s) {
      steps.forEach(function (x) { x.classList.remove('active'); });
      s.classList.add('active');
      panel.innerHTML =
        '<span class="sd-year">' + s.getAttribute('data-year') + '</span>' +
        '<div class="sd-body"><b>' + s.getAttribute('data-title') + '</b>' +
        '<p>' + s.getAttribute('data-desc') + '<sup>[' + s.getAttribute('data-cite') + ']</sup></p></div>';
    }
    steps.forEach(function (s) {
      s.addEventListener('click', function () { show(s); });
      s.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(s); }
      });
    });
    panel.innerHTML = '<p class="stair-hint">点击上方任一年份台阶，查看对应的政策进展。</p>';
  })();

  /* ---------- 供给联动图：托位总量条形 × 千人口托位数折线 ---------- */
  (function () {
    var host = document.getElementById('supplyCombo');
    if (!host) return;
    var NS = 'http://www.w3.org/2000/svg';

    // 数据与两处原图一致：总量477/573.7/666万个，千人口3.38/4.08/4.73个
    var DATA = [
      { year: '2023年末', total: 477, rate: 3.38 },
      { year: '2024年末', total: 573.7, rate: 4.08 },
      { year: '2025年披露', total: 666, rate: 4.73 }
    ];
    var X0 = 86, X1 = 664, PW = X1 - X0; // 绘图区
    var BAR_MAX = 700, RATE_MAX = 5;     // 两轴均为0起点
    var ROWS = [112, 192, 272], BAR_H = 44;
    var AXIS_TOP = 46, AXIS_BOT = 322;

    function el(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    function bx(v) { return X0 + (v / BAR_MAX) * PW; }  // 下轴：万个
    function rx(v) { return X0 + (v / RATE_MAX) * PW; } // 上轴：个/千人口

    var svg = el('svg', {
      'viewBox': '0 0 720 380', 'class': 'combo-svg', 'role': 'img',
      'aria-label': '托位总量条形与千人口托位数折线联动图，点击年份节点查看数值'
    }, host);

    // 上轴（折线，个/千人口）与下轴（条形，万个）
    el('line', { x1: X0, y1: AXIS_TOP, x2: X1, y2: AXIS_TOP, 'class': 'cb-axisline' }, svg);
    for (var t = 0; t <= 5; t++) {
      var tx = rx(t);
      el('line', { x1: tx, y1: AXIS_TOP, x2: tx, y2: AXIS_TOP + 6, 'class': 'cb-axisline' }, svg);
      var tt = el('text', { x: tx, y: AXIS_TOP - 9, 'text-anchor': 'middle', 'class': 'cb-tick cb-tick-top' }, svg);
      tt.textContent = t;
    }
    var topCap = el('text', { x: X1, y: AXIS_TOP - 26, 'text-anchor': 'end', 'class': 'cb-axis-cap cb-tick-top' }, svg);
    topCap.textContent = '个/千人口';

    el('line', { x1: X0, y1: AXIS_BOT, x2: X1, y2: AXIS_BOT, 'class': 'cb-axisline' }, svg);
    [0, 200, 400, 600].forEach(function (v) {
      var vx = bx(v);
      el('line', { x1: vx, y1: AXIS_BOT, x2: vx, y2: AXIS_BOT + 6, 'class': 'cb-axisline' }, svg);
      var vt = el('text', { x: vx, y: AXIS_BOT + 24, 'text-anchor': 'middle', 'class': 'cb-tick' }, svg);
      vt.textContent = v;
    });
    var botCap = el('text', { x: X1, y: AXIS_BOT + 24, 'text-anchor': 'end', 'class': 'cb-axis-cap' }, svg);
    botCap.textContent = '万个';

    // 条形（轨道 + 填充 + 总量数值，数值默认显示）
    var barGroups = [];
    DATA.forEach(function (d, i) {
      var y = ROWS[i];
      var g = el('g', { 'class': 'cb-item', 'data-i': i }, svg);
      el('rect', { x: X0, y: y - BAR_H / 2, width: PW, height: BAR_H, rx: 10, 'class': 'cb-track' }, g);
      var w = bx(d.total) - X0;
      el('rect', { x: X0, y: y - BAR_H / 2, width: w, height: BAR_H, rx: 10,
        'class': 'cb-bar ' + (i === DATA.length - 1 ? 'tealb' : 'sageb') }, g);
      var yt = el('text', { x: X0 - 14, y: y + 5, 'text-anchor': 'end', 'class': 'cb-year' }, g);
      yt.textContent = d.year;
      var vt = el('text', { x: bx(d.total) + 14, y: y + 6, 'class': 'cb-val' }, g);
      vt.textContent = d.total + '万';
      barGroups.push(g);
    });

    // 折线（仅三个年份节点，不显示中间过渡值与默认数值标签）
    var pts = DATA.map(function (d, i) { return rx(d.rate) + ',' + ROWS[i]; });
    el('polyline', { points: pts.join(' '), 'class': 'cb-line' }, svg);

    var nodeGroups = [];
    var tips = [];
    DATA.forEach(function (d, i) {
      var g = el('g', {
        'class': 'cb-node', 'data-i': i, tabindex: '0', role: 'button',
        'aria-label': d.year + '，每千人口托位数' + d.rate + '个；对应托位总量' + d.total + '万个'
      }, svg);
      el('circle', { cx: rx(d.rate), cy: ROWS[i], r: 18, 'class': 'cb-hit' }, g);
      el('circle', { cx: rx(d.rate), cy: ROWS[i], r: 6.5, 'class': 'cb-dot' }, g);
      var tip = el('text', { x: rx(d.rate), y: ROWS[i] - BAR_H / 2 - 12,
        'text-anchor': 'middle', 'class': 'cb-tip' }, svg);
      tip.textContent = d.rate + ' 个/千人口';
      nodeGroups.push(g);
      tips.push(tip);
    });

    // 交互：悬停预览 / 点击固定，联动高亮对应条形
    var pinned = -1, hovered = -1;
    function render() {
      var act = hovered >= 0 ? hovered : pinned;
      svg.classList.toggle('has-active', act >= 0);
      barGroups.forEach(function (g, i) { g.classList.toggle('on', i === act); });
      nodeGroups.forEach(function (g, i) { g.classList.toggle('on', i === act); });
      tips.forEach(function (t, i) { t.classList.toggle('on', i === act); });
    }
    function bind(elm, i) {
      elm.addEventListener('mouseenter', function () { hovered = i; render(); });
      elm.addEventListener('mouseleave', function () { hovered = -1; render(); });
      elm.addEventListener('click', function () { pinned = pinned === i ? -1 : i; render(); });
      elm.addEventListener('focus', function () { hovered = i; render(); });
      elm.addEventListener('blur', function () { hovered = -1; render(); });
      elm.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === i ? -1 : i; render(); }
      });
    }
    barGroups.forEach(bind);
    nodeGroups.forEach(bind);
  })();

  /* ---------- 健康守护旅程：生长曲线上的三个站点 ---------- */
  (function () {
    var host = document.getElementById('carePath');
    var panel = document.getElementById('carePanel');
    if (!host || !panel) return;
    var NS = 'http://www.w3.org/2000/svg';

    var STATIONS = {
      record:  { title: '健康档案', stage: '入托时',   desc: '为入托婴幼儿建立健康档案，是健康管理的起点。' },
      check:   { title: '健康检查', stage: '在托期间', desc: '在托期间定期开展健康检查。' },
      monitor: { title: '生长监测', stage: '持续跟踪', desc: '跟踪生长发育情况，贯穿在托全程。' }
    };

    function el(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }

    var svg = el('svg', {
      'viewBox': '0 0 720 330', 'class': 'cp-svg', 'role': 'img',
      'aria-label': '入托健康守护旅程示意图：生长曲线串联健康档案、健康检查与生长监测，点击站点查看说明'
    }, host);
    host.insertBefore(svg, panel);

    // 生长图表底纹参考线
    [90, 165, 240].forEach(function (y) {
      el('line', { x1: 40, y1: y, x2: 690, y2: y, 'class': 'cp-grid' }, svg);
    });

    // 上扬的生长曲线（入场时描绘动画）
    el('path', {
      d: 'M70,244 C190,244 250,200 360,168 C470,136 560,96 646,66',
      'class': 'cp-curve', pathLength: '1'
    }, svg);

    var groups = {};

    // 站点一：入托建档（起点，档案夹）
    var g1 = el('g', { 'class': 'cp-station', 'data-k': 'record', tabindex: '0', role: 'button',
      'aria-label': '健康档案：为入托婴幼儿建立' }, svg);
    var b1 = el('g', { 'class': 'cp-badge' }, g1);
    el('circle', { cx: 70, cy: 244, r: 24, 'class': 'cp-node-bg' }, b1);
    el('path', { d: 'M60,239 h7 l2.5,3 h11 a2,2 0 0 1 2,2 v9 a2,2 0 0 1 -2,2 h-21 a2,2 0 0 1 -2,-2 v-14 a2,2 0 0 1 2,-2 z', 'class': 'cp-ico-fill' }, b1);
    el('circle', { cx: 70, cy: 244, r: 34, 'class': 'cp-hit' }, g1);
    var t1 = el('text', { x: 70, y: 296, 'class': 'cp-title' }, g1); t1.textContent = '健康档案';
    var s1 = el('text', { x: 70, y: 314, 'class': 'cp-stage' }, g1); s1.textContent = '入托时';
    groups.record = g1;

    // 站点二：定期检查（沿途三枚对勾，示意"定期开展"）
    var g2 = el('g', { 'class': 'cp-station', 'data-k': 'check', tabindex: '0', role: 'button',
      'aria-label': '健康检查：在托期间定期开展' }, svg);
    var b2 = el('g', { 'class': 'cp-badge' }, g2);
    [[219, 218], [360, 168], [512, 116]].forEach(function (p) {
      el('circle', { cx: p[0], cy: p[1], r: 17, 'class': 'cp-node-bg' }, b2);
      el('path', { d: 'M' + (p[0] - 6) + ',' + p[1] + ' l4,5 l8,-9', 'class': 'cp-ico-stroke' }, b2);
      el('circle', { cx: p[0], cy: p[1], r: 28, 'class': 'cp-hit' }, b2);
    });
    var t2 = el('text', { x: 360, y: 220, 'class': 'cp-title' }, g2); t2.textContent = '健康检查';
    var s2 = el('text', { x: 360, y: 238, 'class': 'cp-stage' }, g2); s2.textContent = '在托期间定期开展';
    groups.check = g2;

    // 站点三：生长监测（曲线顶点，星标）
    var g3 = el('g', { 'class': 'cp-station', 'data-k': 'monitor', tabindex: '0', role: 'button',
      'aria-label': '生长监测：跟踪生长发育情况' }, svg);
    var b3 = el('g', { 'class': 'cp-badge' }, g3);
    el('circle', { cx: 646, cy: 66, r: 24, 'class': 'cp-node-bg orange-bg' }, b3);
    el('path', { d: 'M646,56 l2.9,6.6 l7.1,0.3 l-5.4,4.8 l1.9,6.9 l-6.5,-4 l-6.5,4 l1.9,-6.9 l-5.4,-4.8 l7.1,-0.3 z', 'class': 'cp-ico-star' }, b3);
    el('circle', { cx: 646, cy: 66, r: 34, 'class': 'cp-hit' }, g3);
    var t3 = el('text', { x: 646, y: 112, 'class': 'cp-title' }, g3); t3.textContent = '生长监测';
    var s3 = el('text', { x: 646, y: 130, 'class': 'cp-stage' }, g3); s3.textContent = '持续跟踪';
    groups.monitor = g3;

    // 交互：悬停预览 / 点击固定
    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(groups).forEach(function (k) { groups[k].classList.toggle('on', k === act); });
      if (act) {
        var s = STATIONS[act];
        panel.innerHTML = '<span class="cd-stage">' + s.stage + '</span><b>' + s.title + '</b><p>' + s.desc + '</p>';
        panel.classList.add('has-detail');
      } else {
        panel.classList.remove('has-detail');
        panel.innerHTML = '<p class="care-hint">点击曲线上的站点，查看三项健康守护如何伴随入托全程。</p>';
      }
    }
    Object.keys(groups).forEach(function (k) {
      var g = groups[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 家 ⇄ 职场 流向图 ---------- */
  (function () {
    var host = document.getElementById('hwFlow');
    if (!host) return;
    var svg = host.querySelector('.hw-svg');
    var detail = document.getElementById('hwDetail');
    var INFO = {
      leave: '<b>32.9%</b> 因孩子无人照料而中断就业——从职场回到家中（婴幼儿全职母亲口径）。',
      back: '<b>75.5%</b> 照护服务充足时表示愿再次就业——从家中重返职场（同一批全职母亲）。'
    };
    var arrows = {};
    svg.querySelectorAll('.hw-arrow').forEach(function (g) { arrows[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(arrows).forEach(function (k) { arrows[k].classList.toggle('on', k === act); });
      detail.innerHTML = act ? '<p style="margin:0">' + INFO[act] + '</p>'
        : '<p class="hw-hint">箭头粗细对应比例大小；点击箭头查看数据口径。</p>';
    }
    Object.keys(arrows).forEach(function (k) {
      var g = arrows[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 供需落差图 ---------- */
  (function () {
    var host = document.getElementById('gapChart');
    if (!host) return;
    var svg = host.querySelector('.gap-svg');
    var detail = document.getElementById('gapDetail');
    var INFO = {
      demand: '<b>超过三成</b> 多地调查中，有送托需求的3岁以下婴幼儿家庭比例（家庭需求口径，2024年报告援引）。',
      enroll: '<b>7.86%</b>（不足三成）全国3岁以下婴幼儿实际入托率（儿童入托口径，2024年报告披露）。'
    };
    var cols = {};
    svg.querySelectorAll('.gap-col').forEach(function (g) { cols[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(cols).forEach(function (k) { cols[k].classList.toggle('on', k === act); });
      detail.innerHTML = act ? '<p style="margin:0">' + INFO[act] + '</p>'
        : '<p class="hw-hint">两数口径不同（家庭 vs 3岁以下婴幼儿；多地调查 vs 全国），并列用于呈现落差；点击色柱查看口径。</p>';
    }
    Object.keys(cols).forEach(function (k) {
      var g = cols[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 原因圆饼图 ---------- */
  (function () {
    var host = document.getElementById('reasonPie');
    if (!host) return;
    var svg = host.querySelector('.pie-svg');
    var detail = document.getElementById('pieDetail');
    var rankEl = document.getElementById('pieRank');
    var nameEl = document.getElementById('pieName');
    var INFO = {
      social: { rank: '01', name: '社交互动', desc: '让孩子获得与同伴交往的机会。' },
      care:   { rank: '02', name: '科学照护', desc: '希望由专业人员提供照顾与教育。' },
      prep:   { rank: '03', name: '入园准备', desc: '为未来进入幼儿园作准备。' }
    };
    var segs = {};
    svg.querySelectorAll('.pie-seg').forEach(function (g) { segs[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(segs).forEach(function (k) { segs[k].classList.toggle('on', k === act); });
      if (act) {
        var s = INFO[act];
        rankEl.textContent = s.rank;
        nameEl.textContent = s.name;
        detail.innerHTML = '<p style="margin:0"><b>' + s.rank + ' · ' + s.name + '</b> ' + s.desc + '</p>';
      } else {
        rankEl.textContent = '';
        nameEl.textContent = '三项原因';
        detail.innerHTML = '<p class="hw-hint">点击扇区查看对应原因；三个扇区为等分示意，仅表排序，不代表提及比例。</p>';
      }
    }
    Object.keys(segs).forEach(function (k) {
      var g = segs[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 门槛阶梯图 ---------- */
  (function () {
    var host = document.getElementById('stairChart');
    if (!host) return;
    var svg = host.querySelector('.stair-svg');
    var detail = document.getElementById('stairDetail');
    var INFO = {
      aff: '<b>第一级 · 付得起</b>（预算匹配）',
      tru: '<b>第二级 · 信得过</b>（质量可核实）',
      acc: '<b>第三级 · 接得到</b>（空间可达）',
      age: '<b>第四级 · 收得下</b>（月龄匹配）',
      tim: '<b>第五级 · 用得上</b>（时段合适）'
    };
    var steps = {};
    svg.querySelectorAll('.st-step').forEach(function (g) { steps[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(steps).forEach(function (k) { steps[k].classList.toggle('on', k === act); });
      detail.innerHTML = act ? '<p style="margin:0">' + INFO[act] + '——五项条件需同时满足，才能从家抵达托育园。</p>'
        : '<p class="hw-hint">从家出发，需同时跨过五级门槛才能抵达托育园；点击台阶查看。</p>';
    }
    Object.keys(steps).forEach(function (k) {
      var g = steps[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 供给主体天平图 ---------- */
  (function () {
    var host = document.getElementById('scaleChart');
    if (!host) return;
    var svg = host.querySelector('.scale-svg');
    var detail = document.getElementById('scaleDetail');
    var numEl = document.getElementById('scaleNum');
    var pans = {};
    svg.querySelectorAll('.scale-pan').forEach(function (g) { pans[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(pans).forEach(function (k) { pans[k].classList.toggle('on', k === act); });
      if (act === 'priv') {
        numEl.textContent = '89.5%';
        detail.innerHTML = '<p style="margin:0"><b>民办机构 89.5%</b>（2023年全国托育机构数量口径）——供给主体以民办机构为主，天平明显倾斜。</p>';
      } else if (act === 'other') {
        numEl.textContent = '89.5%';
        detail.innerHTML = '<p style="margin:0"><b>其他 10.5%</b>，由100%减去89.5%得到。</p>';
      } else {
        numEl.textContent = '89.5%';
        detail.innerHTML = '<p class="hw-hint">天平向民办机构一侧倾斜；点击盘面查看口径。</p>';
      }
    }
    Object.keys(pans).forEach(function (k) {
      var g = pans[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 供需悬崖图 ---------- */
  (function () {
    var host = document.getElementById('cliffChart');
    if (!host) return;
    var svg = host.querySelector('.cliff-svg');
    var detail = document.getElementById('cliffDetail');
    var INFO = {
      demand: '<b>65.3%</b> 在3332个回答具体托育需求的未入托家庭中，希望送到居住社区或附近的比例（需求口径，重庆研究）。',
      supply: '<b>6.15%</b> 社区建有托育设施的覆盖率（供给口径，2024年国务院报告援引抽样调查）。社区分母不同于县级分母，不能与98.8%的县级覆盖率画成一条增长曲线。'
    };
    var cols = {};
    svg.querySelectorAll('.cliff-col').forEach(function (g) { cols[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(cols).forEach(function (k) { cols[k].classList.toggle('on', k === act); });
      detail.innerHTML = act ? '<p style="margin:0">' + INFO[act] + '</p>'
        : '<p class="hw-hint">两数分母不同（家庭 vs 社区），并列用于呈现供需落差；点击色柱查看口径。</p>';
    }
    Object.keys(cols).forEach(function (k) {
      var g = cols[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 三维度未来阶梯图 ---------- */
  (function () {
    var host = document.getElementById('visionStair');
    if (!host) return;
    var svg = host.querySelector('.vs-svg');
    var detail = document.getElementById('vsDetail');
    var INFO = {
      price: '<b>价格</b> — 现状：全日托平均价格下降29%。<b>下一程：</b>让托育费用长期可承受。',
      access: '<b>可及性</b> — 现状：千人口托位4.73个，超过4.5的目标。<b>下一程：</b>让服务更贴近居住与工作地。',
      quality: '<b>安全质量</b> — 现状：8万家机构获得医卫签约支持。<b>下一程：</b>让专业照护与质量保障更稳定。'
    };
    var steps = {};
    svg.querySelectorAll('.vs-step').forEach(function (g) { steps[g.getAttribute('data-k')] = g; });

    var pinned = null, hovered = null;
    function render() {
      var act = hovered || pinned;
      svg.classList.toggle('has-active', !!act);
      Object.keys(steps).forEach(function (k) { steps[k].classList.toggle('on', k === act); });
      detail.innerHTML = act ? '<p style="margin:0">' + INFO[act] + '</p>'
        : '<p class="hw-hint">从现状迈向未来，三级台阶逐级提升；点击台阶查看“下一程”方向。</p>';
    }
    Object.keys(steps).forEach(function (k) {
      var g = steps[k];
      g.addEventListener('mouseenter', function () { hovered = k; render(); });
      g.addEventListener('mouseleave', function () { hovered = null; render(); });
      g.addEventListener('click', function () { pinned = pinned === k ? null : k; render(); });
      g.addEventListener('focus', function () { hovered = k; render(); });
      g.addEventListener('blur', function () { hovered = null; render(); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pinned = pinned === k ? null : k; render(); }
      });
    });
    render();
  })();

  /* ---------- 移动端菜单 ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('siteNav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
  });
  navLinks.forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('open');
      toggle.classList.remove('open');
    });
  });
})();
