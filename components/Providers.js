'use client';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translate, catName, formatPrice, formatDate } from '@/lib/i18n';
import { api } from '@/lib/client';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function Providers({ children }) {
  const [lang, setLangState] = useState('ky');
  const [theme, setThemeState] = useState('light');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [favIds, setFavIds] = useState([]);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setLangState(read('ms_lang', 'ky'));
    setThemeState(document.documentElement.dataset.theme || 'light');
    setCart(read('ms_cart', []));
    api('/api/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  useEffect(() => {
    if (!user) return setFavIds([]);
    api('/api/favorites').then((d) => setFavIds(d.ids)).catch(() => {});
  }, [user]);

  const setLang = (l) => { setLangState(l); write('ms_lang', l); };
  const setTheme = (th) => { setThemeState(th); document.documentElement.dataset.theme = th; write('ms_theme', th); };

  const toast = useCallback((text, type = 'success') => {
    const id = Math.random();
    setToasts((t) => [...t, { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const t = useCallback((k) => translate(lang, k), [lang]);
  const errText = useCallback((e) => translate(lang, 'err_' + (e?.message || 'server_error')), [lang]);

  const updateCart = (next) => { setCart(next); write('ms_cart', next); };
  const addToCart = (p, qty = 1) => {
    const existing = cart.find((i) => i.id === p.id);
    const max = p.stock ?? 99;
    const next = existing
      ? cart.map((i) => (i.id === p.id ? { ...i, qty: Math.min(max, i.qty + qty) } : i))
      : [...cart, { id: p.id, title: p.title, price: p.price, thumbnail: p.thumbnail, stock: max, qty: Math.min(max, qty) }];
    updateCart(next);
    toast(t('added'));
  };
  const setQty = (id, qty) => updateCart(cart.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(i.stock ?? 99, qty)) } : i)));
  const removeFromCart = (id) => updateCart(cart.filter((i) => i.id !== id));
  const clearCart = () => updateCart([]);

  const toggleFav = async (productId) => {
    if (!user) { toast(t('loginRequired'), 'error'); return false; }
    try {
      const d = await api('/api/favorites', { method: 'POST', body: { productId } });
      setFavIds(d.ids);
      toast(t(d.favorite ? 'addedFav' : 'removedFav'));
      return true;
    } catch (e) { toast(errText(e), 'error'); return false; }
  };

  const login = async (email, password) => { const d = await api('/api/auth/login', { method: 'POST', body: { email, password } }); setUser(d.user); return d.user; };
  const register = async (data) => { const d = await api('/api/auth/register', { method: 'POST', body: data }); setUser(d.user); return d.user; };
  // Full reload after logout so guarded pages never redirect to /login mid-navigation.
  const logout = async () => { await api('/api/auth/logout', { method: 'POST' }).catch(() => {}); window.location.assign('/'); };

  const value = useMemo(() => ({
    lang, setLang, theme, setTheme, t, errText,
    cat: (s) => catName(lang, s), price: (n) => formatPrice(n, lang), date: (d) => formatDate(d, lang),
    user, setUser, authLoading, login, register, logout,
    cart, addToCart, setQty, removeFromCart, clearCart,
    cartCount: cart.reduce((s, i) => s + i.qty, 0),
    cartTotal: cart.reduce((s, i) => s + i.qty * i.price, 0),
    favIds, toggleFav, toast,
  }), [lang, theme, user, authLoading, cart, favIds, t, errText, toast]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((x) => <div key={x.id} className={`toast toast-${x.type}`}>{x.text}</div>)}
      </div>
    </Ctx.Provider>
  );
}
