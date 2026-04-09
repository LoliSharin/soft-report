export interface DesktopVersions {
  electron: string;
  node: string;
  chrome: string;
}

export interface DesktopApi {
  appName: string;
  platform: NodeJS.Platform;
  versions: DesktopVersions;
}
