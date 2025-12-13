import { loadTutorialConfig } from './loader.js';
import { TutorialOverlay } from './overlay.js';
import { isSkipPreferred, markSeen, setSkipPreference, shouldAutoStart } from './storage.js';

function expandBox(rect) {
  const padding = 12;
  return {
    left: rect.left + window.scrollX - padding,
    top: rect.top + window.scrollY - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2
  };
}

function selectTargets(selectors = []) {
  const elements = [];
  selectors.forEach(sel => {
    if (!sel) return;
    const found = document.querySelector(sel);
    if (found) {
      elements.push(found);
    }
  });
  return elements;
}

function buildBox(selectors = []) {
  const elements = selectTargets(selectors);
  const visible = elements
    .map(el => el.getBoundingClientRect())
    .filter(rect => rect.width > 0 && rect.height > 0);

  if (!visible.length) {
    return null;
  }

  const first = visible[0];
  let left = first.left;
  let top = first.top;
  let right = first.right;
  let bottom = first.bottom;

  for (let i = 1; i < visible.length; i += 1) {
    const rect = visible[i];
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }

  return expandBox({ left, top, width: right - left, height: bottom - top });
}

export class TutorialController {
  constructor(configPath) {
    this.configPath = configPath;
    this.config = null;
    this.overlay = null;
    this.active = false;
    this.stepIndex = 0;
    this.pageIndex = 0;
    this.manual = false;
    this.boundKeyHandler = event => this.handleKey(event);
  }

  createOverlay() {
    this.overlay = new TutorialOverlay({
      onNext: () => this.next(),
      onPrev: () => this.prev(),
      onClose: () => this.close(),
      onSkipToggle: value => setSkipPreference(value)
    });

    this.overlay.setSkipChecked(isSkipPreferred());
    this.overlay.setBoxProvider(() => this.computeBox());
  }

  async init() {
    this.config = await loadTutorialConfig(this.configPath);
    if (!this.config || !Array.isArray(this.config.steps) || !this.config.steps.length) {
      return false;
    }

    this.createOverlay();

    if (shouldAutoStart()) {
      this.start(false);
    }

    return true;
  }

  start(manualStart = true) {
    if (!this.config) return;
    if (!this.overlay) {
      this.createOverlay();
    }
    this.manual = manualStart;
    this.active = true;
    this.stepIndex = 0;
    this.pageIndex = 0;
    markSeen();
    this.overlay?.setSkipChecked(isSkipPreferred());
    this.showCurrent();
    document.addEventListener('keydown', this.boundKeyHandler);
  }

  handleKey(event) {
    if (!this.active) return;
    if (event.key === 'ArrowRight' || event.key === 'PageDown') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  computeBox() {
    const step = this.config?.steps?.[this.stepIndex];
    if (!step) return null;
    return buildBox(step.targets) || null;
  }

  showCurrent() {
    if (!this.overlay || !this.config) return;
    const step = this.config.steps[this.stepIndex];
    const pages = Array.isArray(step.pages) && step.pages.length ? step.pages : [step.content || ''];
    const content = pages[this.pageIndex] || pages[pages.length - 1] || '';
    const box = this.computeBox();

    this.overlay.showStep({
      title: step.title,
      content,
      box: box || undefined,
      placement: step.placement,
      stepIndex: this.stepIndex,
      totalSteps: this.config.steps.length,
      pageIndex: this.pageIndex,
      pageCount: pages.length,
      hasPrev: this.stepIndex > 0 || this.pageIndex > 0,
      hasNext: this.stepIndex < this.config.steps.length - 1 || this.pageIndex < pages.length - 1
    });
  }

  next() {
    if (!this.config) return;
    const step = this.config.steps[this.stepIndex];
    const pages = Array.isArray(step.pages) && step.pages.length ? step.pages : [step.content || ''];
    if (this.pageIndex < pages.length - 1) {
      this.pageIndex += 1;
    } else if (this.stepIndex < this.config.steps.length - 1) {
      this.stepIndex += 1;
      this.pageIndex = 0;
    } else {
      this.close();
      return;
    }
    this.showCurrent();
  }

  prev() {
    if (!this.config) return;
    if (this.pageIndex > 0) {
      this.pageIndex -= 1;
    } else if (this.stepIndex > 0) {
      this.stepIndex -= 1;
      const prevStep = this.config.steps[this.stepIndex];
      const pages = Array.isArray(prevStep.pages) && prevStep.pages.length ? prevStep.pages : [prevStep.content || ''];
      this.pageIndex = Math.max(pages.length - 1, 0);
    } else {
      return;
    }
    this.showCurrent();
  }

  close() {
    this.active = false;
    this.overlay?.setActive(false);
    document.removeEventListener('keydown', this.boundKeyHandler);
    if (this.overlay) {
      this.overlay.destroy();
      this.overlay = null;
    }
  }
}
