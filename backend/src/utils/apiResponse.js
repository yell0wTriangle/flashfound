export function apiSuccess(data, meta) {
  if (meta) {
    return { ok: true, data, meta };
  }
  return { ok: true, data };
}

export function apiErrorPayload({ code, message, details, requestId }) {
  const error = {
    code,
    message,
    requestId,
  };

  if (details !== undefined) {
    error.details = details;
  }

  return { ok: false, error };
}
