/**
 * Theme Modifier SDK
 * Handles fetching content from the app server and injecting it into the storefront
 */
(function() {
  'use strict';

  class ThemeModifierSDK {
    constructor() {
      this.appUrl = window.__THEME_MODIFIER_APP_URL__ || '';
      this.initialized = false;

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.init());
      } else {
        this.init();
      }
    }

    init() {
      if (this.initialized) return;
      this.initialized = true;

      console.log('[ThemeModifierSDK] Initializing...');
      console.log('[ThemeModifierSDK] App URL:', this.appUrl);

      // Find all SDK content containers and load their content
      const containers = document.querySelectorAll('[data-sdk-content]');
      console.log('[ThemeModifierSDK] Found', containers.length, 'content containers');

      containers.forEach(container => this.loadContent(container));
    }

    /**
     * Fetch HTML content from an endpoint
     */
    async fetchHTML(endpoint) {
      const url = this.appUrl + endpoint;
      console.log('[ThemeModifierSDK] Fetching HTML from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.text();
    }

    /**
     * Fetch JSON data from an endpoint
     */
    async fetchJSON(endpoint) {
      const url = this.appUrl + endpoint;
      console.log('[ThemeModifierSDK] Fetching JSON from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }

    /**
     * Load content into a container element
     */
    async loadContent(element) {
      const endpoint = element.dataset.sdkEndpoint || '/api/content';
      const contentType = element.dataset.sdkType || 'html';
      const blockId = element.dataset.blockId || 'unknown';

      console.log('[ThemeModifierSDK] Loading content for block:', blockId);
      console.log('[ThemeModifierSDK] Endpoint:', endpoint, 'Type:', contentType);

      // Show loading state
      element.classList.add('sdk-loading');

      try {
        if (contentType === 'html') {
          const html = await this.fetchHTML(endpoint);
          element.innerHTML = html;
          console.log('[ThemeModifierSDK] HTML content loaded successfully');
        } else if (contentType === 'json') {
          const data = await this.fetchJSON(endpoint);
          // Render JSON data in a formatted way
          element.innerHTML = this.renderJSON(data);
          console.log('[ThemeModifierSDK] JSON content loaded successfully');
        }

        element.classList.remove('sdk-loading');
        element.classList.add('sdk-loaded');

        // Dispatch custom event for any listeners
        element.dispatchEvent(new CustomEvent('sdk:content-loaded', {
          detail: { endpoint, contentType, blockId }
        }));

      } catch (error) {
        console.error('[ThemeModifierSDK] Error loading content:', error);
        element.innerHTML = `<div class="sdk-error">Failed to load content: ${error.message}</div>`;
        element.classList.remove('sdk-loading');
        element.classList.add('sdk-error');
      }
    }

    /**
     * Render JSON data as formatted HTML
     */
    renderJSON(data) {
      return `<div class="sdk-json-content">
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>`;
    }

    /**
     * Manually refresh content for a specific container
     */
    refresh(selector) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;

      if (element && element.dataset.sdkContent !== undefined) {
        this.loadContent(element);
      }
    }

    /**
     * Refresh all SDK content containers
     */
    refreshAll() {
      const containers = document.querySelectorAll('[data-sdk-content]');
      containers.forEach(container => this.loadContent(container));
    }
  }

  // Create global instance
  window.ThemeModifierSDK = new ThemeModifierSDK();

  console.log('[ThemeModifierSDK] SDK loaded and available globally');
})();
