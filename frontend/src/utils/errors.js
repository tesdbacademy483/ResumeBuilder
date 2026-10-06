const pretty = (key) => key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

/** One readable sentence for a toast. */
export function errorMessage(err) {
  if (!err?.response) return "Can't reach the server. Check that Django is running on port 8000.";
  const d = err.response.data;
  if (!d || typeof d === "string") return `The server returned an error (${err.response.status}).`;
  if (d.detail) return [].concat(d.detail).join(" ");
  if (d.non_field_errors) return d.non_field_errors.join(" ");
  const [key, val] = Object.entries(d)[0] || [];
  return key ? `${pretty(key)}: ${[].concat(val).join(" ")}` : "Something went wrong.";
}

/** { field: "message" } for showing errors under each input. */
export function fieldErrors(err) {
  const d = err?.response?.data;
  if (!d || typeof d !== "object" || Array.isArray(d)) return {};
  return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, [].concat(v).join(" ")]));
}
