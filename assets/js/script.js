(function(){
  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Elements
  const apiUrlEl = $('#apiUrl');
  const apiKeyEl = $('#apiKey');
  const modelEl = $('#model');
  const testBtn = $('#testBtn');
  const clearBtn = $('#clearBtn');
  const blocksContainer = $('#blocksContainer');
  const messageTimeline = $('#messageTimeline');
  const errorMessage = $('#errorMessage');
  const testTypeWrap = $('#testType');
  const userInputEl = $('#userInput');
  const manageConfigBtn = $('#manageConfigBtn');
  const configModal = $('#configModal');
  const closeConfigModalBtn = $('#closeConfigModal');
  const configListEl = $('#configList');
  const saveConfigBtn = $('#saveConfigBtn');
  const saveAsDefaultBtn = $('#saveAsDefaultBtn');
  const saveSuccessEl = $('#saveSuccess');
  const cancelEditBtn = $('#cancelEditBtn');
  const configNameEl = $('#configName');
  const configUrlEl = $('#configUrl');
  const configKeyEl = $('#configKey');
  const configModelEl = $('#configModel');
  const configModalTitleEl = $('#configModalTitle');
  const modalFormHeadingEl = $('#modalFormHeading');

  // Edit state
  let editingIndex = null;
  // Waiting loader state
  let requestPending = false;
  let waitingEl = null;

  // LocalStorage helpers
  function loadConfigs(){
    try { return JSON.parse(localStorage.getItem('apiConfigs')||'[]'); } catch { return []; }
  }
  function saveConfigs(cfgs){ localStorage.setItem('apiConfigs', JSON.stringify(cfgs)); }

  // URL helpers
  function stripTrailingSlash(u){ return (u || '').replace(/\/+$/, ''); }
  function buildEndpoint(base){ return stripTrailingSlash(base) + '/v1/chat/completions'; }
  function buildGeminiEndpoint(base, model, apiKey){
    const root = stripTrailingSlash(base);
    return `${root}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  }
  function buildAnthropicEndpoint(base){
    const root = stripTrailingSlash(base);
    return `${root}/v1/messages`;
  }

  // System defaults (single source of truth) with optional env override from window.APP_CONFIG
  const ENV_CFG = (typeof window !== 'undefined' && window.APP_CONFIG && typeof window.APP_CONFIG === 'object') ? window.APP_CONFIG : {};
  const SYSTEM_DEFAULTS = {
    apiUrl: ENV_CFG.apiUrl || 'https://api.openai.com',
    apiKey: ENV_CFG.apiKey || '',
    model: ENV_CFG.model || 'gemini-2.5-pro'
  };

  function displayConfigs(){
    const cfgs = loadConfigs();
    if(cfgs.length === 0){
      configListEl.innerHTML = '<p style="color:#64748b;text-align:center;">暂无保存的配置</p>';
      return;
    }
    configListEl.innerHTML = cfgs.map((c, i) => `
      <div class="config-item" data-index="${i}">
        <div class="config-info">
          <div class="config-name">${escapeHtml(c.name)}${c.isDefault ? ' <span class="badge-default">默认</span>' : ''}</div>
          <div class="config-url">${escapeHtml(c.url)}</div>
        </div>
        <div class="config-actions">
          <button class="icon-btn star-config ${c.isDefault ? 'starred' : ''}" data-star="${i}" aria-label="设为默认" title="设为默认">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
            </svg>
          </button>
          <button class="icon-btn edit-config" data-edit="${i}" aria-label="编辑">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.06-8.06.92.92L5.92 19.58zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
            </svg>
          </button>
          <button class="icon-btn delete-config" data-del="${i}" aria-label="删除">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path fill="currentColor" d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v11a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm6 2h-5V4h5v1zm-6 4a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V9zm5 0a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V9z"/>
            </svg>
            <span class="q-badge">?</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  // Escape HTML
  function escapeHtml(s){
    if(typeof s !== 'string') return '';
    return s.replace(/[&<>"{}]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','{':'&#123;','}':'&#125;'}[m]));
  }

  // Copy helper
  function attachCopy(btn, targetPre){
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(targetPre.textContent||'');
      const orig = btn.textContent;
      btn.textContent = '已复制';
      setTimeout(() => btn.textContent = orig, 1500);
    });
  }

  // Waiting inline loader helpers
  function ensureWaitingEl(){
    if(waitingEl) return waitingEl;
    const wrap = document.createElement('div');
    wrap.className = 'waiting-inline';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = '请求中';
    const dots = document.createElement('span');
    dots.className = 'dots';
    for(let i=0;i<3;i++){
      const d = document.createElement('span');
      d.className = 'dot';
      dots.appendChild(d);
    }
    wrap.appendChild(label);
    wrap.appendChild(dots);
    waitingEl = wrap;
    return waitingEl;
  }
  function showWaiting(){
    const el = ensureWaitingEl();
    if(el.parentNode !== messageTimeline){
      messageTimeline.appendChild(el);
    } else {
      // 重新追加到末尾，确保在最新一条消息下方
      messageTimeline.removeChild(el);
      messageTimeline.appendChild(el);
    }
  }
  function hideWaiting(){
    if(waitingEl && waitingEl.parentNode){ waitingEl.parentNode.removeChild(waitingEl); }
  }

  // Info inline block (tip/warning)
  function addInlineInfo(text){
    const el = document.createElement('div');
    el.className = 'info-inline';
    el.textContent = String(text || '提示');
    messageTimeline.appendChild(el);
    scrollLatestIntoView();
    return el;
  }

  // Error inline block under latest message
  function addInlineError(text, raw){
    const el = document.createElement('div');
    el.className = 'error-inline';
    el.textContent = String(text || '发生未知错误');
    // 确保等待动画被移除后再追加错误块
    hideWaiting();
    messageTimeline.appendChild(el);
    // 附带原始内容（JSON/纯文本），不再渲染 HTML 预览
    try{
      const rawText = raw && raw.rawText;
      const ct = (raw && raw.contentType || '').toLowerCase();
      if(rawText){
        const wrap = document.createElement('div');
        wrap.style.marginTop = '6px';
        // 若为 HTML 返回，补充友好提示
        const isHtml = ct.includes('text/html') || /^\s*<(!doctype|html|head|body)/i.test(rawText);
        let notice = null;
        if(isHtml){
          notice = document.createElement('div');
          notice.textContent = '检测到返回的是网页，您可能填写了错误的 API URL。';
          notice.style.color = '#b91c1c';
          notice.style.fontWeight = '600';
          notice.style.cursor = 'pointer';
          wrap.appendChild(notice);
        }
        const details = document.createElement('details');
        const sum = document.createElement('summary');
        sum.textContent = '查看原始返回';
        sum.style.cursor = 'pointer';
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-all';
        // 尝试美化 JSON；否则原样输出
        if(ct.includes('application/json')){
          try{ pre.textContent = JSON.stringify(JSON.parse(rawText), null, 2); }
          catch{ pre.textContent = rawText; }
        } else {
          pre.textContent = rawText;
        }
        details.appendChild(sum);
        details.appendChild(pre);
        wrap.appendChild(details);
        // 点击提示或“查看原始返回”文字都可展开/收起
        const toggle = () => { details.open = !details.open; };
        sum.addEventListener('click', (e) => { /* 使用默认展开行为并扩大可点击区域 */ });
        if(notice){
          notice.addEventListener('click', toggle);
          notice.addEventListener('keydown', (e)=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
          notice.tabIndex = 0; // 可聚焦
        }
        el.appendChild(wrap);
      }
    }catch{ /* 附加原始内容失败时安静降级 */ }
    // 滚动到最新位置（错误块所在）
    scrollLatestIntoView();
    return el;
  }

  // Scroll helpers: keep latest message aligned to page top
  function scrollLatestIntoView(){
    const cards = messageTimeline.querySelectorAll('.card.message');
    if(cards.length === 0) return;
    const last = cards[cards.length - 1];
    // 将最新消息滚动到页面顶部位置
    try{
      last.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }catch{ /* 兼容性兜底 */
      const top = window.scrollY + last.getBoundingClientRect().top;
      window.scrollTo({ top: Math.max(top - 8, 0), behavior: 'smooth' });
    }
  }

  // App modal helpers (custom alert/confirm)
  let appModalEl = null;
  function ensureAppModal(){
    if(appModalEl) return appModalEl;
    const overlay = document.createElement('div');
    overlay.className = 'app-modal';
    overlay.innerHTML = `
      <div class="box">
        <div class="title" id="appModalTitle">提示</div>
        <div class="content" id="appModalContent"></div>
        <div class="actions">
          <button class="btn" id="appModalCancel">取消</button>
          <button class="btn btn-primary" id="appModalOk">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    appModalEl = overlay;
    return appModalEl;
  }
  function openAppModal({ title = '提示', content = '', showCancel = false, okText = '确定', cancelText = '取消' } = {}){
    return new Promise((resolve) => {
      const el = ensureAppModal();
      const titleEl = el.querySelector('#appModalTitle');
      const contentEl = el.querySelector('#appModalContent');
      const okBtn = el.querySelector('#appModalOk');
      const cancelBtn = el.querySelector('#appModalCancel');
      titleEl.textContent = title;
      contentEl.textContent = content;
      okBtn.textContent = okText;
      cancelBtn.textContent = cancelText;
      cancelBtn.style.display = showCancel ? '' : 'none';
      el.classList.add('open');

      const cleanup = () => {
        el.classList.remove('open');
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        el.removeEventListener('click', onBackdrop);
        window.removeEventListener('keydown', onKey);
      };
      const onOk = () => { cleanup(); resolve(true); };
      const onCancel = () => { cleanup(); resolve(false); };
      // 点击空白：alert 视为确定；confirm 视为取消
      const onBackdrop = (e) => { if(e.target === el){ showCancel ? onCancel() : onOk(); } };
      const onKey = (e) => { if(e.key === 'Escape'){ showCancel ? onCancel() : onOk(); } };
      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
      el.addEventListener('click', onBackdrop);
      window.addEventListener('keydown', onKey);
    });
  }
  function appAlert(message, title = '提示'){ return openAppModal({ title, content: message, showCancel: false, okText: '知道了' }); }
  function appConfirm(message, title = '确认'){ return openAppModal({ title, content: message, showCancel: true, okText: '确定', cancelText: '取消' }); }

  // Apply config helpers
  function applyConfigToTop(cfg){
    if(!cfg) return;
    apiUrlEl.value = cfg.url || SYSTEM_DEFAULTS.apiUrl;
    apiKeyEl.value = cfg.key || SYSTEM_DEFAULTS.apiKey;
    modelEl.value = cfg.model || SYSTEM_DEFAULTS.model;
  }
  function applySystemDefaultToTop(){
    apiUrlEl.value = SYSTEM_DEFAULTS.apiUrl;
    apiKeyEl.value = SYSTEM_DEFAULTS.apiKey;
    modelEl.value = SYSTEM_DEFAULTS.model;
  }

  // UI builders
  function addBlock(title, payload){
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    const h = document.createElement('div');
    h.className = 'title';
    h.textContent = title;
    const copy = document.createElement('button');
    copy.className = 'copy-btn';
    copy.textContent = '复制';
    const pre = document.createElement('pre');
    pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    wrap.appendChild(h); wrap.appendChild(copy); wrap.appendChild(pre);
    blocksContainer.appendChild(wrap);
    attachCopy(copy, pre);
    return wrap;
  }

  function addMessage(role, label, payload){
    const card = document.createElement('div');
    card.className = `card message ${role}`;
    const title = document.createElement('div');
    title.className = 'title';
    const meta = document.createElement('div');
    meta.className = 'meta';
    const roleEl = document.createElement('span');
    roleEl.className = 'role';
    roleEl.textContent = role;
    const labelEl = document.createElement('span');
    labelEl.className = 'label';
    labelEl.textContent = `· ${label}`;
    meta.appendChild(roleEl); meta.appendChild(labelEl);
    const pre = document.createElement('pre');
    pre.textContent = typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);
    title.appendChild(meta);
    card.appendChild(title);
    card.appendChild(pre);
    messageTimeline.appendChild(card);
    // Keep waiting loader under the latest message while pending
    if(requestPending){ showWaiting(); }
    // Scroll page so that the latest message sits at page top
    scrollLatestIntoView();
    return card;
  }

  function clearResults(){
    blocksContainer.innerHTML = '';
    messageTimeline.innerHTML = '';
    errorMessage.textContent = '';
    hideWaiting();
  }

  // Config modal events
  manageConfigBtn.addEventListener('click', () => {
    configModal.classList.add('open');
    // reset edit state when opening
    clearEditForm();
    displayConfigs();
  });
  closeConfigModalBtn.addEventListener('click', () => configModal.classList.remove('open'));
  window.addEventListener('click', (e) => { if(e.target === configModal) configModal.classList.remove('open'); });
  window.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      // 若有自定义弹窗打开，仅关闭自定义弹窗，不关闭配置页
      if(document.querySelector('.app-modal.open')) return;
      configModal.classList.remove('open');
    }
  });

  configListEl.addEventListener('click', (e) => {
    const starBtn = e.target.closest('[data-star]');
    if(starBtn){
      const idx = parseInt(starBtn.getAttribute('data-star'),10);
      const cfgs = loadConfigs();
      const wasDefault = !!(cfgs[idx] && cfgs[idx].isDefault);
      if(wasDefault){
        // 取消默认，恢复系统预设
        cfgs.forEach((c) => { if(c) c.isDefault = false; });
        saveConfigs(cfgs);
        displayConfigs();
        applySystemDefaultToTop();
        appAlert('已取消默认，已恢复系统预设。');
      } else {
        // 设为默认，并应用到顶部
        cfgs.forEach((c, i) => { if(c) c.isDefault = (i === idx); });
        saveConfigs(cfgs);
        displayConfigs();
        applyConfigToTop(cfgs[idx]);
        appAlert('已设为默认配置。');
      }
      return;
    }
    const delBtn = e.target.closest('[data-del]');
    if(delBtn){
      const idx = parseInt(delBtn.getAttribute('data-del'),10);
      // 二次确认逻辑：首次点击进入确认态，显示问号；再次点击才删除
      if(!delBtn.classList.contains('confirm')){
        delBtn.classList.add('confirm');
        // 定时自动恢复
        if(delBtn._confirmTimer) clearTimeout(delBtn._confirmTimer);
        delBtn._confirmTimer = setTimeout(() => { try{ delBtn.classList.remove('confirm'); }catch{} delBtn._confirmTimer=null; }, 2500);
        return;
      }
      if(delBtn._confirmTimer){ clearTimeout(delBtn._confirmTimer); delBtn._confirmTimer=null; }
      const cfgs = loadConfigs();
      cfgs.splice(idx,1);
      saveConfigs(cfgs);
      displayConfigs();
      return;
    }
    const editBtn = e.target.closest('[data-edit]');
    if(editBtn){
      const idx = parseInt(editBtn.getAttribute('data-edit'),10);
      const cfg = loadConfigs()[idx];
      if(cfg){
        editingIndex = idx;
        configNameEl.value = cfg.name || '';
        configUrlEl.value = cfg.url || '';
        configKeyEl.value = cfg.key || '';
        configModelEl.value = cfg.model || SYSTEM_DEFAULTS.model;
        saveConfigBtn.textContent = '保存修改';
        cancelEditBtn.style.display = '';
        if(saveAsDefaultBtn) saveAsDefaultBtn.style.display = 'none';
        // 保存按钮切换为蓝色
        if(saveConfigBtn){ saveConfigBtn.classList.remove('btn-secondary'); saveConfigBtn.classList.add('btn-primary'); }
        if(configModalTitleEl) configModalTitleEl.textContent = '修改 API 配置';
        if(modalFormHeadingEl) modalFormHeadingEl.textContent = '修改配置';
      }
      return;
    }
    const item = e.target.closest('.config-item');
    if(!item) return;
    const index = parseInt(item.getAttribute('data-index'), 10);
    const cfg = loadConfigs()[index];
    if(cfg){
      apiUrlEl.value = cfg.url || '';
      apiKeyEl.value = cfg.key || '';
      modelEl.value = cfg.model || SYSTEM_DEFAULTS.model;
      configModal.classList.remove('open');
    }
  });

  // 普通保存：编辑时保留原 isDefault；新建为 false
  saveConfigBtn.addEventListener('click', async () => {
    const name = configNameEl.value.trim();
    const url = stripTrailingSlash(configUrlEl.value.trim());
    const key = configKeyEl.value.trim();
    const model = (configModelEl.value || SYSTEM_DEFAULTS.model).trim();
    if(!name || !url || !key){ await appAlert('请填写所有必填字段。'); return; }
    const cfgs = loadConfigs();
    if(editingIndex !== null){
      const prev = cfgs[editingIndex] || {};
      cfgs[editingIndex] = { ...prev, name, url, key, model };
    } else {
      cfgs.push({ name, url, key, model, isDefault: false });
    }
    saveConfigs(cfgs);
    clearEditForm();
    saveSuccessEl.textContent = '配置已保存';
    saveSuccessEl.style.display = 'block';
    setTimeout(() => saveSuccessEl.style.display = 'none', 1500);
    displayConfigs();
  });

  // 保存为默认配置：将该项设为唯一默认，并立即应用到顶部
  if(saveAsDefaultBtn){
    saveAsDefaultBtn.addEventListener('click', async () => {
      const name = configNameEl.value.trim();
      const url = stripTrailingSlash(configUrlEl.value.trim());
      const key = configKeyEl.value.trim();
      const model = (configModelEl.value || SYSTEM_DEFAULTS.model).trim();
      if(!name || !url || !key){ await appAlert('请填写所有必填字段。'); return; }
      const cfgs = loadConfigs();
      let idx;
      if(editingIndex !== null){
        const prev = cfgs[editingIndex] || {};
        cfgs[editingIndex] = { ...prev, name, url, key, model, isDefault: true };
        idx = editingIndex;
      } else {
        cfgs.push({ name, url, key, model, isDefault: true });
        idx = cfgs.length - 1;
      }
      // 唯一默认
      cfgs.forEach((c, i) => { if(i !== idx && c) c.isDefault = false; });
      saveConfigs(cfgs);
      applyConfigToTop(cfgs[idx]);
      clearEditForm();
      saveSuccessEl.textContent = '已保存并设为默认配置';
      saveSuccessEl.style.display = 'block';
      setTimeout(() => saveSuccessEl.style.display = 'none', 1500);
      displayConfigs();
    });
  }

  function clearEditForm(){
    editingIndex = null;
    configNameEl.value = '';
    configUrlEl.value = '';
    configKeyEl.value = '';
    configModelEl.value = SYSTEM_DEFAULTS.model;
    saveConfigBtn.textContent = '保存配置';
    cancelEditBtn.style.display = 'none';
    if(saveAsDefaultBtn) saveAsDefaultBtn.style.display = '';
    // 保存按钮恢复为灰色
    if(saveConfigBtn){ saveConfigBtn.classList.remove('btn-primary'); saveConfigBtn.classList.add('btn-secondary'); }
    if(configModalTitleEl) configModalTitleEl.textContent = '管理 API 配置';
    if(modalFormHeadingEl) modalFormHeadingEl.textContent = '添加新配置';
  }

  cancelEditBtn.addEventListener('click', () => {
    clearEditForm();
  });

  clearBtn.addEventListener('click', clearResults);

  // Defaults
  // Password toggle functionality
  function initPasswordToggles(){
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const eyeIcon = btn.querySelector('.eye-icon');
        const eyeOffIcon = btn.querySelector('.eye-off-icon');
        
        if(input.type === 'password'){
          input.type = 'text';
          eyeIcon.style.display = 'none';
          eyeOffIcon.style.display = 'block';
          btn.setAttribute('aria-label', '隐藏密码');
        } else {
          input.type = 'password';
          eyeIcon.style.display = 'block';
          eyeOffIcon.style.display = 'none';
          btn.setAttribute('aria-label', '显示密码');
        }
      });
    });
  }

  window.addEventListener('load', () => {
    // 初始化密码切换功能
    initPasswordToggles();
    
    // 自动应用默认配置
    const cfgs = loadConfigs();
    const d = cfgs.find(c => c && c.isDefault);
    if(d){
      apiUrlEl.value = d.url || apiUrlEl.value || SYSTEM_DEFAULTS.apiUrl;
      apiKeyEl.value = d.key || SYSTEM_DEFAULTS.apiKey;
      modelEl.value = d.model || modelEl.value || SYSTEM_DEFAULTS.model;
    } else {
      if(!apiUrlEl.value){ apiUrlEl.value = SYSTEM_DEFAULTS.apiUrl; }
      if(!modelEl.value){ modelEl.value = SYSTEM_DEFAULTS.model; }
    }
    // 占位留空：不再动态写入 placeholder
    // 默认测试文案
    if(userInputEl){ userInputEl.value = '当前时间是？'; }
  });

  // Segmented control: choose scenario
  function setActiveScenario(scenario){
    $$('.seg-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.scenario === scenario));
    switch(scenario){
      case 'openai_tools':
        userInputEl.value = '当前时间是？';
        break;
      case 'anthropic_tools':
        userInputEl.value = '当前时间是？';
        break;
      case 'gemini_tools':
        userInputEl.value = '当前时间是？';
        break;
      case 'gemini_search':
        userInputEl.value = '搜索当前最新的Gemini旗舰模型是？';
        break;
      case 'gemini_url_context':
        userInputEl.value = '这个工具有哪些特点？https://ai.google.dev/gemini-api/docs/url-context';
        break;
    }
  }
  if(testTypeWrap){
    testTypeWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if(!btn) return;
      setActiveScenario(btn.dataset.scenario);
      // 切换测试内容后自动清空历史记录
      clearResults();
    });
  }

  // Test function call flow (multiple scenarios)
  testBtn.addEventListener('click', async () => {
    const apiUrl = apiUrlEl.value.trim();
    const apiKey = apiKeyEl.value.trim();
    const model = (modelEl.value || SYSTEM_DEFAULTS.model).trim();
    if(!apiUrl || !apiKey){ await appAlert('请填写 API URL 和 API Key。'); return; }
    errorMessage.textContent = '';
    testBtn.disabled = true; testBtn.textContent = '请求中...';
    // 发起新请求前自动清空历史记录
    clearResults();

    const scenario = document.querySelector('.seg-btn.active')?.dataset.scenario || 'openai_tools';
    const endpoint = buildEndpoint(apiUrl);
    const geminiEndpoint = buildGeminiEndpoint(apiUrl, model, apiKey);
    const anthropicEndpoint = buildAnthropicEndpoint(apiUrl);

    try{
      requestPending = true; showWaiting();
      const userText = userInputEl.value.trim() || '当前时间是？';
      if(scenario === 'openai_tools'){
        // OpenAI: function call time query
        const requestBody1 = {
          model,
          messages: [ { role: 'user', content: userText } ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'get_current_time',
                description: '获取当前的日期和时间',
                parameters: {
                  type: 'object',
                  properties: {},
                  required: []
                }
              }
            }
          ],
          tool_choice: 'auto'
        };
        addBlock('请求 #1', requestBody1);
        addMessage('user', '消息 #1', requestBody1.messages[0]);

        const r1 = await fetchAndParse(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(requestBody1) });
        const data1 = ensureJsonOrThrow(r1);
        addBlock('响应 #1', data1);

        const choice = data1.choices && data1.choices[0];
        if(!choice){ throw new Error('响应无 choices'); }
        const assistantMsg = choice.message;
        addMessage('assistant', '消息 #2', assistantMsg);

        const toolCall = assistantMsg && assistantMsg.tool_calls && assistantMsg.tool_calls[0];
        if(!toolCall){
          addInlineInfo('未触发工具调用：模型可能未理解指令，或 API 异常。');
          return;
        }

        // Simulate tool execution
        const currentTime = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const toolMessage = {
          role: 'tool',
          content: JSON.stringify({ current_time: currentTime }),
          tool_call_id: toolCall.id
        };
        addMessage('tool', '消息 #3 (工具返回结果)', { current_time: currentTime });

        const requestBody2 = { model, messages: [ requestBody1.messages[0], assistantMsg, toolMessage ] };
        addBlock('请求 #2', requestBody2);
        const r2 = await fetchAndParse(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(requestBody2) });
        const data2 = ensureJsonOrThrow(r2);
        addBlock('响应 #2', data2);
        const finalChoice = data2.choices && data2.choices[0];
        if(finalChoice && finalChoice.message){ addMessage('assistant', '消息 #4 (最终回答)', finalChoice.message); }
      }
      else if(scenario === 'anthropic_tools'){
        // Anthropic Messages: function/tool use (two-step)
        const aReq1 = {
          model,
          max_tokens: 256,
          messages: [ { role: 'user', content: userText } ],
          tools: [
            {
              name: 'get_current_time',
              description: '获取当前的日期和时间',
              input_schema: { type: 'object', properties: {}, required: [] }
            }
          ]
        };
        addBlock('请求 #1', aReq1);
        addMessage('user', '消息 #1', aReq1.messages[0]);
        const aR1 = await fetchAndParse(anthropicEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify(aReq1)
        });
        const aData1 = ensureJsonOrThrow(aR1);
        addBlock('响应 #1', aData1);

        // find tool_use
        const contentArr1 = Array.isArray(aData1 && aData1.content) ? aData1.content : [];
        const toolUse = contentArr1.find(p => p && p.type === 'tool_use');
        if(!toolUse){ addInlineInfo('未触发工具调用：模型可能未理解指令，或 API 异常。'); return; }
        addMessage('assistant', '消息 #2', Array.isArray(aData1 && aData1.content) ? aData1.content : aData1);

        // Simulate tool result
        const currentTime = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const toolResultMsg = {
          role: 'user',
          content: [ { type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify({ current_time: currentTime }) } ]
        };
        addMessage('tool', '消息 #3 (工具返回结果)', { current_time: currentTime });

        const aReq2 = {
          model,
          max_tokens: 256,
          messages: [
            { role: 'user', content: userText },
            { role: 'assistant', content: [ toolUse ] },
            toolResultMsg
          ]
        };
        addBlock('请求 #2', aReq2);
        const aR2 = await fetchAndParse(anthropicEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify(aReq2)
        });
        const aData2 = ensureJsonOrThrow(aR2);
        addBlock('响应 #2', aData2);
        addMessage('assistant', '消息 #4 (最终回答)', Array.isArray(aData2 && aData2.content) ? aData2.content : aData2);
      }
      else if(scenario === 'gemini_tools'){
        // Gemini: function calling (two-step)
        const gReq1 = {
          systemInstruction: { parts: [{ text: '你是一个有帮助的助手。' }] },
          tools: [{ functionDeclarations: [
            {
              name: 'get_current_time',
              description: '获取当前的日期和时间',
              parameters: { type: 'object', properties: {}, required: [] }
            }
          ]}],
          toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
          contents: [{ role: 'user', parts: [{ text: userText }] }]
        };
        addBlock('请求 #1', gReq1);
        addMessage('user', '消息 #1', { role: 'user', parts: [{ text: userText }] });
        const gR1 = await fetchAndParse(geminiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gReq1) });
        const gData1 = ensureJsonOrThrow(gR1);
        addBlock('响应 #1', gData1);

        const gCand1 = gData1.candidates && gData1.candidates[0];
        const gContent1 = gCand1 && gCand1.content;
        if(gContent1){ addMessage('assistant', '消息 #2', gContent1); }

        // Detect functionCall in parts
        let fc = null;
        if(gContent1 && Array.isArray(gContent1.parts)){
          for(const p of gContent1.parts){ if(p.functionCall){ fc = p.functionCall; break; } }
        }
        if(!fc){
          addInlineInfo('未触发工具调用：模型可能未理解指令，或 API 异常。');
          return;
        }

        // Simulate tool result
        const currentTime = new Date().toLocaleString('zh-CN', {
          year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long',
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
        const funcResponsePart = { functionResponse: { name: fc.name || 'get_current_time', response: { current_time: currentTime } } };
        addMessage('tool', '消息 #3 (工具返回结果)', funcResponsePart.functionResponse.response);

        const gReq2 = {
          contents: [
            { role: 'user', parts: [{ text: userText }] },
            gContent1,
            { role: 'function', parts: [ funcResponsePart ] }
          ]
        };
        addBlock('请求 #2', gReq2);
        const gR2 = await fetchAndParse(geminiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gReq2) });
        const gData2 = ensureJsonOrThrow(gR2);
        addBlock('响应 #2', gData2);
        const gCand2 = gData2.candidates && gData2.candidates[0];
        if(gCand2 && gCand2.content){ addMessage('assistant', '消息 #4 (最终回答)', gCand2.content); }
      }
      else if(scenario === 'gemini_search'){
        const gReq = {
          tools: [{ googleSearch: {} }],
          contents: [{ role: 'user', parts: [{ text: userText || '搜索当前最新的Gemini旗舰模型是？' }] }]
        };
        addBlock('请求 #1', gReq);
        addMessage('user', '消息', gReq.contents[0]);
        const gR = await fetchAndParse(geminiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gReq) });
        const gData = ensureJsonOrThrow(gR);
        addBlock('响应 #1', gData);
        const cand = gData.candidates && gData.candidates[0];
        if(cand && cand.content){ addMessage('assistant', '回答', cand.content); }
      }
      else if(scenario === 'gemini_url_context'){
        const gReq = {
          tools: [{ urlContext: {} }],
          contents: [{ role: 'user', parts: [{ text: userText || '这个工具有哪些特点？https://ai.google.dev/gemini-api/docs/url-context' }] }]
        };
        addBlock('请求 #1', gReq);
        addMessage('user', '消息', gReq.contents[0]);
        const gR = await fetchAndParse(geminiEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(gReq) });
        const gData = ensureJsonOrThrow(gR);
        addBlock('响应 #1', gData);
        const cand = gData.candidates && gData.candidates[0];
        if(cand && cand.content){ addMessage('assistant', '回答', cand.content); }
      }

    }catch(err){
      console.error(err);
      // 清空顶部简要错误，改为在时间线内展示红色错误块
      errorMessage.textContent = '';
      addInlineError(`错误：${err && (err.message || err)}`, { rawText: err && err.rawText, contentType: err && err.contentType });
    }finally{
      requestPending = false;
      hideWaiting();
      testBtn.disabled = false; testBtn.textContent = '发送测试请求';
    }
  });

  // ---- network helpers ----
  async function fetchAndParse(url, options){
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let json; try { json = JSON.parse(text); } catch{}
    if(!res.ok){ const e = new Error(`HTTP ${res.status}`); e.status = res.status; e.rawText = text; e.contentType = contentType; throw e; }
    return { json, text, contentType };
  }
  function ensureJsonOrThrow(parsed){
    if(parsed && parsed.json) return parsed.json;
    const e = new Error('响应非 JSON');
    e.rawText = parsed && parsed.text;
    e.contentType = parsed && parsed.contentType;
    throw e;
  }
})();
