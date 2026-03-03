// --- URL Hash State Helpers ---

export const parseHash = (): Record<string, string> => {
    const hash = window.location.hash.slice(1);
    if (!hash) return {};
    const params = new URLSearchParams(hash);
    const result: Record<string, string> = {};
    params.forEach((v, k) => { result[k] = v; });
    return result;
};

export const updateHash = (state: Record<string, string>) => {
    const params = new URLSearchParams(state);
    const hash = params.toString();
    window.history.replaceState(null, '', hash ? `#${hash}` : window.location.pathname);
};
