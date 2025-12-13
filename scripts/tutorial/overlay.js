import { renderTutorialMarkdown } from './markdown.js';

const DEFAULT_BOX = { left: window.innerWidth / 2 - 160, top: window.innerHeight / 2 - 120, width: 320, height: 240 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export class TutorialOverlay {
  constructor({ onNext, onPrev, onClose, onSkipToggle }) {
    this.onNext = onNext;
    this.onPrev = onPrev;
    this.onClose = onClose;
    this.onSkipToggle = onSkipToggle;
    this.currentBox = DEFAULT_BOX;
    this.placement = 'bottom';
    this.container = null;
    this.highlight = null;
    this.callout = null;
    this.contentEl = null;
    this.progressEl = null;
    this.titleEl = null;
    this.skipCheckbox = null;
    this.nextButton = null;
    this.prevButton = null;
    this.closeButton = null;
    this.active = false;
    this.boxProvider = null;
    this.boundReposition = () => {
      if (typeof this.boxProvider === 'function') {
        const nextBox = this.boxProvider();
        if (nextBox) {
          this.currentBox = nextBox;
        }
      }
      this.drawHighlight();
      this.positionCallout();
    };
  }

  mount() {
    if (this.container) return;
    const container = document.createElement('div');
    container.className = 'tutorial-overlay';

    const highlight = document.createElement('div');
    highlight.className = 'tutorial-highlight';
    container.appendChild(highlight);

    const callout = document.createElement('div');
    callout.className = 'tutorial-callout';
    callout.setAttribute('role', 'dialog');
    callout.setAttribute('aria-live', 'polite');

    const header = document.createElement('div');
    header.className = 'tutorial-callout__header';
    const title = document.createElement('div');
    title.className = 'tutorial-title';
    header.appendChild(title);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'tutorial-close';
    closeBtn.textContent = 'Close';
    header.appendChild(closeBtn);
    callout.appendChild(header);

    const progress = document.createElement('div');
    progress.className = 'tutorial-progress';
    callout.appendChild(progress);

    const body = document.createElement('div');
    body.className = 'tutorial-body';
    callout.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'tutorial-footer';

    const actionRow = document.createElement('div');
    actionRow.className = 'tutorial-actions';
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = 'Previous';
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'primary';
    nextBtn.textContent = 'Next';
    actionRow.appendChild(prevBtn);
    actionRow.appendChild(nextBtn);
    footer.appendChild(actionRow);

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'tutorial-skip';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkboxLabel.appendChild(checkbox);
    const text = document.createElement('span');
    text.textContent = "Don't show this next time";
    checkboxLabel.appendChild(text);
    footer.appendChild(checkboxLabel);

    callout.appendChild(footer);

    container.appendChild(callout);
    document.body.appendChild(container);

    this.container = container;
    this.highlight = highlight;
    this.callout = callout;
    this.contentEl = body;
    this.progressEl = progress;
    this.titleEl = title;
    this.skipCheckbox = checkbox;
    this.nextButton = nextBtn;
    this.prevButton = prevBtn;
    this.closeButton = closeBtn;

    this.attachEvents();
  }

  attachEvents() {
    this.nextButton?.addEventListener('click', () => this.onNext?.());
    this.prevButton?.addEventListener('click', () => this.onPrev?.());
    this.closeButton?.addEventListener('click', () => this.onClose?.());
    this.skipCheckbox?.addEventListener('change', () => this.onSkipToggle?.(this.skipCheckbox.checked));
    window.addEventListener('resize', this.boundReposition);
    window.addEventListener('scroll', this.boundReposition, true);
  }

  detachEvents() {
    window.removeEventListener('resize', this.boundReposition);
    window.removeEventListener('scroll', this.boundReposition, true);
  }

  setActive(active) {
    this.active = active;
    if (this.container) {
      this.container.classList.toggle('visible', !!active);
    }
  }

  setSkipChecked(value) {
    if (this.skipCheckbox) {
      this.skipCheckbox.checked = !!value;
    }
  }

  setControls({ hasPrev, hasNext }) {
    if (this.prevButton) {
      this.prevButton.disabled = !hasPrev;
    }
    if (this.nextButton) {
      this.nextButton.textContent = hasNext ? 'Next' : 'Done';
    }
  }

  setBoxProvider(provider) {
    this.boxProvider = provider;
  }

  showStep(step) {
    this.mount();
    this.setActive(true);
    this.currentBox = step.box || DEFAULT_BOX;
    this.placement = step.placement || 'bottom';
    if (this.titleEl) {
      this.titleEl.textContent = step.title || 'Guided tour';
    }
    if (this.progressEl) {
      this.progressEl.textContent = `Step ${step.stepIndex + 1} of ${step.totalSteps} · Page ${step.pageIndex + 1}/${step.pageCount}`;
    }
    if (this.contentEl) {
      this.contentEl.innerHTML = renderTutorialMarkdown(step.content || '');
    }
    this.setControls({ hasPrev: step.hasPrev, hasNext: step.hasNext });
    this.drawHighlight();
    this.positionCallout();
  }

  drawHighlight() {
    if (!this.highlight) return;
    const box = this.currentBox || DEFAULT_BOX;
    this.highlight.style.left = `${box.left}px`;
    this.highlight.style.top = `${box.top}px`;
    this.highlight.style.width = `${box.width}px`;
    this.highlight.style.height = `${box.height}px`;
  }

  positionCallout() {
    if (!this.callout) return;
    const rect = this.callout.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const box = this.currentBox || DEFAULT_BOX;
    const margin = 16;
    let left;
    let top;
    let placement = this.placement;

    if (placement === 'right') {
      left = box.left + box.width + margin;
      top = box.top + box.height / 2 - rect.height / 2;
    } else if (placement === 'left') {
      left = box.left - rect.width - margin;
      top = box.top + box.height / 2 - rect.height / 2;
    } else if (placement === 'top') {
      left = box.left + box.width / 2 - rect.width / 2;
      top = box.top - rect.height - margin;
    } else {
      left = box.left + box.width / 2 - rect.width / 2;
      top = box.top + box.height + margin;
      placement = 'bottom';
    }

    left = clamp(left, margin, window.scrollX + viewportWidth - rect.width - margin);
    top = clamp(top, margin, window.scrollY + viewportHeight - rect.height - margin);

    this.callout.style.left = `${left}px`;
    this.callout.style.top = `${top}px`;
    this.callout.dataset.placement = placement;
  }

  destroy() {
    this.detachEvents();
    if (this.container) {
      this.container.remove();
    }
    this.container = null;
    this.highlight = null;
    this.callout = null;
    this.contentEl = null;
    this.progressEl = null;
    this.titleEl = null;
    this.skipCheckbox = null;
    this.nextButton = null;
    this.prevButton = null;
    this.closeButton = null;
    this.active = false;
  }
}
