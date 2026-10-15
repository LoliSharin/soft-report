import { ipcRenderer } from 'electron';

import { appConfig } from '../../shared/app.config';
import type { DesktopApi } from '../../shared/desktop.types';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

export function createDesktopApi(): DesktopApi {
  return {
    appName: appConfig.displayName,
    platform: process.platform,
    versions: {
      electron: process.versions.electron,
      node: process.versions.node,
      chrome: process.versions.chrome,
    },
    auth: {
      login: (input) => ipcRenderer.invoke(IPC_CHANNELS.auth.login, input),
      logout: () => ipcRenderer.invoke(IPC_CHANNELS.auth.logout),
      getSession: () => ipcRenderer.invoke(IPC_CHANNELS.auth.getSession),
    },
    users: {
      list: () => ipcRenderer.invoke(IPC_CHANNELS.users.list),
      create: (input) => ipcRenderer.invoke(IPC_CHANNELS.users.create, input),
      update: (id, input) =>
        ipcRenderer.invoke(IPC_CHANNELS.users.update, id, input),
      delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.users.delete, id),
    },
    dictionaries: {
      list: (type) => ipcRenderer.invoke(IPC_CHANNELS.dictionaries.list, type),
      create: (input) =>
        ipcRenderer.invoke(IPC_CHANNELS.dictionaries.create, input),
      update: (id, input) =>
        ipcRenderer.invoke(IPC_CHANNELS.dictionaries.update, id, input),
      delete: (id) =>
        ipcRenderer.invoke(IPC_CHANNELS.dictionaries.delete, id),
    },
    events: {
      list: () => ipcRenderer.invoke(IPC_CHANNELS.events.list),
      create: (input) => ipcRenderer.invoke(IPC_CHANNELS.events.create, input),
      update: (id, input) =>
        ipcRenderer.invoke(IPC_CHANNELS.events.update, id, input),
      delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.events.delete, id),
    },
    participants: {
      list: () => ipcRenderer.invoke(IPC_CHANNELS.participants.list),
      create: (input) =>
        ipcRenderer.invoke(IPC_CHANNELS.participants.create, input),
      update: (id, input) =>
        ipcRenderer.invoke(IPC_CHANNELS.participants.update, id, input),
      delete: (id) =>
        ipcRenderer.invoke(IPC_CHANNELS.participants.delete, id),
    },
    participations: {
      list: () => ipcRenderer.invoke(IPC_CHANNELS.participations.list),
      create: (input) =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.create, input),
      update: (id, input) =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.update, id, input),
      delete: (id) =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.delete, id),
      selectCertificateImage: () =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.selectCertificateImage),
      getCertificatePreview: (id) =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.getCertificatePreview, id),
      downloadCertificateImage: (id) =>
        ipcRenderer.invoke(
          IPC_CHANNELS.participations.downloadCertificateImage,
          id,
        ),
      openCertificateImage: (id) =>
        ipcRenderer.invoke(IPC_CHANNELS.participations.openCertificateImage, id),
    },
    reports: {
      generate: (input) =>
        ipcRenderer.invoke(IPC_CHANNELS.reports.generate, input),
    },
    system: {
      backupDatabase: () =>
        ipcRenderer.invoke(IPC_CHANNELS.system.backupDatabase),
      exportData: () => ipcRenderer.invoke(IPC_CHANNELS.system.exportData),
      importData: () => ipcRenderer.invoke(IPC_CHANNELS.system.importData),
    },
  };
}
