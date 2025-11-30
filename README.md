import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Plus, 
  Edit2, 
  ClipboardList, 
  Box, 
  Save,
  X,
  User,
  Check,
  Lock,
  ArrowLeft,
  AlertTriangle,
  Archive,
  LogOut,
  AlertCircle
} from 'lucide-react';

// --- Firebase Config & Init ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- TRANSLATION DICTIONARY (IMPROVED) ---
const translations = {
  en: {
    systemLogin: "System Login",
    subTitle: "PP4 Manual Slitter Access",
    accessDashboard: "Access Dashboard",
    passwordPlaceholder: "Enter Password",
    incorrectPwd: "Incorrect Password! Please try again.",
    history: "Stock History",
    lowStock: "Low Stock",
    empty: "Out of Stock",
    connecting: "Connecting...",
    dashboardTitle: "Production Dashboard",
    newOrder: "New Order Entry",
    newOrderDesc: "Record a new production order",
    historyDesc: "View and manage current stock",
    outOfStockMenu: "Out of Stock Items",
    outOfStockDesc: "View exhausted items",
    logout: "Logout",
    orderNo: "Production Order No.",
    flute: "Flute Type",
    size: "Board Size (W x L)",
    qty: "Quantity",
    bqComment: "BQ Comment",
    saveOrder: "Save Production Order",
    fixError: "Cannot Save: Fix Errors",
    duplicateTitle: "Duplicate Entry Detected!",
    duplicateMsg: "This Order ID already exists in the database.",
    items: "Items",
    noItems: "No records found in this category.",
    updated: "Last Updated",
    created: "Created On",
    by: "by",
    manual: "Manual Input",
    typeHere: "Type Value...",
    lowStockMsg: "Warning: Low Stock",
    lowStockAlert: "Orders with Low Stock",
    fixDuplicate: "Fix Duplicate"
  },
  mm: {
    systemLogin: "စနစ်သို့ဝင်ရောက်ရန်",
    subTitle: "PP4 Manual Slitter စနစ်",
    accessDashboard: "Dashboard သို့ဝင်မည်",
    passwordPlaceholder: "စကားဝှက်ရိုက်ထည့်ပါ",
    incorrectPwd: "စကားဝှက် မှားယွင်းနေပါသည်။ ပြန်လည်ကြိုးစားပါ။",
    history: "လက်ကျန်စာရင်း မှတ်တမ်း",
    lowStock: "လက်ကျန်နည်း",
    empty: "ကုန်သွားပြီ",
    connecting: "ချိတ်ဆက်နေသည်...",
    dashboardTitle: "ထုတ်လုပ်မှု မျက်နှာစာ",
    newOrder: "အော်ဒါ အသစ်သွင်းရန်",
    newOrderDesc: "ထုတ်လုပ်မှု အော်ဒါအသစ် စာရင်းသွင်းမည်",
    historyDesc: "လက်ကျန် ပစ္စည်းများကို စစ်ဆေးမည်",
    outOfStockMenu: "ကုန်သွားသော စာရင်းများ",
    outOfStockDesc: "လက်ကျန်မရှိတော့သော ပစ္စည်းများ",
    logout: "စနစ်မှ ထွက်မည်",
    orderNo: "အော်ဒါ နံပါတ် (Order No)",
    flute: "Flute အမျိုးအစား",
    size: "ဆိုဒ် (W x L)",
    qty: "အရေအတွက် (Unit Qty)",
    bqComment: "BQ မှတ်ချက် (Comment)",
    saveOrder: "အော်ဒါသိမ်းဆည်းမည်",
    fixError: "မှားယွင်းမှု ပြင်ဆင်ပါ",
    duplicateTitle: "စာရင်းထပ်နေပါသည်!",
    duplicateMsg: "ဤအော်ဒါနံပါတ်သည် စာရင်းထဲတွင် ရှိပြီးသားဖြစ်နေပါသည်။",
    items: "ခု",
    noItems: "ရှာဖွေမှုနှင့် ကိုက်ညီသော စာရင်းမရှိပါ",
    updated: "ပြင်ဆင်ချိန်",
    created: "စတင်ချိန်",
    by: "-", 
    manual: "အခြား (ရိုက်ထည့်ရန်)",
    typeHere: "ရိုက်ထည့်ပါ...",
    lowStockMsg: "သတိ: လက်ကျန်နည်းနေပါသည်",
    lowStockAlert: "လက်ကျန်နည်းနေသော Order များ",
    fixDuplicate: "နံပါတ် ပြန်စစ်ပါ"
  }
};

// --- HELPER COMPONENTS (MOVED OUTSIDE TO FIX KEYBOARD BUG) ---

const Background = ({ children }) => (
  <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative flex flex-col font-sans transition-all duration-500">
    <div className="absolute inset-0 bg-white/20 backdrop-blur-[100px] pointer-events-none"></div>
    <div className="relative z-10 w-full flex-1 flex flex-col">
      {children}
    </div>
  </div>
);

const GlassCard = ({ children, className = "", noPadding = false }) => (
  <div className={`bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl border border-white/40 ${noPadding ? '' : 'p-4'} ${className}`}>
    {children}
  </div>
);

// --- MAIN COMPONENT ---

export default function ProProductionSystem() {
  // --- States ---
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // App Flow & Settings
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [lang, setLang] = useState("mm"); // Default to Myanmar
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(""); 
  const [currentView, setCurrentView] = useState("dashboard");

  // Edit Mode State
  const [editingId, setEditingId] = useState(null);
  const [editQty, setEditQty] = useState("");

  // Form State
  const [formError, setFormError] = useState(""); 
  const [formData, setFormData] = useState({
    prodOrder: '',
    fluteSelect: 'B', 
    fluteManual: '', 
    bqComment: '',
    width: '',
    length: '',
    unitQty: ''
  });

  const t = translations[lang];

  // Helpers
  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getShortId = (uid) => {
    return uid ? "ID-" + uid.substring(0, 4).toUpperCase() : "...";
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp.seconds * 1000).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 1. Firebase Auth & Data Sync
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth Error:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'production_orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort: Update time first, if not then Create time
      fetchedOrders.sort((a, b) => {
        const timeA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
        const timeB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setOrders(fetchedOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Derived Lists
  const activeOrders = orders.filter(o => parseInt(o.unitQty) > 0);
  const outOfStockOrders = orders.filter(o => parseInt(o.unitQty) === 0);
  const lowStockOrders = activeOrders.filter(o => parseInt(o.unitQty) < 50);

  // --- Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "PP4") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError(t.incorrectPwd);
      setPasswordInput(""); 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear duplicate error when user starts typing order number
    if (name === 'prodOrder') setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    // 1. DUPLICATE CHECK
    const isDuplicate = orders.some(
      order => order.prodOrder.trim().toLowerCase() === formData.prodOrder.trim().toLowerCase()
    );

    if (isDuplicate) {
      setFormError(t.duplicateMsg);
      return; 
    }

    const finalFlute = formData.fluteSelect === 'Other' 
      ? formData.fluteManual 
      : formData.fluteSelect;

    if (!formData.prodOrder || !formData.width || !formData.length || !formData.unitQty || !finalFlute) {
      alert("Please fill all required fields.");
      return;
    }

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'production_orders'), {
        prodOrder: formData.prodOrder,
        fluteType: finalFlute,
        bqComment: formData.bqComment,
        width: formData.width,
        length: formData.length,
        unitQty: parseInt(formData.unitQty),
        createdAt: serverTimestamp(),
        authorId: getShortId(user.uid)
      });
      
      setFormData({
        prodOrder: '',
        fluteSelect: 'B',
        fluteManual: '',
        bqComment: '',
        width: '',
        length: '',
        unitQty: ''
      });
      setFormError("");
      setCurrentView("dashboard");
    } catch (err) {
      console.error("Error adding document: ", err);
    }
  };

  const startEdit = (order) => {
    setEditingId(order.id);
    setEditQty(order.unitQty);
  };

  const saveEdit = async (id) => {
    if (editQty === "") return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'production_orders', id);
      await updateDoc(docRef, { 
        unitQty: parseInt(editQty),
        updatedAt: serverTimestamp(),
        lastUpdatedBy: getShortId(user.uid)
      });
      setEditingId(null);
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  // --- VIEWS ---

  // 1. LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <Background>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <GlassCard className="w-full max-w-sm p-8 text-center shadow-indigo-500/30 relative">
            
            {/* LANGUAGE TOGGLE */}
            <div className="absolute top-4 right-4 flex bg-slate-100 p-1 rounded-lg">
               <button 
                 onClick={() => setLang('en')}
                 className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${lang === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
               >
                 ENG
               </button>
               <button 
                 onClick={() => setLang('mm')}
                 className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${lang === 'mm' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
               >
                 MM
               </button>
            </div>

            {/* --- STATS SUMMARY (Blue/Red Highlights) --- */}
            {loading ? (
              <div className="animate-pulse text-xs text-slate-400 mb-6 mt-6">System Loading...</div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-8 mt-6">
                {/* History (Blue) */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-blue-600 font-black text-xl">{activeOrders.length}</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">{t.history}</span>
                </div>
                {/* Low Stock (Red) */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 font-black text-xl">{lowStockOrders.length}</span>
                  <span className="text-[9px] font-bold text-red-400 uppercase tracking-tight">{t.lowStock}</span>
                </div>
                {/* Out of Stock (Blue) */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 flex flex-col items-center justify-center shadow-sm">
                  <span className="text-blue-600 font-black text-xl">{outOfStockOrders.length}</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tight">{t.empty}</span>
                </div>
              </div>
            )}

            <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
              <Lock className="text-indigo-600" size={32} />
            </div>
            
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">{t.systemLogin}</h1>
            <p className="text-slate-500 font-medium text-sm">{t.subTitle}</p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setLoginError("");
                  }}
                  className={`w-full px-4 py-3 bg-slate-50 border-2 rounded-xl focus:outline-none text-center text-xl tracking-[0.2em] transition-all placeholder-slate-300 font-bold ${
                    loginError ? 'border-red-500 bg-red-50 text-red-600 animate-pulse' : 'border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
                  }`}
                  placeholder="Password"
                  autoFocus
                />
              </div>

              {/* Password Error */}
              {loginError && (
                <div className="flex items-center justify-center gap-2 text-red-600 text-xs font-bold bg-red-100 p-2 rounded-lg animate-bounce">
                  <AlertCircle size={14} />
                  <span>{loginError}</span>
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-black hover:scale-[1.02] transition-all shadow-xl active:scale-95"
              >
                {t.accessDashboard}
              </button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-slate-100">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-400 text-xs font-bold">
                <User size={12} />
                {user ? getShortId(user.uid) : t.connecting}
              </div>
            </div>
          </GlassCard>
        </div>
      </Background>
    );
  }

  // 2. DASHBOARD SCREEN
  if (currentView === "dashboard") {
    return (
      <Background>
        <div className="max-w-md mx-auto w-full p-4 pt-8 pb-10">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-10 -mt-10"></div>
               
               <div className="relative">
                 <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-1">{t.dashboardTitle}</p>
                 <h1 className="text-2xl font-black text-slate-900 mb-6 leading-tight">
                   PP4 Manual Slitter
                 </h1>
                 
                 <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100">
                       <User size={24} className="text-slate-700" />
                    </div>
                    <div>
                       <p className="text-lg font-bold text-slate-800 leading-none">HEINANN</p>
                       <p className="text-xs text-slate-500 font-mono mt-1">
                          {user ? getShortId(user.uid) : '...'}
                       </p>
                    </div>
                    <div className="ml-auto text-right">
                       <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                          <span className="text-sm font-bold text-slate-700">{getCurrentDate()}</span>
                       </div>
                    </div>
                 </div>
               </div>
            </div>

            {/* Alert Panel (Orders with Low Stock) */}
            {lowStockOrders.length > 0 && (
              <div className="bg-red-500 text-white rounded-2xl p-4 mb-6 shadow-lg shadow-red-500/30 animate-pulse border-2 border-red-400">
                <div className="flex items-center gap-2 font-bold mb-3">
                  <AlertTriangle size={20} className="text-white" />
                  <h3>{t.lowStockAlert} ({lowStockOrders.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {lowStockOrders.map(order => (
                    <span key={order.id} className="bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                      {order.prodOrder}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Buttons */}
            <div className="grid gap-4">
              <button 
                onClick={() => setCurrentView("new_order")}
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 hover:bg-white hover:scale-[1.02] transition-all flex items-center gap-5 group active:scale-[0.98]"
              >
                <div className="bg-blue-100 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                  <Plus size={28} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-lg text-slate-800">{t.newOrder}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{t.newOrderDesc}</p>
                </div>
              </button>

              <button 
                onClick={() => setCurrentView("history")}
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 hover:bg-white hover:scale-[1.02] transition-all flex items-center gap-5 group active:scale-[0.98]"
              >
                <div className="bg-emerald-100 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                  <ClipboardList size={28} strokeWidth={2.5} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-black text-lg text-slate-800">{t.history}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">{t.historyDesc}</p>
                </div>
                <div className="bg-emerald-50 px-3 py-1.5 rounded-xl text-sm font-black text-emerald-600 border border-emerald-100 min-w-[44px] text-center shadow-inner">
                  {activeOrders.length}
                </div>
              </button>

              <button 
                onClick={() => setCurrentView("out_of_stock")}
                className="bg-white/95 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 hover:bg-white hover:scale-[1.02] transition-all flex items-center gap-5 group active:scale-[0.98]"
              >
                <div className="bg-rose-100 p-4 rounded-2xl text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors shadow-sm">
                  <Archive size={28} strokeWidth={2.5} />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-black text-lg text-slate-800">{t.outOfStockMenu}</h3>
        
