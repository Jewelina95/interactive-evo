(() => {
  const fileMode = window.location.protocol === 'file:';
  const offlineReady = fileMode ? new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './data/offline-data.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('The offline data bundle could not be loaded.'));
    document.head.appendChild(script);
  }) : Promise.resolve();

  async function fetchJSON(path, label) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${label} could not be loaded.`);
    return response.json();
  }

  async function offlineValue(key) {
    await offlineReady;
    const value = window.__INTERACTEVAL_OFFLINE__?.[key];
    if (value == null) throw new Error(`Offline ${key} data is unavailable.`);
    return value;
  }

  window.InteractEvalData = {
    fileMode,
    async cases() {
      return fileMode
        ? offlineValue('cases')
        : fetchJSON('./data/cases.json?v=mario-v3-3722b5f9', 'Case data');
    },
    async models() {
      return fileMode
        ? offlineValue('models')
        : fetchJSON('./data/models.json?v=mario-v3-3722b5f9', 'Model data');
    },
    async caseRecord(id) {
      if (!fileMode) {
        return fetchJSON(`./data/cases/${encodeURIComponent(id)}.json?v=mario-v3-3722b5f9`, 'Case record');
      }
      await offlineReady;
      const record = window.__INTERACTEVAL_OFFLINE__?.records?.[id];
      if (record) return record;
      throw new Error('This detailed case is available in the hosted casebook; the local file preview includes the six homepage cases.');
    },
  };
})();
