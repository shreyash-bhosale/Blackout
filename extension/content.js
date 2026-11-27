// Blackout Guard — Content Script (Manifest V3)
// Strictly client-side, zero network calls, zero persistence of sensitive data.

(() => {
  // Prevent duplicate listener registration
  if (window.__BLACKOUT_GUARD_INITIALIZED__) return;
  window.__BLACKOUT_GUARD_INITIALIZED__ = true;

  // In-memory tab-scoped state (never persisted, destroyed on page navigation/reload)
  let undoSnapshot = null;
  let guardModeEnabled = false;
  let guardModeRedactionMode = 'full';
  let activePasteModalHost = null;
  const fieldIndicators = new Map(); // el -> { outlineOriginal, badgeHost }

  function getCore() {
    return window.__BLACKOUT_CORE__ || (typeof module !== 'undefined' && module.exports) || null;
  }

  // Check if element is an eligible editable field
  function isEligibleField(el) {
    if (!el || !(el instanceof Element)) return { eligible: false };

    // Explicitly check for password and hidden inputs FIRST before reading any value
    if (el.tagName === 'INPUT') {
      const type = (el.getAttribute('type') || el.type || 'text').toLowerCase();
      if (type === 'password' || type === 'hidden') {
        return { eligible: false, excludedType: type };
      }
      const supportedInputTypes = ['text', 'email', 'tel', 'search', 'url'];
      if (!supportedInputTypes.includes(type)) {
        return { eligible: false, excludedType: type };
      }
      if (el.disabled || el.readOnly) {
        return { eligible: false, disabled: true };
      }
      return { eligible: true, type: 'input' };
    }

    if (el.tagName === 'TEXTAREA') {
      if (el.disabled || el.readOnly) {
        return { eligible: false, disabled: true };
      }
      return { eligible: true, type: 'textarea' };
    }

    if (el.isContentEditable) {
      // Avoid processing nested contenteditable nodes if ancestor is already contenteditable
      if (el.parentElement && el.parentElement.isContentEditable) {
        return { eligible: false, nested: true };
      }
      return { eligible: true, type: 'contenteditable' };
    }

    return { eligible: false };
  }

  function getFieldText(el, fieldType) {
    if (fieldType === 'contenteditable') {
      return el.innerText || el.textContent || '';
    }
    return el.value || '';
  }

  function setFieldValue(el, fieldType, newValue) {
    if (fieldType === 'contenteditable') {
      el.textContent = newValue;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    if (el instanceof HTMLInputElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, newValue);
      } else {
        el.value = newValue;
      }
    } else if (el instanceof HTMLTextAreaElement) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, newValue);
      } else {
        el.value = newValue;
      }
    } else {
      el.value = newValue;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function insertPastedText(el, fieldType, text) {
    if (fieldType === 'contenteditable') {
      el.focus();
      if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
        document.execCommand('insertText', false, text);
      } else {
        setFieldValue(el, fieldType, text);
      }
      return;
    }
    el.focus();
    const start = (typeof el.selectionStart === 'number') ? el.selectionStart : (el.value || '').length;
    const end = (typeof el.selectionEnd === 'number') ? el.selectionEnd : (el.value || '').length;
    const currentVal = el.value || '';
    const updatedVal = currentVal.slice(0, start) + text + currentVal.slice(end);
    setFieldValue(el, fieldType, updatedVal);
    const newPos = start + text.length;
    try {
      if (typeof el.setSelectionRange === 'function') {
        el.setSelectionRange(newPos, newPos);
      }
    } catch (e) {}
  }

  function removePasteGuardModal() {
    if (activePasteModalHost && activePasteModalHost.parentNode) {
      activePasteModalHost.parentNode.removeChild(activePasteModalHost);
    }
    activePasteModalHost = null;
  }

  function showPasteGuardModal(targetEl, fieldType, originalText, findings, core) {
    removePasteGuardModal();

    const host = document.createElement('div');
    host.className = '__blackout_guard_modal_host__';
    host.style.position = 'fixed';
    host.style.top = '0';
    host.style.left = '0';
    host.style.width = '100vw';
    host.style.height = '100vh';
    host.style.zIndex = '2147483647';
    host.style.display = 'flex';
    host.style.alignItems = 'center';
    host.style.justifyContent = 'center';
    host.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    host.style.backdropFilter = 'blur(4px)';

    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .dialog {
        background: #09090B;
        border: 1px solid #27272A;
        border-radius: 12px;
        width: 440px;
        max-width: 90vw;
        padding: 24px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #F5F5F7;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }
      .shield {
        width: 24px;
        height: 24px;
        color: #DC2626;
      }
      .title {
        font-size: 16px;
        font-weight: 700;
        letter-spacing: -0.01em;
      }
      .subtitle {
        font-size: 13px;
        color: #A1A1AA;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      .badges-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 16px;
      }
      .badge {
        font-size: 11px;
        font-weight: 600;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(220, 38, 38, 0.2);
        color: #EF4444;
        border: 1px solid rgba(220, 38, 38, 0.4);
      }
      .preview-box {
        background: #18181B;
        border: 1px solid #27272A;
        border-radius: 6px;
        padding: 10px;
        font-size: 12px;
        font-family: ui-monospace, SFMono-Regular, monospace;
        color: #D4D4D8;
        max-height: 120px;
        overflow-y: auto;
        margin-bottom: 20px;
        white-space: pre-wrap;
        word-break: break-all;
      }
      .btn-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      button {
        font-family: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 10px 14px;
        border-radius: 6px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .btn-redact {
        background: #DC2626;
        color: #FFFFFF;
      }
      .btn-redact:hover {
        background: #B91C1C;
      }
      .btn-raw {
        background: #27272A;
        color: #F5F5F7;
        border-color: #3F3F46;
      }
      .btn-raw:hover {
        background: #3F3F46;
      }
      .btn-cancel {
        background: transparent;
        color: #A1A1AA;
      }
      .btn-cancel:hover {
        color: #FFFFFF;
      }
    `;

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    const header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = `
      <svg class="shield" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      <span class="title">Blackout Guard — PII Warning</span>
    `;

    const subtitle = document.createElement('div');
    subtitle.className = 'subtitle';
    subtitle.textContent = `Detected ${findings.length} sensitive item${findings.length === 1 ? '' : 's'} in clipboard content before pasting into this form field. Choose an action:`;

    const badgesRow = document.createElement('div');
    badgesRow.className = 'badges-row';
    const uniqueTypes = Array.from(new Set(findings.map(f => f.type)));
    uniqueTypes.forEach(t => {
      const b = document.createElement('span');
      b.className = 'badge';
      b.textContent = t;
      badgesRow.appendChild(b);
    });

    const previewBox = document.createElement('div');
    previewBox.className = 'preview-box';
    const maskedPreviews = findings.slice(0, 5).map(f => `• [${f.type}] ${core.partial ? core.partial(f) : '[REDACTED]'}`);
    if (findings.length > 5) {
      maskedPreviews.push(`... and ${findings.length - 5} more`);
    }
    previewBox.textContent = maskedPreviews.join('\n');

    const btnGrid = document.createElement('div');
    btnGrid.className = 'btn-grid';

    const btnRedact = document.createElement('button');
    btnRedact.className = 'btn-redact';
    btnRedact.textContent = `Redact and Paste (${guardModeRedactionMode.toUpperCase()})`;
    btnRedact.addEventListener('click', () => {
      removePasteGuardModal();
      let sanitizedText = '';
      if (guardModeRedactionMode === 'delete') {
        let out = '';
        let lastIdx = 0;
        for (const f of findings) {
          out += originalText.slice(lastIdx, f.start);
          lastIdx = f.end;
        }
        out += originalText.slice(lastIdx);
        sanitizedText = out;
      } else {
        sanitizedText = core.sanitize(originalText, findings, guardModeRedactionMode).text;
      }
      insertPastedText(targetEl, fieldType, sanitizedText);
    });

    const btnRaw = document.createElement('button');
    btnRaw.className = 'btn-raw';
    btnRaw.textContent = 'Paste Anyway (Unsafe)';
    btnRaw.addEventListener('click', () => {
      removePasteGuardModal();
      insertPastedText(targetEl, fieldType, originalText);
    });

    const btnCancel = document.createElement('button');
    btnCancel.className = 'btn-cancel';
    btnCancel.textContent = 'Cancel';
    btnCancel.addEventListener('click', () => {
      removePasteGuardModal();
    });

    btnGrid.appendChild(btnRedact);
    btnGrid.appendChild(btnRaw);
    btnGrid.appendChild(btnCancel);

    dialog.appendChild(header);
    dialog.appendChild(subtitle);
    dialog.appendChild(badgesRow);
    dialog.appendChild(previewBox);
    dialog.appendChild(btnGrid);

    shadow.appendChild(style);
    shadow.appendChild(dialog);

    document.body.appendChild(host);
    activePasteModalHost = host;
  }

  // Clear Shadow DOM indicators
  function clearFieldIndicators() {
    fieldIndicators.forEach((info, el) => {
      try {
        if (el.isConnected) {
          el.style.outline = info.outlineOriginal || '';
          el.style.outlineOffset = info.outlineOffsetOriginal || '';
        }
        if (info.badgeHost && info.badgeHost.parentNode) {
          info.badgeHost.parentNode.removeChild(info.badgeHost);
        }
      } catch (e) {}
    });
    fieldIndicators.clear();
  }

  // Attach isolated Shadow DOM indicator badge
  function attachFieldIndicator(el, count) {
    try {
      const outlineOriginal = el.style.outline;
      const outlineOffsetOriginal = el.style.outlineOffset;

      el.style.outline = '2px solid #EF4444';
      el.style.outlineOffset = '2px';

      // Create host element for Shadow DOM badge
      const host = document.createElement('div');
      host.className = '__blackout_badge_host__';
      host.style.position = 'relative';
      host.style.display = 'inline-block';
      host.style.width = '0';
      host.style.height = '0';
      host.style.overflow = 'visible';
      host.style.pointerEvents = 'none';
      host.style.zIndex = '2147483647';

      const shadow = host.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        .badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          background: #DC2626;
          color: #FFFFFF;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          letter-spacing: 0.02em;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }
      `;
      const badge = document.createElement('div');
      badge.className = 'badge';
      badge.textContent = `${count} PII`;

      shadow.appendChild(style);
      shadow.appendChild(badge);

      if (el.parentNode) {
        el.parentNode.insertBefore(host, el.nextSibling);
      }

      fieldIndicators.set(el, {
        outlineOriginal,
        outlineOffsetOriginal,
        badgeHost: host
      });
    } catch (err) {
      // Fail safely without affecting page functionality
    }
  }

  // Find all eligible editable elements on page and accessible frames
  function getEditableElements() {
    const candidates = Array.from(document.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable=""]'));
    
    // Also discover editable fields inside accessible same-origin/srcdoc iframes
    try {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      for (const frame of iframes) {
        try {
          const doc = frame.contentDocument || (frame.contentWindow && frame.contentWindow.document);
          if (doc) {
            const frameCandidates = Array.from(doc.querySelectorAll('input, textarea, [contenteditable="true"], [contenteditable=""]'));
            candidates.push(...frameCandidates);
          }
        } catch (frameErr) {
          // Cross-origin iframe inaccessible due to SOP - skip safely
        }
      }
    } catch (e) {}

    const eligible = [];
    let skippedOversized = 0;

    for (const el of candidates) {
      const check = isEligibleField(el);
      if (check.eligible) {
        // Size constraint check (max 200,000 characters)
        const text = getFieldText(el, check.type);
        if (text.length > 200000) {
          skippedOversized++;
        } else {
          eligible.push({ el, type: check.type, text });
        }
      }
    }

    return { eligible, skippedOversized };
  }

  // Scan operation
  function scanPage() {
    clearFieldIndicators();
    const core = getCore();
    if (!core || typeof core.detect !== 'function') {
      return { success: false, error: 'PII detection core not loaded.' };
    }

    const { eligible, skippedOversized } = getEditableElements();
    let totalFindings = 0;
    const categoryCounts = {};
    const previews = [];

    for (const item of eligible) {
      const findings = core.detect(item.text);
      if (findings && findings.length > 0) {
        totalFindings += findings.length;
        attachFieldIndicator(item.el, findings.length);

        for (const f of findings) {
          categoryCounts[f.type] = (categoryCounts[f.type] || 0) + 1;
          if (previews.length < 50) {
            // Masked preview only - never raw original
            const masked = core.partial ? core.partial(f) : '[REDACTED]';
            previews.push({ type: f.type, masked });
          }
        }
      }
    }

    return {
      success: true,
      data: {
        fieldsScanned: eligible.length,
        framesScanned: 1,
        skippedOversized,
        totalFindings,
        categoryCounts,
        previews,
        undoAvailable: undoSnapshot !== null && undoSnapshot.length > 0
      }
    };
  }

  // Wipe operation
  function wipePage(mode = 'full') {
    const core = getCore();
    if (!core) return { success: false, error: 'Core not loaded.' };

    const { eligible } = getEditableElements();
    const snapshot = [];
    let wipedCount = 0;

    for (const item of eligible) {
      // Re-scan current content for idempotency
      const currentText = getFieldText(item.el, item.type);
      const findings = core.detect(currentText);

      if (findings && findings.length > 0) {
        // Record in-memory undo snapshot before modification
        snapshot.push({
          el: item.el,
          type: item.type,
          originalValue: currentText
        });

        let sanitizedText = '';
        if (mode === 'delete') {
          // Delete mode: removes detected PII spans entirely
          let out = '';
          let lastIdx = 0;
          for (const f of findings) {
            out += currentText.slice(lastIdx, f.start);
            lastIdx = f.end;
          }
          out += currentText.slice(lastIdx);
          sanitizedText = out;
        } else {
          // Full, Partial, or Pseudo mode
          const res = core.sanitize(currentText, findings, mode);
          sanitizedText = res.text;
        }

        setFieldValue(item.el, item.type, sanitizedText);
        wipedCount++;
      }
    }

    // Save snapshot in-memory only (overwrites previous wipe snapshot)
    undoSnapshot = snapshot;
    clearFieldIndicators();

    return {
      success: true,
      wipedCount,
      undoAvailable: undoSnapshot.length > 0
    };
  }

  // Undo operation
  function undoLastWipe() {
    if (!undoSnapshot || undoSnapshot.length === 0) {
      return { success: false, error: 'No undo snapshot available for this tab.' };
    }

    let restoredCount = 0;
    for (const record of undoSnapshot) {
      if (record.el && record.el.isConnected) {
        setFieldValue(record.el, record.type, record.originalValue);
        restoredCount++;
      }
    }

    // Clear snapshot after successful restoration to prevent stale re-application
    undoSnapshot = null;
    clearFieldIndicators();

    // Re-scan to restore indicators for the restored original values
    scanPage();

    return {
      success: true,
      restoredCount
    };
  }

  // Paste Event Interceptor for Guard Mode (Opt-in Stretch Feature)
  document.addEventListener('paste', e => {
    if (!guardModeEnabled) return;

    const check = isEligibleField(e.target);
    if (!check.eligible) return;

    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const text = clipboardData.getData('text/plain');
    if (!text || text.length > 200000) return;

    const core = getCore();
    if (!core) return;

    const findings = core.detect(text);
    if (!findings || findings.length === 0) return;

    // PII detected in pasted text: intercept before field receives text
    e.preventDefault();
    e.stopImmediatePropagation();
    showPasteGuardModal(e.target, check.type, text, findings, core);
  }, true);

  // Close modal on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && activePasteModalHost) {
      removePasteGuardModal();
    }
  });

  // Message Handler for Extension Actions
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.action) return false;

    if (message.action === 'SCAN') {
      const res = scanPage();
      sendResponse(res);
      return false;
    }

    if (message.action === 'WIPE') {
      const res = wipePage(message.mode || 'full');
      sendResponse(res);
      return false;
    }

    if (message.action === 'UNDO') {
      const res = undoLastWipe();
      sendResponse(res);
      return false;
    }

    if (message.action === 'SET_GUARD_MODE') {
      guardModeEnabled = !!message.enabled;
      if (message.mode) guardModeRedactionMode = message.mode;
      sendResponse({ success: true, enabled: guardModeEnabled });
      return false;
    }

    if (message.action === 'GET_GUARD_MODE') {
      sendResponse({ success: true, enabled: guardModeEnabled });
      return false;
    }

    return false;
  });
})();
