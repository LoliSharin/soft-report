export const appConfig = {
  appId: 'com.softreport.desktop',
  name: 'Soft Report',
  displayName:
    '\u0423\u0447\u0435\u0442 \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u0439',
  database: {
    fileName: 'soft-report.db',
    backupPrefix:
      '\u0440\u0435\u0437\u0435\u0440\u0432\u043d\u0430\u044f-\u043a\u043e\u043f\u0438\u044f-\u0431\u0434',
  },
  storage: {
    participationCertificatesDir: 'participation-certificates',
  },
  window: {
    width: 1380,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
  },
};
