console.log('[meta] script loaded');

(() => {
  'use strict';

  const vscode = acquireVsCodeApi();

  /**
   * HTML escape utility to prevent XSS in innerHTML
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Event delegation for Back/Cancel.
   * Matches the requested hardening pattern.
   */
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const el = t.closest('[data-action]');
    if (!el) return;

    const type = el.getAttribute('data-action');
    if (type !== 'back' && type !== 'cancel') return;

    e.preventDefault();
    e.stopPropagation();

    console.log('[meta] click ->', type);
    vscode.postMessage({ type });
  });

  /**
   * Validate global state structure
   */
  function validateState(raw) {
    if (!raw || typeof raw !== 'object') {
      return { filePath: '', metadata: {} };
    }
    return {
      filePath: typeof raw.filePath === 'string' ? raw.filePath : '',
      metadata: (raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata))
        ? raw.metadata
        : {}
    };
  }

  const state = validateState(globalThis.__AHK_META_EDITOR__);
  const originalFilePath = state.filePath;
  const metadata = state.metadata;

  const arrayFields = ['link', 'see', 'requires', 'imports', 'exports', 'todo', 'contributors'];

  function normalizeArrayField(fieldName) {
    const value = metadata[fieldName];
    if (Array.isArray(value)) return;

    if (typeof value === 'string') {
      metadata[fieldName] = value
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
      return;
    }

    metadata[fieldName] = [];
  }

  arrayFields.forEach(normalizeArrayField);

  function byId(id) {
    return document.getElementById(id);
  }

  function getValue(id) {
    const el = byId(id);
    if (!el) return '';
    return 'value' in el ? String(el.value) : '';
  }

  function renderArrayField(fieldName, containerId) {
    const container = byId(containerId);
    if (!container) {
      console.warn('[meta] missing container', containerId);
      return;
    }

    const items = Array.isArray(metadata[fieldName]) ? metadata[fieldName] : [];

    container.innerHTML = items
      .map((item) => {
        const safeItem = escapeHtml(item);
        return `<div class="tag">${safeItem}<button class="remove-btn" type="button" data-field="${escapeHtml(fieldName)}" data-item="${safeItem}">×</button></div>`;
      })
      .join('');

    // Keep this separate from Back/Cancel so those never regress.
    container.querySelectorAll('button.remove-btn').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const field = btn.getAttribute('data-field');
        const item = btn.getAttribute('data-item');
        if (!field || !item) return;

        removeArrayItem(field, containerId, item);
      });
    });
  }

  function addArrayItem(fieldName, inputId, containerId) {
    const input = byId(inputId);
    if (!input || !('value' in input)) return;

    const value = String(input.value).trim();
    if (!value) return;

    const target = Array.isArray(metadata[fieldName]) ? metadata[fieldName] : [];
    metadata[fieldName] = target;

    if (!target.includes(value)) {
      target.push(value);
      renderArrayField(fieldName, containerId);
      input.value = '';
    }
  }

  function removeArrayItem(fieldName, containerId, value) {
    const target = Array.isArray(metadata[fieldName]) ? metadata[fieldName] : [];
    metadata[fieldName] = target.filter((item) => item !== value);
    renderArrayField(fieldName, containerId);
  }

  function saveMetadata() {
    console.log('[meta] saveMetadata called');

    const formData = {
      file: getValue('file'),
      title: getValue('title'),
      fileoverview: getValue('fileoverview'),
      abstract: getValue('abstract'),
      description: getValue('description'),
      module: getValue('module'),
      author: getValue('author'),
      license: getValue('license'),
      version: getValue('version'),
      since: getValue('since'),
      date: getValue('date'),
      homepage: getValue('homepage'),
      repository: getValue('repository'),
      bugs: getValue('bugs'),
      keywords: getValue('keywords'),
      category: getValue('category'),
      'ahk-version': getValue('ahk-version'),
      entrypoint: getValue('entrypoint'),
      env: getValue('env'),
      permissions: getValue('permissions'),
      config: getValue('config'),
      arguments: getValue('arguments'),
      returns: getValue('returns'),
      sideEffects: getValue('sideEffects'),
      examples: getValue('examples'),
      changelog: getValue('changelog'),
      funding: getValue('funding'),
      maintainer: getValue('maintainer'),
      link: metadata.link,
      see: metadata.see,
      requires: metadata.requires,
      imports: metadata.imports,
      exports: metadata.exports,
      todo: metadata.todo,
      contributors: metadata.contributors
    };

    console.log('[meta] postMessage -> save');

    try {
      vscode.postMessage({ type: 'save', metadata: formData });
    } catch (error) {
      console.error('[meta] Error sending save message:', error);
      alert('Failed to save: ' + (error && error.message ? error.message : String(error)));
    }
  }

  // Listen for active file change messages from extension
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message !== 'object') return;

    if (message.type === 'activeFileChanged') {
      const currentFilePath = message.filePath;
      const pageTitle = byId('pageTitle');
      const warning = byId('fileMismatchWarning');

      if (!pageTitle || !warning) return;

      if (currentFilePath !== originalFilePath) {
        pageTitle.classList.add('file-mismatch');
        warning.classList.add('visible');
      } else {
        pageTitle.classList.remove('file-mismatch');
        warning.classList.remove('visible');
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    console.log('[meta] dom ready');
    console.log(
      '[meta] has back/cancel',
      !!document.querySelector('[data-action="back"]'),
      !!document.querySelector('[data-action="cancel"]')
    );

    const saveButton = byId('saveButton');
    if (saveButton) {
      saveButton.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        saveMetadata();
      });
    }

    renderArrayField('link', 'linksList');
    renderArrayField('see', 'seeList');
    renderArrayField('requires', 'requiresList');
    renderArrayField('imports', 'importsList');
    renderArrayField('exports', 'exportsList');
    renderArrayField('todo', 'todoList');
    renderArrayField('contributors', 'contributorsList');

    const addButtons = {
      addContributorBtn: () => addArrayItem('contributors', 'contributorInput', 'contributorsList'),
      addLinkBtn: () => addArrayItem('link', 'linkInput', 'linksList'),
      addSeeBtn: () => addArrayItem('see', 'seeInput', 'seeList'),
      addRequiresBtn: () => addArrayItem('requires', 'requiresInput', 'requiresList'),
      addImportsBtn: () => addArrayItem('imports', 'importsInput', 'importsList'),
      addExportsBtn: () => addArrayItem('exports', 'exportsInput', 'exportsList'),
      addTodoBtn: () => addArrayItem('todo', 'todoInput', 'todoList')
    };

    Object.entries(addButtons).forEach(([btnId, handler]) => {
      const btn = byId(btnId);
      if (!btn) return;

      btn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        handler();
      });
    });
  });
})();
