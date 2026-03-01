/* Kano Dairy V5 – Executive Corporate System
   CMS-driven (Decap CMS), PWA-ready, Netlify ready.
*/
(function(){
  "use strict";

  const state = {
    settings: null,
    content: {}
  };

  const qs = (s, el=document)=> el.querySelector(s);
  const qsa = (s, el=document)=> [...el.querySelectorAll(s)];
  const clamp = (n, a, b)=> Math.max(a, Math.min(b, n));

  async function loadJSON(path){
    const res = await fetch(path, {cache:"no-cache"});
    if(!res.ok) throw new Error("Failed to load "+path);
    return await res.json();
  }


  function normalizeList(data){
    if(Array.isArray(data)) return data;
    if(data && Array.isArray(data.items)) return data.items;
    return data;
  }


  function applyTheme(theme){
    const t = (theme === "dark") ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("kdcf_theme", t);
    const btn = qs("[data-theme-toggle]");
    if(btn){
      btn.setAttribute("aria-pressed", t === "dark" ? "true":"false");
      btn.querySelector("i")?.classList?.toggle("bi-moon-stars-fill", t==="dark");
      btn.querySelector("i")?.classList?.toggle("bi-sun-fill", t!=="dark");
      btn.querySelector("span")?.replaceChildren(document.createTextNode(t==="dark" ? "Dark" : "Light"));
    }
  }

  function initThemeToggle(defaultTheme){
    const saved = localStorage.getItem("kdcf_theme");
    applyTheme(saved || defaultTheme || "light");
    const btn = qs("[data-theme-toggle]");
    if(btn){
      btn.addEventListener("click", ()=>{
        const cur = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(cur === "dark" ? "light" : "dark");
      });
    }
  }

  function initPreloader(enable){
    const pre = qs("#preloader");
    if(!pre) return;
    if(!enable){
      pre.remove();
      return;
    }

    const hide = ()=>{
      setTimeout(()=>{
        pre.classList.add("animate__animated","animate__fadeOut");
        pre.addEventListener("animationend", ()=> pre.remove(), {once:true});
      }, 1500);
    };

    // If page already loaded (common when scripts load late), hide immediately.
    if(document.readyState === "complete"){
      hide();
    }else{
      window.addEventListener("load", hide, {once:true});
    }
  }
  function setText(id, text, fallback=""){
    const el = qs(`[data-bind="${id}"]`);
    if(el) el.textContent = (text ?? fallback);
  }

  function setHTML(id, html){
    const el = qs(`[data-bind-html="${id}"]`);
    if(el) el.innerHTML = html ?? "";
  }

  function setAttr(id, attr, value){
    const el = qs(`[data-bind-attr="${id}"]`);
    if(el) el.setAttribute(attr, value ?? "");
  }

  function buildTicker(items){
    const wrap = qs("#ticker");
    const track = qs("#tickerTrack");
    if(!wrap || !track) return;
    if(!items || !items.length){
      wrap.remove();
      return;
    }
    track.textContent = items.join("  •  ") + "  •  " + items.join("  •  ");
  }

  function renderServices(items){
    const grid = qs("#servicesGrid");
    if(!grid) return;
    grid.innerHTML = "";
    (items || []).forEach(s=>{
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 wow animate__animated animate__fadeInUp";
      col.setAttribute("data-wow-delay","0.1s");
      col.innerHTML = `
        <div class="card h-100 p-4">
          <div class="d-flex gap-3 align-items-start">
            <div class="icon"><i class="bi bi-${escapeHtml(s.icon || 'stars')}"></i></div>
            <div>
              <h5 class="fw-bold mb-1">${escapeHtml(s.title || '')}</h5>
              <p class="text-secondary mb-0">${escapeHtml(s.excerpt || '')}</p>
            </div>
          </div>
          <div class="mt-3 small text-secondary">${escapeHtml(s.details || '')}</div>
        </div>
      `;
      grid.appendChild(col);
    });
  }

  function renderProducts(items){
    const grid = qs("#productsGrid");
    if(!grid) return;
    grid.innerHTML = "";
    (items || []).forEach(p=>{
      const col = document.createElement("div");
      col.className = "col-sm-6 col-lg-3 wow animate__animated animate__fadeInUp";
      col.innerHTML = `
        <div class="card h-100 overflow-hidden">
          <img class="w-100" loading="lazy" src="${escapeAttr(p.image || '')}" alt="${escapeAttr(p.name || 'Product')}">
          <div class="p-3">
            <div class="d-flex align-items-center justify-content-between">
              <h6 class="fw-bold mb-1">${escapeHtml(p.name || '')}</h6>
              <span class="badge badge-soft">${escapeHtml(p.unit || '')}</span>
            </div>
            <div class="small text-secondary">${escapeHtml(p.description || '')}</div>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });
  }

  function renderTeam(items){
    const grid = qs("#teamGrid");
    if(!grid) return;
    grid.innerHTML = "";
    (items || []).forEach(m=>{
      const col = document.createElement("div");
      col.className = "col-md-6 col-lg-4 wow animate__animated animate__fadeInUp";
      col.innerHTML = `
        <div class="card h-100 overflow-hidden">
          <img class="w-100" loading="lazy" src="${escapeAttr(m.photo || '')}" alt="${escapeAttr(m.name || 'Team member')}">
          <div class="p-4">
            <h6 class="fw-bold mb-1">${escapeHtml(m.name || '')}</h6>
            <div class="text-gold fw-semibold">${escapeHtml(m.role || '')}</div>
            <p class="text-secondary mb-0 mt-2">${escapeHtml(m.bio || '')}</p>
          </div>
        </div>
      `;
      grid.appendChild(col);
    });
  }

  function renderTestimonials(items){
    const wrap = qs("#testimonials");
    const grid = qs("#testimonialsGrid");
    if(!grid || !wrap) return;
    if(!items || !items.length){ wrap.remove(); return; }
    grid.innerHTML="";
    (items||[]).forEach(t=>{
      const stars = clamp(parseInt(t.rating||5,10),1,5);
      const col = document.createElement("div");
      col.className="col-md-6 col-lg-4 wow animate__animated animate__fadeInUp";
      col.innerHTML = `
        <div class="card h-100 p-4">
          <div class="d-flex gap-1 mb-2 text-gold">${"★★★★★".slice(0,stars)}${"☆☆☆☆☆".slice(0,5-stars)}</div>
          <p class="mb-3">“${escapeHtml(t.quote||'')}”</p>
          <div class="small text-secondary fw-semibold">${escapeHtml(t.name||'')}</div>
          <div class="small text-secondary">${escapeHtml(t.role||'')}</div>
        </div>
      `;
      grid.appendChild(col);
    });
  }

  function renderClients(items){
    const wrap = qs("#clients");
    const grid = qs("#clientsGrid");
    if(!grid || !wrap) return;
    if(!items || !items.length){ wrap.remove(); return; }
    grid.innerHTML="";
    (items||[]).forEach(c=>{
      const col = document.createElement("div");
      col.className="col-6 col-md-4 col-lg-3 wow animate__animated animate__fadeInUp";
      col.innerHTML = `
        <div class="card p-3 h-100 d-flex align-items-center justify-content-center">
          <img loading="lazy" style="max-height:46px; width:auto;" src="${escapeAttr(c.logo||'')}" alt="${escapeAttr(c.name||'Client')}" />
        </div>
      `;
      grid.appendChild(col);
    });
  }

  function renderCounters(stats){
    const wrap = qs("#stats");
    const grid = qs("#statsGrid");
    if(!grid || !wrap) return;
    if(!stats || !stats.length){ wrap.remove(); return; }
    grid.innerHTML="";
    stats.forEach((s,idx)=>{
      const col = document.createElement("div");
      col.className="col-6 col-lg-3 wow animate__animated animate__fadeInUp";
      col.innerHTML=`
        <div class="card p-4 text-center h-100">
          <div class="counter text-gold" data-count="${escapeAttr(String(s.value ?? 0))}" data-suffix="${escapeAttr(s.suffix||'')}">0</div>
          <div class="small text-secondary fw-semibold mt-1">${escapeHtml(s.label||'')}</div>
        </div>
      `;
      grid.appendChild(col);
    });

    const counters = qsa("[data-count]", grid);
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el = e.target;
        const end = parseFloat(el.getAttribute("data-count")||"0");
        const suffix = el.getAttribute("data-suffix")||"";
        const start = 0;
        const dur = 900;
        const t0 = performance.now();
        function tick(t){
          const p = clamp((t - t0)/dur, 0, 1);
          const val = Math.round(start + (end-start)*p);
          el.textContent = String(val) + suffix;
          if(p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, {threshold:0.35});
    counters.forEach(c=> io.observe(c));
  }

  function escapeHtml(str){
    return String(str ?? "").replace(/[&<>"']/g, (m)=>({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
    }[m]));
  }
  function escapeAttr(str){ return escapeHtml(str).replace(/`/g,""); }

  function initWOW(){
    if(window.WOW){
      new WOW({mobile:false}).init();
    }
  }

  function initLightbox(){
    if(window.GLightbox){
      window._kdcfLightbox = GLightbox({selector:".glightbox"});
    }
  }

  // Masonry gallery with simple filter
  function initMasonryGallery(items){
    const grid = qs("#galleryGrid");
    const filters = qs("#galleryFilters");
    if(!grid || !filters) return;
    grid.innerHTML="";
    const cats = Array.from(new Set((items||[]).map(i=>i.category).filter(Boolean)));
    const allCats = ["All", ...cats];

    filters.innerHTML = allCats.map((c,i)=>`
      <button class="btn btn-sm ${i===0?'btn-gold':'btn-outline-gold'} me-2 mb-2" type="button" data-filter="${escapeAttr(c)}">${escapeHtml(c)}</button>
    `).join("");

    function buildCards(filter){
      grid.innerHTML="";
      const visible = (items||[]).filter(it=> filter==="All" || it.category===filter);
      visible.forEach(it=>{
        const el = document.createElement("div");
        el.className="col-12 col-sm-6 col-lg-4";
        el.innerHTML=`
          <a href="${escapeAttr(it.image||'')}" class="masonry-item d-block glightbox" data-gallery="kdcf-gallery" data-title="${escapeAttr(it.title||'')}">
            <img loading="lazy" src="${escapeAttr(it.image||'')}" alt="${escapeAttr(it.title||'Project')}">
            <div class="masonry-overlay">
              <div>
                <h6>${escapeHtml(it.title||'')}</h6>
                <div class="small">${escapeHtml(it.category||'')}</div>
              </div>
            </div>
          </a>
        `;
        grid.appendChild(el);
      });

      // Re-init lightbox safely
      if(window._kdcfLightbox && window._kdcfLightbox.destroy){
        try{ window._kdcfLightbox.destroy(); }catch(_){}
      }
      initLightbox();
    }

    buildCards("All");

    filters.addEventListener("click",(e)=>{
      const btn = e.target.closest("button[data-filter]");
      if(!btn) return;
      qsa("button", filters).forEach(b=>{
        b.classList.remove("btn-gold");
        b.classList.add("btn-outline-gold");
      });
      btn.classList.add("btn-gold");
      btn.classList.remove("btn-outline-gold");
      buildCards(btn.getAttribute("data-filter"));
    });
  }

  function setSEOFromSettings(settings){
    if(!settings?.seo) return;

    const metaTitle = settings.seo.metaTitle || settings.siteName || document.title;
    document.title = metaTitle;

    const desc = settings.seo.metaDescription || "";
    const metaDesc = qs('meta[name="description"]');
    if(metaDesc) metaDesc.setAttribute("content", desc);

    const ogTitle = qs('meta[property="og:title"]');
    const ogDesc = qs('meta[property="og:description"]');
    const ogImg = qs('meta[property="og:image"]');
    const ogUrl = qs('meta[property="og:url"]');

    if(ogTitle) ogTitle.setAttribute("content", metaTitle);
    if(ogDesc) ogDesc.setAttribute("content", desc);
    if(ogImg) ogImg.setAttribute("content", settings.seo.image || "/assets/img/logo.jpg");
    if(ogUrl) ogUrl.setAttribute("content", settings.seo.siteUrl || "");

    const twTitle = qs('meta[name="twitter:title"]');
    const twDesc = qs('meta[name="twitter:description"]');
    const twImg = qs('meta[name="twitter:image"]');
    if(twTitle) twTitle.setAttribute("content", metaTitle);
    if(twDesc) twDesc.setAttribute("content", desc);
    if(twImg) twImg.setAttribute("content", settings.seo.image || "/assets/img/logo.jpg");

    // JSON-LD Organization schema placeholder
    const schemaEl = qs("#orgSchema");
    if(schemaEl){
      const schema = {
        "@context":"https://schema.org",
        "@type":"Organization",
        "name": settings.siteName,
        "url": settings.seo.siteUrl,
        "logo": (settings.seo.image || "/assets/img/logo.jpg"),
        "address":{
          "@type":"PostalAddress",
          "addressLocality":"Kano",
          "addressCountry":"NG"
        },
        "email": settings.email,
        "telephone": (settings.phones && settings.phones[0]) ? settings.phones[0] : settings.phone,
        "sameAs":[]
      };
      schemaEl.textContent = JSON.stringify(schema);
    }
  }

  function wireWhatsApp(settings){
    const btn = qs('[data-whatsapp]');
    if(!btn) return;
    const number = (settings?.whatsapp || "").replace(/[^\d+]/g,"");
    btn.setAttribute("href", `https://wa.me/${number.replace('+','')}`);
  }

  function initProposalForm(settings){
    const form = qs("#proposalForm");
    if(!form) return;
    const email = settings?.contentEmail || settings?.email || "info@example.com";
    const emailField = qs("#proposalEmail");
    if(emailField) emailField.value = email;

    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      // Netlify Forms POST
      const fd = new FormData(form);
      try{
        const res = await fetch(form.getAttribute("action") || "/", {
          method:"POST",
          body: fd
        });
        if(res.ok){
          Swal.fire({icon:"success", title:"Submitted", text:"Your request has been received."});
          form.reset();
          if(emailField) emailField.value = email;
        }else{
          throw new Error("Bad response");
        }
      }catch(err){
        Swal.fire({icon:"error", title:"Error", text:"Could not submit. Please try again."});
      }
    });
  }

  function initContactForm(settings){
    const form = qs("#contactForm");
    if(!form) return;
    form.addEventListener("submit", async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      try{
        const res = await fetch(form.getAttribute("action") || "/", {method:"POST", body: fd});
        if(res.ok){
          Swal.fire({icon:"success", title:"Message sent", text:"We will respond shortly."});
          form.reset();
        }else{
          throw new Error("Bad response");
        }
      }catch(err){
        Swal.fire({icon:"error", title:"Error", text:"Could not send message. Please try again."});
      }
    });
  }

  function registerSW(){
    if(!("serviceWorker" in navigator)) return;
    window.addEventListener("load", ()=>{
      navigator.serviceWorker.register("/sw.js").catch(()=>{ /* silent */ });
    });
  }

  async function bootstrap(){
    // Load global settings first
    const settings = await loadJSON("/content/settings.json");
    state.settings = settings;

    setSEOFromSettings(settings);

    initThemeToggle(settings?.ui?.defaultTheme || "light");
    initPreloader(!!settings?.ui?.enablePreloader);

    buildTicker(settings?.tickerItems || []);
    if(settings?.ui?.tickerEnabled === false){
      const t = qs("#ticker"); if(t) t.remove();
    }

    // Bind basic global texts
    setText("siteName", settings.siteName);
    setText("tagline", settings.tagline);
    setText("heroHeadline", settings.hero.headline);
    setText("heroSubheadline", settings.hero.subheadline);

    const cta1 = qs("[data-hero-cta-primary]");
    if(cta1){
      cta1.textContent = settings.hero.ctaPrimaryText || "Download Profile";
      cta1.setAttribute("href", settings.hero.ctaPrimaryLink || "#");
    }
    const cta2 = qs("[data-hero-cta-secondary]");
    if(cta2){
      cta2.textContent = settings.hero.ctaSecondaryText || "Request Proposal";
      cta2.setAttribute("href", settings.hero.ctaSecondaryLink || "tender.html");
    }

    // Footer
    setText("footerAbout", settings.footer.about);
    const footerLinks = qs("#footerLinks");
    if(footerLinks){
      footerLinks.innerHTML = (settings.footer.quickLinks || []).map(l=>`<li class="mb-2"><a href="${escapeAttr(l.href)}">${escapeHtml(l.text)}</a></li>`).join("");
    }
    const year = new Date().getFullYear();
    const cr = (settings.footer.copyright || "").replace("{year}", String(year));
    setText("footerCopyright", cr);

    wireWhatsApp(settings);
    // Global contact binds (used in footer)
    setText("contactAddress", settings.address || settings.location || "");
    setText("contactEmail", settings.email || "");
    setText("contactPhone", (settings.phones && settings.phones[0]) ? settings.phones[0] : (settings.phone || ""));


    // Page-specific content
    const page = document.body.getAttribute("data-page") || "index";

    // Load shared collections based on existing placeholders
    const toLoad = [];
    if(qs("#servicesGrid")) toLoad.push(["services","/content/services.json"]);
    if(qs("#galleryGrid")) toLoad.push(["projects","/content/projects.json"]);
    if(qs("#productsGrid")) toLoad.push(["products","/content/products.json"]);
    if(qs("#teamGrid")) toLoad.push(["team","/content/team.json"]);
    if(qs("#testimonialsGrid")) toLoad.push(["testimonials","/content/testimonials.json"]);
    if(qs("#clientsGrid")) toLoad.push(["clients","/content/clients.json"]);
    if(qs("#statsGrid")) toLoad.push(["settings","/content/settings.json"]); // for counters

    // Extra pages
    if(page === "branches") toLoad.push(["branches","/content/branches.json"]);
    if(page === "investor") toLoad.push(["investor","/content/investor.json"]);
    if(page === "tender") toLoad.push(["tender","/content/tender.json"]);
    if(page === "certifications") toLoad.push(["certifications","/content/certifications.json"]);

    for(const [key, path] of toLoad){
      if(key === "settings") continue; // already loaded
      state.content[key] = normalizeList(await loadJSON(path));
    }

    // Render sections
    if(state.content.services) renderServices(state.content.services);
    if(state.content.products) renderProducts(state.content.products);
    if(state.content.team) renderTeam(state.content.team);
    if(state.content.testimonials) renderTestimonials(state.content.testimonials);
    if(state.content.clients) renderClients(state.content.clients);

    // Counters from settings.capacity.stats
    if(qs("#statsGrid")) renderCounters(settings?.capacity?.stats || []);

    // Masonry gallery uses projects
    if(state.content.projects) initMasonryGallery(state.content.projects);

    // Branches page list
    if(page === "branches"){
      const grid = qs("#branchesGrid");
      if(grid){
        grid.innerHTML = "";
        (state.content.branches || []).forEach(b=>{
          const col = document.createElement("div");
          col.className="col-lg-6 wow animate__animated animate__fadeInUp";
          col.innerHTML = `
            <div class="card p-4 h-100">
              <div class="d-flex align-items-start justify-content-between">
                <div>
                  <h5 class="fw-bold mb-1">${escapeHtml(b.name||'')}</h5>
                  <div class="text-secondary">${escapeHtml(b.coverage||'')}</div>
                </div>
                <span class="badge badge-soft">Branch</span>
              </div>
              <hr>
              <div class="small text-secondary"><i class="bi bi-geo-alt"></i> ${escapeHtml(b.address||'')}</div>
              <div class="small text-secondary mt-2"><i class="bi bi-telephone"></i> ${escapeHtml(b.phone||'')}</div>
              <div class="small text-secondary mt-2"><i class="bi bi-envelope"></i> ${escapeHtml(b.email||'')}</div>
            </div>
          `;
          grid.appendChild(col);
        });
      }
    }

    if(page === "investor" && state.content.investor){
      const inv = state.content.investor;
      setText("investorOverview", inv.overview);
      const roadmap = qs("#roadmap");
      if(roadmap){
        roadmap.innerHTML = (inv.roadmap||[]).map((r,idx)=>`
          <div class="col-md-6 col-lg-3 wow animate__animated animate__fadeInUp">
            <div class="card p-4 h-100">
              <div class="icon mb-3"><i class="bi bi-diagram-3"></i></div>
              <h6 class="fw-bold">${escapeHtml(r.title||'')}</h6>
              <div class="small text-secondary">${escapeHtml(r.text||'')}</div>
            </div>
          </div>
        `).join("");
      }
      const fin = qs("#financialHighlights");
      if(fin){
        fin.innerHTML = (inv.financialHighlights||[]).map(f=>`
          <div class="col-md-6 col-lg-3 wow animate__animated animate__fadeInUp">
            <div class="card p-4 h-100">
              <div class="small text-secondary">${escapeHtml(f.label||'')}</div>
              <div class="h5 fw-bold text-gold mt-1">${escapeHtml(f.value||'')}</div>
            </div>
          </div>
        `).join("");
      }
      const focus = qs("#investmentFocus");
      if(focus){
        focus.innerHTML = (inv.investmentFocus||[]).map(x=>`<li class="mb-2"><i class="bi bi-check2-circle text-gold"></i> ${escapeHtml(x)}</li>`).join("");
      }
    }

    if(page === "tender" && state.content.tender){
      const t = state.content.tender;
      setText("tenderTitle", t.pageTitle);
      setText("tenderIntro", t.intro);
      const dl = qs("[data-capability-download]");
      if(dl){
        dl.textContent = t.capabilityStatementButtonText || "Download Capability Statement";
        dl.setAttribute("href", t.capabilityStatementLink || "#");
      }
      const emailField = qs("#proposalEmail");
      if(emailField) emailField.value = t.contactEmail || settings.email || "";
      initProposalForm({contentEmail: t.contactEmail || settings.email});
    }

    if(page === "contact"){
      initContactForm(settings);
      // Populate contacts
      setText("contactAddress", settings.address);
      setText("contactEmail", settings.email);
      setText("contactPhone", (settings.phones && settings.phones[0]) ? settings.phones[0] : "");
    }

    if(page === "about"){
      // Company profile section
      const cp = settings.companyProfile || {};
      setText("regInfo", cp.registrationInfo);
      setText("yearsOp", cp.yearsOfOperation);
      const sectors = qs("#sectors");
      if(sectors){
        sectors.innerHTML = (cp.operationalSectors||[]).map(x=>`<li class="mb-2"><i class="bi bi-check2-circle text-gold"></i> ${escapeHtml(x)}</li>`).join("");
      }
      const obj = qs("#objectives");
      if(obj){
        obj.innerHTML = (cp.objectives||[]).map(x=>`<li class="mb-2"><i class="bi bi-check2-circle text-gold"></i> ${escapeHtml(x)}</li>`).join("");
      }
      const comp = qs("#compliance");
      if(comp){
        comp.innerHTML = (cp.complianceStandards||[]).map(x=>`<li class="mb-2"><i class="bi bi-shield-check text-gold"></i> ${escapeHtml(x)}</li>`).join("");
      }
      // Certifications preview
      const certGrid = qs("#certGrid");
      if(certGrid){
        const certs = normalizeList(await loadJSON("/content/certifications.json"));
        certGrid.innerHTML = (certs||[]).map(c=>`
          <div class="col-md-6 col-lg-4 wow animate__animated animate__fadeInUp">
            <div class="card p-4 h-100">
              <div class="d-flex align-items-center gap-3">
                <img loading="lazy" src="${escapeAttr(c.image||'')}" alt="${escapeAttr(c.title||'Certificate')}" style="width:56px;height:56px;border-radius:16px;object-fit:cover;">
                <div>
                  <div class="badge badge-soft">${escapeHtml(c.badgeText||'Certificate')}</div>
                  <div class="fw-bold mt-2">${escapeHtml(c.title||'')}</div>
                </div>
              </div>
              <div class="small text-secondary mt-3">${escapeHtml(c.description||'')}</div>
            </div>
          </div>
        `).join("");
      }
    }

    initWOW();
    registerSW();
  }

  bootstrap().catch((err)=>{
    // Fail gracefully without console spam
    console.error(err);
    const pre = qs("#preloader"); if(pre) pre.remove();
    const toast = document.createElement("div");
    toast.className="position-fixed bottom-0 end-0 p-3";
    toast.style.zIndex="2001";
    toast.innerHTML = `
      <div class="alert alert-danger shadow-sm mb-0">
        <strong>Content load error.</strong> Please refresh or check deployment paths.
      </div>`;
    document.body.appendChild(toast);
  });

})();
