export const STORAGE_KEY = 'pos-platform-admin-state-v1';

export function loadState(initialState) {
  try {
    return { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return structuredClone(initialState);
  }
}

export function saveState(state) {
  const safeState = {
    ...state,
    securityDraft: {
      question: state.securityDraft?.question || '',
      answer: '',
      currentPassword: '',
    },
    passwordDraft: {
      current: '',
      next: '',
      confirm: '',
    },
    resetDraft: {
      username: state.resetDraft?.username || '',
      question: state.resetDraft?.question || '',
      answer: '',
      resetToken: '',
      newPassword: '',
      confirmPassword: '',
    },
    activationDraft: {
      activationToken: '',
      newPassword: '',
      confirmPassword: '',
    },
    realtime: {
      connected: false,
      error: '',
      unread: state.realtime?.unread || 0,
      events: state.realtime?.events || [],
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeState));
}
