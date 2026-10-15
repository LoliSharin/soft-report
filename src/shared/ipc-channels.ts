export const IPC_CHANNELS = {
  auth: {
    login: 'auth:login',
    logout: 'auth:logout',
    getSession: 'auth:get-session',
  },
  users: {
    list: 'users:list',
    create: 'users:create',
    update: 'users:update',
    delete: 'users:delete',
  },
  dictionaries: {
    list: 'dictionaries:list',
    create: 'dictionaries:create',
    update: 'dictionaries:update',
    delete: 'dictionaries:delete',
  },
  events: {
    list: 'events:list',
    create: 'events:create',
    update: 'events:update',
    delete: 'events:delete',
  },
  participants: {
    list: 'participants:list',
    create: 'participants:create',
    update: 'participants:update',
    delete: 'participants:delete',
  },
  participations: {
    list: 'participations:list',
    create: 'participations:create',
    update: 'participations:update',
    delete: 'participations:delete',
    selectCertificateImage: 'participations:select-certificate-image',
    getCertificatePreview: 'participations:get-certificate-preview',
    downloadCertificateImage: 'participations:download-certificate-image',
    openCertificateImage: 'participations:open-certificate-image',
  },
  reports: {
    generate: 'reports:generate',
  },
  system: {
    backupDatabase: 'system:backup-database',
    exportData: 'system:export-data',
    importData: 'system:import-data',
  },
} as const;
