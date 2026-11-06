const BASE = import.meta.env.VITE_API_URL || '/api';
export const getToken = () => sessionStorage.getItem('sunshine-token');
export async function api(path, options = {}) {
  const token = getToken();
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Comprueba que el backend y PostgreSQL estén iniciados.');
  }
  if (response.status === 204) return null;
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    if(response.status===401 && path!=='/auth/login') window.dispatchEvent(new Event('sunshine-session-expired'));
    throw new Error(json.error || 'No se pudo completar la solicitud.');
  }
  return json;
}
export function reportApiError(error) {
  window.dispatchEvent(new CustomEvent('sunshine-error',{detail:error.message || 'No se pudo guardar.'}));
}
