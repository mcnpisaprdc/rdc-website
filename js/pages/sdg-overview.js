  (function(){
    var G=[
      ["No Poverty","End poverty in all its forms everywhere","#E5243B","Goal 1 aims to end poverty everywhere, looking beyond income to access to health care, food, education and decent work.","Poverty eradication"],
      ["Zero Hunger","End hunger, achieve food security and improved nutrition and promote sustainable agriculture","#DDA63A","Goal 2 seeks to end hunger, secure good nutrition for everyone and support farming that sustains both people and land.","Food security and nutrition"],
      ["Good Health and Well-being","Ensure healthy lives and promote well-being for all at all ages","#4C9F38","Goal 3 works toward healthy lives and well-being for people of all ages, from primary care to protection against disease.","Health and well-being"],
      ["Quality Education","Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all","#C5192D","Goal 4 promotes inclusive, quality education and learning opportunities that last a lifetime.","Lifelong learning"],
      ["Gender Equality","Achieve gender equality and empower all women and girls","#FF3A21","Goal 5 pushes for equal rights and opportunities for women and girls at home, at work and in public life.","Women’s empowerment"],
      ["Clean Water and Sanitation","Ensure availability and sustainable management of water and sanitation for all","#26BDE2","Goal 6 aims for safe drinking water, sanitation and well-managed water resources for everyone.","Safe water and sanitation"],
      ["Affordable and Clean Energy","Ensure access to affordable, reliable, sustainable and modern energy for all","#FCC30B","Goal 7 calls for reliable, affordable and clean energy that reaches every household and business.","Clean and modern energy"],
      ["Decent Work and Economic Growth","Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all","#A21942","Goal 8 supports steady, inclusive economic growth and productive, decent jobs for all.","Decent work and growth"],
      ["Industry, Innovation and Infrastructure","Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation","#FD6925","Goal 9 focuses on resilient infrastructure and inclusive industry and innovation that widen opportunity.","Innovation and infrastructure"],
      ["Reduced Inequalities","Reduce inequality within and among countries","#DD1367","Goal 10 works to narrow gaps in income, opportunity and treatment within and between countries.","Inclusion and equity"],
      ["Sustainable Cities and Communities","Make cities and human settlements inclusive, safe, resilient and sustainable","#FD9D24","Goal 11 aims to make cities and communities safe, inclusive, resilient and sustainable.","Resilient communities"],
      ["Responsible Consumption and Production","Ensure sustainable consumption and production patterns","#BF8B2E","Goal 12 encourages wiser use of resources and less waste in how we produce and consume.","Sustainable consumption"],
      ["Climate Action","Take urgent action to combat climate change and its impacts","#3F7E44","Goal 13 calls for urgent action on climate change and for helping communities cope with its effects.","Climate adaptation"],
      ["Life Below Water","Conserve and sustainably use the oceans, seas and marine resources for sustainable development","#0A97D9","Goal 14 seeks to protect oceans, seas and marine life and to use their resources sustainably.","Marine conservation"],
      ["Life on Land","Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss","#56C02B","Goal 15 aims to protect forests and land ecosystems, restore degraded land and halt biodiversity loss.","Forests and biodiversity"],
      ["Peace, Justice and Strong Institutions","Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels","#00689D","Goal 16 promotes peaceful, inclusive societies, access to justice and accountable institutions.","Justice and strong institutions"],
      ["Partnerships for the Goals","Strengthen the means of implementation and revitalize the Global Partnership for Sustainable Development","#19486A","Goal 17 builds the partnerships and resources needed to deliver every other goal.","Global partnerships"]
    ];

    var E = window.RDC_CONTENT;

    var common="The MCNP &amp; ISAP Research &amp; Development Center brings this goal into its research and community extension work in Cagayan Valley, turning academic, clinical and legal expertise into support for the communities that need it most.";

    function $(id){ return document.getElementById(id); }
    function pad(n){ return (n < 10 ? '0' : '') + n; }
    function badge(n){
      var num = pad(n);
      var title = (G[n - 1] && G[n - 1][0]) ? ('SDG ' + n + ': ' + G[n - 1][0]) : ('SDG ' + n);
      return '<span class="un-badge-icon" title="' + title + '">' +
        '<img src="assets/E%20SDG%20Icons%20WEB/E-WEB-Goal-' + num + '.png" alt="' + title + '" loading="lazy" decoding="async">' +
      '</span>';
    }
    function eventUrl(item){ return item.url; }

    // Render Goal Selector Bar
    $("un-goalbar").firstElementChild.innerHTML = G.map(function(goal, i){
      var gNum = i + 1;
      return '<a href="?goal=' + gNum + '" data-goal="' + gNum + '" style="--c:' + goal[2] + '" aria-label="Goal ' + gNum + ': ' + goal[0] + '">' + gNum + '</a>';
    }).join("");

    function show(n, smoothScroll){
      var goal = G[n - 1];
      if (!goal) return;
      var nextGoal = n === 17 ? 1 : n + 1;
      var prevGoal = n === 1 ? 17 : n - 1;

      // Update Theme CSS Variable & Badges
      $("un-page").style.setProperty("--goal", goal[2]);
      $("sdg-top-badge").style.background = goal[2];
      $("sdg-top-badge").textContent = "SDG " + n + " Active";
      $("sdg-top-name").textContent = goal[0];
      $("un-breadcrumb-curr").textContent = "Goal " + n + ": " + goal[0];

      // Update Hero Icon
      $("un-hero-icon").src = "assets/E%20SDG%20Icons%20WEB/E-WEB-Goal-" + pad(n) + ".png";
      $("un-hero-icon").alt = "SDG " + n + ": " + goal[0];

      $("un-num").textContent = n;
      $("un-title").textContent = goal[1];

      // Pagers
      var nextLink = $("un-next");
      nextLink.dataset.goal = String(nextGoal);
      nextLink.href = "?goal=" + nextGoal;
      nextLink.innerHTML = "Goal " + nextGoal + " ";

      var prevLink = $("un-prev");
      prevLink.dataset.goal = String(prevGoal);
      prevLink.href = "?goal=" + prevGoal;
      prevLink.innerHTML = " Goal " + prevGoal;

      // Overview
      $("un-ov").innerHTML = '<p style="font-weight: 500; font-size: 1.15rem; color: #0f172a; margin-bottom: 1.25rem;">' + goal[3] + '</p><p>' + common + '</p>';

      // Filter events & topics
      var list = E.filter(function(item){ return item.g.indexOf(n) > -1; });
      if ($("un-ev-count-badge")) {
        $("un-ev-count-badge").textContent = list.length + (list.length === 1 ? " Item" : " Items");
      }

      $("un-topic").innerHTML = list.length ? list.map(function(item){
        return '<li><a href="' + eventUrl(item) + '"><span class="un-related-date">' + item.topic + '</span><span class="un-related-title">' + item.t + '</span></a></li>';
      }).join("") : '<li><p class="un-related-empty">No related stories are tagged with this goal yet. <a href="news-events.html">Browse all news &amp; events </a></p></li>';

      $("un-events").innerHTML = list.length ? list.map(function(item){
        return '<a class="un-ev" href="' + eventUrl(item) + '"><div class="un-day">' + item.d + '</div><div class="un-mon">' + item.m + '</div>' + (item.topic ? '<div class="un-ev-topic">' + item.topic + '</div>' : '') + '<h3>' + item.t + '</h3><div class="un-range">' + item.r + (item.sourceNote ? '<br>' + item.sourceNote : '') + '</div><div class="un-ev-link">View source </div><div class="un-ev-goals"><small>Related Goals</small><div class="un-ev-goals-strip">' + item.g.map(badge).join("") + '</div></div></a>';
      }).join("") : '<p class="un-empty">No events are listed for this goal yet. <a href="news-events.html">Browse all events </a></p>';

      // Update Active state in goalbar
      Array.prototype.forEach.call($("un-goalbar").querySelectorAll("a"), function(link){
        if (Number(link.dataset.goal) === n) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      document.title = "SDG " + n + ": " + goal[0] + " | SDG Overview | MCNP & ISAP RDC";

      if (smoothScroll) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    function fromUrl(){
      var q = parseInt(new URLSearchParams(location.search).get("goal"), 10);
      return q >= 1 && q <= 17 ? q : 1;
    }

    document.addEventListener("click", function(e){
      var link = e.target.closest("[data-goal]");
      if (!link) return;
      e.preventDefault();
      var n = Number(link.dataset.goal);
      history.pushState(null, "", "?goal=" + n);
      show(n, true);
    });

    window.addEventListener("popstate", function(){
      show(fromUrl(), false);
    });

    show(fromUrl(), false);
  })();
