// Carrito compartido entre todas las páginas (se guarda en el navegador del cliente)
const KEY = "crudo_cart";

export function readCart() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch (e) {
    return [];
  }
}

export function writeCart(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {}
  window.dispatchEvent(new Event("crudo-cart"));
}

export function lineKey(i) {
  return `${i.id}|${i.color || ""}|${i.size || ""}`;
}

export function addToCart(item, open = true) {
  const items = readCart();
  const k = lineKey(item);
  const existing = items.find((i) => lineKey(i) === k);
  if (existing) existing.quantity += item.quantity;
  else items.push(item);
  writeCart(items);
  if (open) window.dispatchEvent(new Event("crudo-cart-open"));
}

export function clearCart() {
  writeCart([]);
}
