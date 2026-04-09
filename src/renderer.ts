declare global {
  interface Window {
    desktop: {
      appName: string;
      platform: NodeJS.Platform;
      versions: {
        electron: string;
        node: string;
        chrome: string;
      };
    };
  }
}

function setText(selector: string, value: string): void {
  const element = document.querySelector<HTMLElement>(selector);

  if (element) {
    element.innerText = value;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setText('#app-name', window.desktop.appName);
  setText('#platform', window.desktop.platform);
  setText('#electron-version', window.desktop.versions.electron);
  setText('#node-version', window.desktop.versions.node);
});

export {};
