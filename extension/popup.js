// Blackout Guard — Popup Script (Manifest V3)
// Strictly client-side, zero network calls, zero persistence of sensitive text.

document.addEventListener('DOMContentLoaded', () => {
  const scanBtn = document.getElementById('scanBtn');
  const wipeBtn = document.getElementById('wipeBtn');
  const undoBtn = document.getElementById('undoBtn');
  const fieldsCountEl = document.getElementById('fieldsCount');
  const framesCountEl = document.getElementById('framesCount');
  const skippedCountEl = document.getElementById('skippedCount');
  const findingsSection = document.getElementById('findingsSection');
  const totalFindingsBadge = document.getElementById('totalFindingsBadge');
  const categoryBadges = document.getElementById('categoryBadges');
  const findingsList = document.getElementById('findingsList');
  const statusMsg = document.getElementById('statusMsg');
  const restrictedNotice = document.getElementById('restrictedNotice');
  const mainContent = document.getElementById('mainContent');
  const modeDesc = document.getElementById('modeDesc');
  const guardToggle = document.getElementById('guardToggle');

  let activeMode = 'full';
  let isScanning = false;
  let isWiping = false;

  const modeDescriptions = {
    full: 'Replace all findings with [REDACTED].',
    partial: 'Preserve partial context (e.g. card/Aadhaar last 4, email domain).',
    pseudo: 'Replace with sequential pseudonyms (e.g. EMAIL_01, CARD_01).',
    delete: 'Delete detected PII text entirely.'
  };

  // Mode Selection Handlers
  const modeOptions = document.querySelectorAll('.mode-opt');
  modeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      modeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) {
        radio.checked = true;
        activeMode = radio.value;
        modeDesc.textContent = modeDescriptions[activeMode] || '';
        // If Guard mode is active, sync active mode
        if (guardToggle && guardToggle.checked) {
          getActiveTab().then(tab => {
            if (tab && tab.id) {
              chrome.tabs.sendMessage(tab.id, {
                action: 'SET_GUARD_MODE',
                enabled: true,
                mode: activeMode
              }, () => {
                if (chrome.runtime.lastError) {
                  // Handled: tab may not be ready or active
                }
              });
            }
          });
        }
      }
    });
  });

  function setStatus(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.style.color = isError ? 'var(--status-err)' : 'var(--text-main)';
  }

  function isRestrictedUrl(url) {
    if (!url) return true;
    const restrictedSchemes = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'data:', 'view-source:'];
    const lower = url.toLowerCase();
    for (const s of restrictedSchemes) {
      if (lower.startsWith(s)) return true;
    }
    if (lower.includes('chrome.google.com/webstore') ||
        lower.includes('chromewebstore.google.com') ||
        lower.includes('microsoftedge.microsoft.com/addons')) {
      return true;
    }
    return false;
  }

  async function getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (err) {
      return null;
    }
  }

  async function ensureInjected(tabId) {
    try {
      // 1. Inject into top frame first (guaranteed to succeed on accessible pages)
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['pii-core.js', 'content.js']
      });

      // 2. Best-effort injection into accessible subframes (safe to fail for cross-origin/srcdoc frames)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          files: ['pii-core.js', 'content.js']
        });
      } catch (subframeErr) {
        // Cross-origin or srcdoc subframe restrictions must not fail top-level page operations
      }
      return true;
    } catch (err) {
      console.warn('Blackout Guard injection error:', err);
      return false;
    }
  }

  function renderCategoryBadges(counts) {
    categoryBadges.innerHTML = '';
    const knownTypes = ['EMAIL', 'CARD', 'AADHAAR', 'PAN', 'IP', 'PHONE'];
    for (const t of knownTypes) {
      const count = counts[t] || 0;
      if (count > 0) {
        const span = document.createElement('span');
        span.className = `cat-badge badge-${t}`;
        span.textContent = `${t}: ${count}`;
        categoryBadges.appendChild(span);
      }
    }
  }

  function renderFindingsList(previews) {
    findingsList.innerHTML = '';
    if (!previews || previews.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No findings to preview.';
      findingsList.appendChild(li);
      return;
    }
    for (const item of previews) {
      const li = document.createElement('li');
      const typeSpan = document.createElement('span');
      typeSpan.textContent = item.type;
      typeSpan.style.color = `var(--${item.type})`;
      typeSpan.style.fontWeight = '600';

      const maskSpan = document.createElement('span');
      // Masked preview only - never raw original
      maskSpan.textContent = item.masked;

      li.appendChild(typeSpan);
      li.appendChild(maskSpan);
      findingsList.appendChild(li);
    }
  }

  // Scan Action
  scanBtn.addEventListener('click', async () => {
    if (isScanning) return;
    const tab = await getActiveTab();
    if (!tab || !tab.id) {
      setStatus('Could not identify active tab.', true);
      return;
    }

    if (isRestrictedUrl(tab.url)) {
      restrictedNotice.style.display = 'block';
      scanBtn.disabled = true;
      if (tab.url && tab.url.startsWith('file://')) {
        setStatus('File URL detected: enable "Allow access to file URLs" in chrome://extensions -> Details, or use http://localhost:8080.', true);
      } else {
        setStatus('Scan restricted on this page.', true);
      }
      return;
    }

    isScanning = true;
    scanBtn.disabled = true;
    setStatus('Scanning editable fields locally...');

    const injected = await ensureInjected(tab.id);
    if (!injected) {
      isScanning = false;
      scanBtn.disabled = false;
      if (tab.url && tab.url.startsWith('file://')) {
        setStatus('Cannot access file URL. In chrome://extensions -> Details, enable "Allow access to file URLs".', true);
      } else {
        setStatus('Cannot execute script on this page. Check page permissions.', true);
      }
      return;
    }

    try {
      chrome.tabs.sendMessage(tab.id, { action: 'SCAN' }, response => {
        isScanning = false;
        scanBtn.disabled = false;

        if (chrome.runtime.lastError) {
          setStatus('Scan failed: ' + (chrome.runtime.lastError.message || 'tab not responding.'), true);
          return;
        }

        if (!response) {
          setStatus('Scan failed or tab not responding.', true);
          return;
        }

        if (!response.success) {
          setStatus(response.error || 'Scan failed.', true);
          return;
        }

        const data = response.data || {};
        fieldsCountEl.textContent = String(data.fieldsScanned || 0);
        framesCountEl.textContent = String(data.framesScanned || 1);
        skippedCountEl.textContent = String(data.skippedOversized || 0);

        const totalFindings = data.totalFindings || 0;
        if (totalFindings > 0) {
          findingsSection.style.display = 'flex';
          totalFindingsBadge.textContent = `${totalFindings} finding${totalFindings === 1 ? '' : 's'}`;
          renderCategoryBadges(data.categoryCounts || {});
          renderFindingsList(data.previews || []);
          wipeBtn.disabled = false;
          setStatus(`Scan complete: ${totalFindings} sensitive item${totalFindings === 1 ? '' : 's'} detected.`);
        } else {
          findingsSection.style.display = 'none';
          wipeBtn.disabled = true;
          setStatus('Scan complete: Zero PII detected in editable fields.');
        }

        if (data.undoAvailable) {
          undoBtn.disabled = false;
        }
      });
    } catch (err) {
      isScanning = false;
      scanBtn.disabled = false;
      setStatus('Error communicating with page.', true);
    }
  });

  // Wipe Action
  wipeBtn.addEventListener('click', async () => {
    if (isWiping) return;
    const tab = await getActiveTab();
    if (!tab || !tab.id) return;

    isWiping = true;
    wipeBtn.disabled = true;
    setStatus('Wiping detected PII locally...');

    try {
      chrome.tabs.sendMessage(tab.id, { action: 'WIPE', mode: activeMode }, response => {
        isWiping = false;
        if (chrome.runtime.lastError) {
          wipeBtn.disabled = false;
          setStatus('Wipe failed: ' + (chrome.runtime.lastError.message || 'tab not responding.'), true);
          return;
        }

        if (!response || !response.success) {
          wipeBtn.disabled = false;
          setStatus('Wipe operation failed.', true);
          return;
        }

        const count = response.wipedCount || 0;
        undoBtn.disabled = false;
        wipeBtn.disabled = true;
        findingsSection.style.display = 'none';
        setStatus(`Successfully wiped ${count} field${count === 1 ? '' : 's'} using ${activeMode.toUpperCase()} mode.`);
      });
    } catch (err) {
      isWiping = false;
      wipeBtn.disabled = false;
      setStatus('Error executing wipe.', true);
    }
  });

  // Undo Action
  undoBtn.addEventListener('click', async () => {
    const tab = await getActiveTab();
    if (!tab || !tab.id) return;

    undoBtn.disabled = true;
    setStatus('Restoring fields from in-memory snapshot...');

    try {
      chrome.tabs.sendMessage(tab.id, { action: 'UNDO' }, response => {
        if (chrome.runtime.lastError) {
          undoBtn.disabled = false;
          setStatus('Undo failed: ' + (chrome.runtime.lastError.message || 'snapshot unavailable.'), true);
          return;
        }

        if (!response || !response.success) {
          undoBtn.disabled = false;
          setStatus('Undo failed or snapshot unavailable.', true);
          return;
        }

        const restoredCount = response.restoredCount || 0;
        undoBtn.disabled = true;
        wipeBtn.disabled = true;
        setStatus(`Restored ${restoredCount} field${restoredCount === 1 ? '' : 's'} to previous values.`);
      });
    } catch (err) {
      undoBtn.disabled = false;
      setStatus('Error executing undo.', true);
    }
  });

  // Guard Mode Toggle Action (Stretch Feature)
  if (guardToggle) {
    guardToggle.addEventListener('change', async () => {
      const tab = await getActiveTab();
      if (!tab || !tab.id) return;
      const injected = await ensureInjected(tab.id);
      if (!injected) {
        guardToggle.checked = false;
        setStatus('Cannot enable Guard Mode on this page.', true);
        return;
      }
      chrome.tabs.sendMessage(tab.id, {
        action: 'SET_GUARD_MODE',
        enabled: guardToggle.checked,
        mode: activeMode
      }, res => {
        if (chrome.runtime.lastError) {
          guardToggle.checked = false;
          setStatus('Failed to connect to page for Guard Mode.', true);
          return;
        }
        if (res && res.success) {
          setStatus(`Guard Mode ${guardToggle.checked ? 'activated' : 'deactivated'}.`);
        }
      });
    });
  }

  // Check tab URL, ensure content script readiness, and query Guard status on popup load
  (async () => {
    try {
      const tab = await getActiveTab();
      if (!tab || !tab.id) return;

      if (isRestrictedUrl(tab.url)) {
        restrictedNotice.style.display = 'block';
        scanBtn.disabled = true;
        if (guardToggle) guardToggle.disabled = true;
        if (tab.url && tab.url.startsWith('file://')) {
          setStatus('File URL detected: enable "Allow access to file URLs" in chrome://extensions -> Details, or use http://localhost:8080.', true);
        } else {
          setStatus('Extension restricted on browser internal pages.');
        }
        return;
      }

      // Pre-inject into active tab so listeners and Guard Mode are ready
      const injected = await ensureInjected(tab.id);
      if (injected) {
        chrome.tabs.sendMessage(tab.id, { action: 'GET_GUARD_MODE' }, res => {
          // Explicitly check runtime.lastError so Chrome never logs "Unchecked runtime.lastError"
          if (chrome.runtime.lastError) {
            return;
          }
          if (res && res.success && guardToggle) {
            guardToggle.checked = !!res.enabled;
          }
        });
      }
    } catch (e) {
      // Gracefully handle any startup exceptions
    }
  })();
});
