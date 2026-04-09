import type { DesktopApi } from '../../shared/desktop.types';

declare global {
  interface Window {
    desktop: DesktopApi;
  }
}

export function getDesktopApi(): DesktopApi {
  return window.desktop;
}
