export function normText(node) {
  const text = (node || "").toString().replace(/\s+/g, " ").trim();
  return text;
}

