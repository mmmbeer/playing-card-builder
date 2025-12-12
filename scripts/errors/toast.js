const TOAST_ID = "bugToast";

function createToastElement() {
  let toast = document.getElementById(TOAST_ID);
  if (toast) return toast;
  toast = document.createElement("div");
  toast.id = TOAST_ID;
  toast.className = "bug-toast hidden";

  const text = document.createElement("span");
  text.className = "bug-toast__text";
  text.textContent = "We detected an error. Report it?";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "bug-toast__button";
  button.textContent = "Open";

  toast.appendChild(text);
  toast.appendChild(button);
  document.body.appendChild(toast);
  return toast;
}

export function showBugToast(onClick) {
  const toast = createToastElement();
  if (!toast) return;
  const button = toast.querySelector(".bug-toast__button");
  if (button) {
    button.onclick = () => {
      hideBugToast();
      onClick?.();
    };
  }
  toast.classList.remove("hidden");
}

export function hideBugToast() {
  const toast = document.getElementById(TOAST_ID);
  if (!toast) return;
  toast.classList.add("hidden");
}
