/* =====================================================================
   store-core.js  —  الملف المشترك بين المتجر (index.html) ولوحة الإدارة (admin.html)
   فيه: إعدادات فايربيس (مكان واحد بس) + القيم الافتراضية + دوال القراءة والحفظ
   بدون فايربيس الموقع يشتغل بوضع تجريبي ويحفظ ببيانات المتصفح (localStorage)
   ===================================================================== */
/* ===== إعدادات فايربيس (مكان واحد لكل الموقع) ===== */
export const firebaseConfig = {
  apiKey: "AIzaSyAgMUTmRjYbqwvyZhHhewnPXVY_8YXngO8",
  authDomain: "bosphorus-store.firebaseapp.com",
  projectId: "bosphorus-store",
  storageBucket: "bosphorus-store.firebasestorage.app",
  messagingSenderId: "60757252796",
  appId: "1:60757252796:web:bbd99fc93dacab64d4ceb9"
};
export const READY = !firebaseConfig.apiKey.includes("REPLACE_ME");
let db = null, auth = null, FB = {};
if (READY) {
  const B = "https://www.gstatic.com/firebasejs/10.12.2/";
  const [a, f, u] = await Promise.all([import(B + "firebase-app.js"), import(B + "firebase-firestore.js"), import(B + "firebase-auth.js")]);
  FB = { ...f, ...u };
  const app = a.initializeApp(firebaseConfig); db = f.getFirestore(app); auth = u.getAuth(app);
}
const { collection, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, signInWithEmailAndPassword, signOut, onAuthStateChanged } = FB;

/* ===== أدوات عامة ===== */
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const fmt = n => Number(n || 0).toLocaleString("en-US");
export const orderTime = o => o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (o.createdAt || 0);

/* ضغط الصورة قبل الحفظ حتى ما يكبر حجم قاعدة البيانات */
export function compressImage(file, max = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

/* ===== القيم الافتراضية (كلها تتغير من لوحة الإدارة) ===== */
export const DEFAULT_SETTINGS = {
  brandName: "بسفور",
  brandEn: "BOSPHORUS",
  siteTitle: "بسفور | BOSPHORUS",
  announcement: "توصيل لجميع مناطق بغداد 🚚",
  slides: [
    { title: "تشكيلة جديدة", text: "أحدث صيحات الموضة النسائية", link: "products", tone: "#3D1F2B", image: "" },
    { title: "عروض وخصومات", text: "خصومات على منتجات مختارة", link: "discounts", tone: "#7a2e45", image: "" },
    { title: "توصيل لكل المناطق", text: "بغداد والمحافظات، ودفع عند الاستلام", link: "shipping", tone: "#9c5b4d", image: "" }
  ],
  heroEyebrow: "تشكيلة جديدة",
  heroTitle: "أناقتك تبدأ من هنا",
  heroText: "تسوقي أحدث صيحات الموضة النسائية أونلاين، دفع عند الاستلام أو تحويل.",
  heroButton: "تسوقي الآن",
  heroImage: "",
  sectionTitle: "منتجاتنا",
  searchPlaceholder: "ابحثي عن منتج...",
  currency: "د.ع",
  successTitle: "تم استلام طلبكِ",
  successText: "راح نتواصل وياكِ قريباً لتأكيد التوصيل",
  footerText: "البسفور للألبسة النسائية",
  whatsapp: "",
  instagram: "https://instagram.com/bosphorus_fashion",
  facebook: "",
  freeShipOver: 100000,
  deliveryOptions: [
    { name: "توصيل داخل بغداد", fee: 5000, enabled: true },
    { name: "توصيل للمحافظات", fee: 8000, enabled: true },
    { name: "استلام من المحل", fee: 0, enabled: true }
  ],
  paymentOptions: [
    { name: "الدفع عند الاستلام", note: "", enabled: true },
    { name: "تحويل / زين كاش", note: "", enabled: true }
  ],
  categories: ["فساتين", "عبايات", "بلوزات", "تنانير", "أطقم", "جاكيتات", "إكسسوارات"],
  colors: { primary: "#3D1F2B", accent: "#C9A227", background: "#FBF6F0", soft: "#E8B4BC" },
  /* صفحات المعلومات: نصوص تجريبية، تنعدل من لوحة الإدارة */
  pages: {
    about:      { title: "من نحن", body: "البسفور محل ألبسة نسائية بفروع ببغداد. نوفر لكِ أحدث التصاميم بجودة وأسعار مناسبة.\n\n(نص تجريبي — عدّليه)" },
    contact:    { title: "اتصل بنا", body: "تواصلي وياحنا من الروابط الي تحت، ونرد عليكِ بأقرب وقت.\nفروعنا: الجامعة مول — شارع الربيع (بغداد)." },
    support:    { title: "الدعم", body: "محتاجة مساعدة بطلب او منتج؟ اكتبي لنا واتساب، وتكدرين تتابعين طلبك من صفحة حالة الطلب." },
    shipping:   { title: "معلومات الشحن", body: "نوصّل لجميع مناطق بغداد والمحافظات. أسعار التوصيل:" },
    returns:    { title: "سياسة الإرجاع", body: "تكدرين تستبدلين او ترجعين المنتج اذا كان بحالته الأصلية وبنفس التغليف. تواصلي وياحنا بأسرع وقت بعد الاستلام.\n\n(نص تجريبي — اكتبي المدة والشروط الفعلية)" },
    terms:      { title: "الشروط والأحكام", body: "باستخدامك للموقع وتقديم طلب، توافقين على هذه الشروط. الأسعار والتوفر قابلة للتغيير، وتأكيد الطلب يتم بالتواصل وياكِ.\n\n(نص تجريبي — عدّليه)" },
    disclaimer: { title: "إخلاء المسؤولية", body: "الصور للتوضيح وقد يختلف اللون قليلاً حسب شاشة الجهاز. نبذل جهدنا لدقة المعلومات لكن ما نضمن خلوها من الأخطاء.\n\n(نص تجريبي — عدّليه)" }
  }
};

const DEMO_PRODUCTS = [
  { name:"فستان سهرة ساتان", category:"فساتين", price:65000, oldPrice:85000, badge:"خصم", sizes:["S","M","L"], colors:["خمري","أسود"], tone:"#7a2e45", description:"فستان ساتان بقصة انسيابية، مناسب للمناسبات." },
  { name:"عباية كريب مطرزة", category:"عبايات", price:48000, badge:"جديد", sizes:["52","54","56"], colors:["أسود"], tone:"#2a2420", description:"عباية كريب خفيفة بتطريز ناعم على الأكمام." },
  { name:"بلوزة قطن بأكمام واسعة", category:"بلوزات", price:22000, sizes:["S","M","L","XL"], colors:["بيج","أبيض"], tone:"#d8c3a5", description:"بلوزة يومية مريحة بقماش قطن ناعم." },
  { name:"تنورة بليسيه طويلة", category:"تنانير", price:30000, badge:"الأكثر مبيعاً", sizes:["M","L"], colors:["زيتي","وردي"], tone:"#8a8f5c", description:"تنورة بليسيه بطول الكاحل وخصر مطاطي." },
  { name:"طقم كاجوال قطعتين", category:"أطقم", price:42000, sizes:["S","M","L"], colors:["رمادي","كحلي"], tone:"#5b6b7c", description:"طقم بنطلون وبلوزة بقماش مريح." },
  { name:"فستان صيفي مزهر", category:"فساتين", price:38000, oldPrice:46000, badge:"خصم", sizes:["S","M","L"], colors:["وردي"], tone:"#e8b4bc", description:"فستان خفيف بنقشة زهور وحزام خصر." },
  { name:"جاكيت جينز قصير", category:"جاكيتات", price:35000, sizes:["M","L"], colors:["أزرق"], tone:"#4a6a8a", description:"جاكيت جينز بقصة قصيرة." },
  { name:"وشاح حرير ناعم", category:"إكسسوارات", price:12000, badge:"جديد", colors:["ذهبي","بنفسجي"], tone:"#c9a227", description:"وشاح بنسيج حريري ناعم." }
];

const DEMO_ORDERS = () => [
  { id: "demo1", customerName: "سارة (طلب تجريبي)", phone: "07701234567", area: "بغداد - الكرادة", address: "قرب مول الكرادة", note: "", deliveryMethod: "توصيل داخل بغداد", paymentMethod: "الدفع عند الاستلام",
    items: [{ name: "فستان سهرة ساتان", price: 65000, qty: 1, size: "M", color: "خمري" }], subtotal: 65000, deliveryFee: 5000, total: 70000, currency: "د.ع", status: "جديد", createdAt: Date.now() - 3600e3 },
  { id: "demo2", customerName: "نور (طلب تجريبي)", phone: "07809876543", area: "البصرة - المركز", address: "حي الجزائر", note: "اتصلوا قبل التوصيل", deliveryMethod: "توصيل للمحافظات", paymentMethod: "تحويل / زين كاش",
    items: [{ name: "عباية كريب مطرزة", price: 48000, qty: 1, size: "54", color: "أسود" }, { name: "وشاح حرير ناعم", price: 12000, qty: 2, size: "", color: "ذهبي" }], subtotal: 72000, deliveryFee: 8000, total: 80000, currency: "د.ع", status: "قيد التجهيز", createdAt: Date.now() - 86400e3 }
];

/* ===== تخزين محلي للوضع التجريبي ===== */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
};
const mergeSettings = s => ({ ...DEFAULT_SETTINGS, ...(s || {}), colors: { ...DEFAULT_SETTINGS.colors, ...((s || {}).colors || {}) },
  pages: Object.fromEntries(Object.keys(DEFAULT_SETTINGS.pages).map(k => [k, { ...DEFAULT_SETTINGS.pages[k], ...(((s || {}).pages || {})[k] || {}) }])) });
const newId = () => "l" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* ===== الإعدادات ===== */
export async function getSettings() {
  if (READY) { try { const d = await getDoc(doc(db, "settings", "site")); return mergeSettings(d.exists() ? d.data() : {}); } catch (e) { console.error(e); return mergeSettings({}); } }
  return mergeSettings(LS.get("bq_settings", {}));
}
export async function saveSettings(s) {
  if (READY) return setDoc(doc(db, "settings", "site"), s);
  LS.set("bq_settings", s);
}

/* ===== المنتجات ===== */
export async function getProducts() {
  if (READY) { const snap = await getDocs(collection(db, "products")); return snap.docs.map(d => ({ id: d.id, ...d.data() })); }
  let list = LS.get("bq_products", null);
  if (list === null) { list = DEMO_PRODUCTS.map(p => ({ id: newId(), ...p })); LS.set("bq_products", list); }
  return list;
}
export async function saveProduct(p) {
  const { id, ...data } = p;
  if (READY) { if (id) return updateDoc(doc(db, "products", id), data); return addDoc(collection(db, "products"), data); }
  const list = LS.get("bq_products", []);
  if (id) { const i = list.findIndex(x => x.id === id); if (i >= 0) list[i] = { id, ...data }; }
  else list.unshift({ id: newId(), ...data });
  LS.set("bq_products", list);
}
export async function deleteProduct(id) {
  if (READY) return deleteDoc(doc(db, "products", id));
  LS.set("bq_products", LS.get("bq_products", []).filter(x => x.id !== id));
}

/* ===== الطلبات ===== */
export async function addOrder(o) {
  if (READY) { const r = await addDoc(collection(db, "orders"), { ...o, createdAt: serverTimestamp() }); return r.id; }
  const id = newId(); const list = LS.get("bq_orders", []); list.unshift({ id, ...o, createdAt: Date.now() }); LS.set("bq_orders", list); return id;
}
export async function getOrderById(id) {
  if (!id) return null;
  if (READY) { const d = await getDoc(doc(db, "orders", id)); return d.exists() ? { id: d.id, ...d.data() } : null; }
  return LS.get("bq_orders", []).find(x => x.id === id) || null;
}
export async function getOrders() {
  if (READY) { const snap = await getDocs(collection(db, "orders")); return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => orderTime(b) - orderTime(a)); }
  let l = LS.get("bq_orders", null);
  if (l === null) { l = DEMO_ORDERS(); LS.set("bq_orders", l); }
  return l;
}
export async function updateOrder(id, data) {
  if (READY) return updateDoc(doc(db, "orders", id), data);
  const list = LS.get("bq_orders", []); const i = list.findIndex(x => x.id === id); if (i >= 0) list[i] = { ...list[i], ...data }; LS.set("bq_orders", list);
}
export async function deleteOrder(id) {
  if (READY) return deleteDoc(doc(db, "orders", id));
  LS.set("bq_orders", LS.get("bq_orders", []).filter(x => x.id !== id));
}

/* ===== دخول الإدارة =====
   مع فايربيس: ايميل وباسورد (Firebase Authentication). بدونه: رمز تجريبي 0000 */
export async function adminLogin(email, secret) {
  if (READY) { await signInWithEmailAndPassword(auth, email, secret); return true; }
  if (secret === "0000") { sessionStorage.setItem("bq_admin", "1"); return true; }
  return false;
}
export async function adminLogout() { if (READY) await signOut(auth); sessionStorage.removeItem("bq_admin"); }
export function onAdmin(cb) {
  if (READY) onAuthStateChanged(auth, u => cb(!!u));
  else cb(sessionStorage.getItem("bq_admin") === "1");
}
