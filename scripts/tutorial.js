import { TutorialController } from './tutorial/controller.js';

let controller;
let queuedStart = false;
let queuedManual = true;

function startTutorial(manual = true) {
  if (!controller) return;
  if (!controller.config) {
    queuedStart = true;
    queuedManual = manual;
    return;
  }
  queuedStart = false;
  controller.start(manual);
}

function handleStartEvent(event) {
  const manual = event?.detail?.manual !== false;
  startTutorial(manual);
}

export function initTutorial() {
  controller = new TutorialController('docs/guided-tour.json');
  controller.init().then(() => {
    if (queuedStart) {
      startTutorial(queuedManual);
    }
  });

  window.addEventListener('tutorial:start', handleStartEvent);
  window.startGuidedTour = () => startTutorial(true);
}
