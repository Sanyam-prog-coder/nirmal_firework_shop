import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Package, TrendingUp, History, Users, 
  Sun, Moon, LogOut, Plus, Trash2, Edit, Search, 
  AlertTriangle, CheckCircle, Printer, X, Shield, User, DollarSign
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://nirmal-fireshop.onrender.com/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('nirmal_token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('nirmal_user') || 'null'));
  const [theme, setTheme] = useState(localStorage.getItem('nirmal_theme') || 'bright');
  const [activeTab, setActiveTab] = useState('pos');

  // Sync Theme
  useEffect(() => {
    localStorage.setItem('nirmal_theme', theme);
    if (theme === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleLogin = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem('nirmal_token', token);
    localStorage.setItem('nirmal_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('nirmal_token');
    localStorage.removeItem('nirmal_user');
  };

  if (!token || !user) {
    return <LoginScreen onLogin={handleLogin} setTheme={setTheme} theme={theme}/>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Top Navbar */}
      <header className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 text-white shadow-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
            <ShoppingBag className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Nirmal Firework Shop</h1>
            <p className="text-xs text-amber-100">Festive Season POS & Inventory Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setTheme(theme === 'bright' ? 'night' : 'bright')}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-white"
            title="Toggle Theme"
          >
            {theme === 'bright' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
          </button>
          
          <div className="flex items-center space-x-2 bg-black/20 px-3 py-1.5 rounded-full">
            {user.role === 'admin' ? <Shield className="w-4 h-4 text-amber-300"/> : <User className="w-4 h-4 text-amber-200"/>}
            <span className="text-sm font-medium">{user.name}</span>
            <span className="text-xs uppercase bg-white/20 px-1.5 py-0.5 rounded font-bold">{user.role}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition"
          >
            <LogOut className="w-4 h-4"/>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex space-x-2 overflow-x-auto shadow-sm">
        <TabButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<ShoppingBag className="w-4 h-4"/>} label="Billing" />
        <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package className="w-4 h-4"/>} label="Inventory" />
        <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History className="w-4 h-4"/>} label="Sales History" />
        {user.role === 'admin' && (
          <>
            <TabButton active={activeTab === 'financials'} onClick={() => setActiveTab('financials')} icon={<TrendingUp className="w-4 h-4"/>} label="Financial Dashboard" />
            <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<Package className="w-4 h-4"/>} label="Restocking Analytics" />
            <TabButton active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon={<Users className="w-4 h-4"/>} label="Worker Management" />
          </>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'pos' && <POSView token={token} user={user}/>}
        {activeTab === 'inventory' && <InventoryView token={token} user={user}/>}
        {activeTab === 'history' && <HistoryView token={token}/>}
        {activeTab === 'financials' && user.role === 'admin' && <FinancialsView token={token}/>}
        {activeTab === 'analytics' && user.role === 'admin' && <AnalyticsView token={token}/>}
        {activeTab === 'workers' && user.role === 'admin' && <WorkersView token={token}/>}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 py-4 px-4 border-b-2 font-medium text-sm transition whitespace-nowrap ${
        active 
          ? 'border-orange-600 text-orange-600 dark:text-orange-400 dark:border-orange-500' 
          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// --- LOGIN SCREEN ---
function LoginScreen({ onLogin, theme, setTheme }) {
  const [email, setEmail] = useState('admin@nirmalfireworks.com');
  const [password, setPassword] = useState('Nirmal@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => setTheme(theme === 'bright' ? 'night' : 'bright')}
          className="p-2 rounded-lg bg-slate-800 text-white"
        >
          {theme === 'bright' ? <Moon className="w-5 h-5"/> : <Sun className="w-5 h-5"/>}
        </button>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-orange-600/20 text-orange-500 rounded-2xl mb-4">
            <ShoppingBag className="w-8 h-8"/>
          </div>
          <h2 className="text-2xl font-bold text-white">Nirmal Firework Shop</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to POS & Management Portal</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg transition shadow-lg shadow-orange-600/30"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-500">
          Default Admin: admin@nirmalfireworks.com / Nirmal@2026
        </div>
      </div>
    </div>
  );
}

// --- POS BILLING VIEW ---
function POSView({ token, user }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [completedBill, setCompletedBill] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setProducts(await res.json());
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || p.category === category;
    return matchesSearch && matchesCat;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Out of stock!');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert('Cannot exceed available stock quantity.');
        return;
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (id, qty) => {
    const product = products.find(p => p.id === id);
    if (qty > product.stock) {
      alert('Exceeds available stock.');
      return;
    }
    if (qty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, quantity: qty } : item));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.selling_price * item.quantity), 0);
  const finalTotal = Math.max(0, subtotal - (parseFloat(discount) || 0));

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bills`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart,
          discount: parseFloat(discount) || 0
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCompletedBill(data);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDiscount(0);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection Catalog */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
            <input 
              type="text"
              placeholder="Search firecrackers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
          >
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              onClick={() => addToCart(product)}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 cursor-pointer transition transform hover:-translate-y-1 shadow-sm flex flex-col justify-between ${
                product.stock <= 5 ? 'border-amber-500/50' : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-28 object-cover rounded-xl mb-3 bg-slate-100 dark:bg-slate-800" />
                ) : (
                  <div className="w-full h-28 bg-orange-500/10 rounded-xl mb-3 flex items-center justify-center text-orange-500 font-bold">
                    🎆
                  </div>
                )}
                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{product.category}</span>
                <h3 className="font-semibold text-sm line-clamp-1 mt-0.5">{product.name}</h3>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-base">₹{product.selling_price}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  product.stock > 10 ? 'bg-emerald-500/10 text-emerald-500' : product.stock > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  Stock: {product.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Billing Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-[calc(100vh-140px)] sticky top-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center justify-between">
          <span>Current Bill</span>
          <span className="text-xs bg-orange-500/10 text-orange-500 px-2.5 py-1 rounded-full font-semibold">{cart.length} items</span>
        </h2>

        <div className="space-y-3 mb-4">
          <input 
            type="text" 
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          />
          <input 
            type="text" 
            placeholder="Customer Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-40"/>
              <p className="text-sm">Click items from the catalog to add them to the bill.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center justify-between">
                <div className="flex-1 pr-2">
                  <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                  <p className="text-xs text-slate-500">₹{item.selling_price} each</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-sm"
                  >-</button>
                  <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center font-bold text-sm"
                  >+</button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Discount (₹)</span>
            <input 
              type="number" 
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-24 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-right text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Final Amount</span>
            <span className="text-orange-600 dark:text-orange-400">₹{finalTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-slate-400 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-orange-600/30 mt-2"
          >
            {loading ? 'Processing...' : 'Complete & Print Bill'}
          </button>
        </div>
      </div>

      {/* Completed Bill / Invoice Receipt Modal */}
      {completedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setCompletedBill(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5"/>
            </button>

            <div id="printable-receipt" className="space-y-4">
              <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
                <h2 className="text-xl font-bold">NIRMAL FIREWORK SHOP</h2>
                <p className="text-xs text-slate-500">Festive Crackers & Wholesale Retailer</p>
                <p className="text-xs text-slate-500 mt-1">Bill ID: {completedBill.billId}</p>
                <p className="text-xs text-slate-500">{new Date(completedBill.date).toLocaleString()}</p>
              </div>

              <div className="text-sm space-y-1">
                <p><span className="font-semibold">Customer:</span> {completedBill.customer_name || 'Walk-in'}</p>
                {completedBill.customer_phone && <p><span className="font-semibold">Phone:</span> {completedBill.customer_phone}</p>}
                <p><span className="font-semibold">Served By:</span> {completedBill.worker_name}</p>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs text-slate-500">
                    <th className="pb-2">Item</th>
                    <th className="pb-2 text-center">Qty</th>
                    <th className="pb-2 text-right">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {completedBill.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2">{item.name}</td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">₹{item.selling_price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>₹{completedBill.subtotal}</span>
                </div>
                {completedBill.discount > 0 && (
                  <div className="flex justify-between text-emerald-500">
                    <span>Discount Applied</span>
                    <span>-₹{completedBill.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>Total Amount</span>
                  <span>₹{completedBill.total}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <p className="font-semibold">Thank you for celebrating with us!</p>
                <p>Have a safe & joyous celebration! 🎇</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => window.print()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-xl flex items-center justify-center space-x-2 transition"
              >
                <Printer className="w-4 h-4"/>
                <span>Print Receipt</span>
              </button>
              <button 
                onClick={() => setCompletedBill(null)}
                className="px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- INVENTORY MANAGEMENT VIEW ---
function InventoryView({ token, user }) {
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', cost_price: '', selling_price: '', stock: '', image_url: '' });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE}/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setProducts(await res.json());
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingProduct ? `${API_BASE}/products/${editingProduct.id}` : `${API_BASE}/products`;
    const method = editingProduct ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({
        ...form,
        cost_price: parseFloat(form.cost_price),
        selling_price: parseFloat(form.selling_price),
        stock: parseInt(form.stock)
      })
    });

    if (res.ok) {
      setModalOpen(false);
      setEditingProduct(null);
      setForm({ name: '', category: '', cost_price: '', selling_price: '', stock: '', image_url: '' });
      fetchProducts();
    } else {
      alert('Failed to save product');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Inventory Management</h2>
          <p className="text-sm text-slate-500">Manage stock quantities, cost rates, and retail prices.</p>
        </div>
        {user.role === 'admin' && (
          <button 
            onClick={() => {
              setEditingProduct(null);
              setForm({ name: '', category: '', cost_price: '', selling_price: '', stock: '', image_url: '' });
              setModalOpen(true);
            }}
            className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-orange-600/30 transition"
          >
            <Plus className="w-4 h-4"/>
            <span>Add New Firecracker</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-full h-36 object-cover rounded-xl mb-4 bg-slate-100 dark:bg-slate-800" />
              ) : (
                <div className="w-full h-36 bg-orange-500/10 rounded-xl mb-4 flex items-center justify-center text-orange-500 text-3xl">
                  🎆
                </div>
              )}
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">{product.category}</span>
                {product.stock <= 5 && (
                  <span className="flex items-center space-x-1 text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-medium">
                    <AlertTriangle className="w-3 h-3"/>
                    <span>Low Stock</span>
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base mb-2">{product.name}</h3>

              <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl mb-4">
                {user.role === 'admin' && (
                  <div>
                    <span className="text-xs text-slate-500 block">Cost Price</span>
                    <span className="font-semibold">₹{product.cost_price}</span>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 block">Selling Price</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">₹{product.selling_price}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">In Stock</span>
                  <span className="font-semibold">{product.stock} units</span>
                </div>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="flex space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  onClick={() => {
                    setEditingProduct(product);
                    setForm(product);
                    setModalOpen(true);
                  }}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 py-2 rounded-xl text-sm font-medium flex items-center justify-center space-x-1 transition"
                >
                  <Edit className="w-4 h-4"/>
                  <span>Edit</span>
                </button>
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal (Admin Only) */}
      {modalOpen && user.role === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-4">{editingProduct ? 'Edit Firecracker Product' : 'Add New Firecracker'}</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Product Name</label>
                <input 
                  type="text" required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Category</label>
                  <input 
                    type="text" required placeholder="e.g. Sparklers, Rockets"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Stock Quantity</label>
                  <input 
                    type="number" required
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Cost Price (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.cost_price}
                    onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Selling Price (₹)</label>
                  <input 
                    type="number" step="0.01" required
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Image URL (Optional)</label>
                <input 
                  type="text" placeholder="https://..."
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-xl transition"
                >
                  Save Product
                </button>
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-medium rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SALES HISTORY VIEW ---
function HistoryView({ token }) {
  const [bills, setBills] = useState([]);
  const [search, setSearch] = useState('');
  const [workerFilter, setWorkerFilter] = useState('All');

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const res = await fetch(`${API_BASE}/bills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setBills(await res.json());
  };

  const workers = ['All', ...new Set(bills.map(b => b.worker_name))];

  const filteredBills = bills.filter(b => {
    const matchesSearch = b.id.toLowerCase().includes(search.toLowerCase()) || 
                          (b.customer_name && b.customer_name.toLowerCase().includes(search.toLowerCase()));
    const matchesWorker = workerFilter === 'All' || b.worker_name === workerFilter;
    return matchesSearch && matchesWorker;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Sales History & Tally</h2>
          <p className="text-sm text-slate-500">Search archive of previous bills, filterable by worker or customer.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
            <input 
              type="text" 
              placeholder="Search Bill ID or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>
          <select 
            value={workerFilter}
            onChange={(e) => setWorkerFilter(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-500"
          >
            {workers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Bill ID</th>
              <th className="p-4">Date & Time</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Worker</th>
              <th className="p-4 text-right">Items</th>
              <th className="p-4 text-right">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">No sales records found.</td>
              </tr>
            ) : (
              filteredBills.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-4 font-semibold text-orange-600 dark:text-orange-400">{bill.id}</td>
                  <td className="p-4 text-slate-500 text-xs">{new Date(bill.date).toLocaleString()}</td>
                  <td className="p-4 font-medium">{bill.customer_name}</td>
                  <td className="p-4"><span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{bill.worker_name}</span></td>
                  <td className="p-4 text-right">{bill.items.reduce((s, i) => s + i.quantity, 0)} units</td>
                  <td className="p-4 text-right font-bold">₹{bill.total}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- FINANCIAL DASHBOARD VIEW (Admin Only) ---
function FinancialsView({ token }) {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const res = await fetch(`${API_BASE}/bills`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setBills(await res.json());
    } catch (error) {
      console.error("Failed to fetch bills:", error);
    }
  };

  // Function to delete a bill
  const handleDeleteBill = async (billId) => {
    if (!window.confirm("Are you sure you want to delete this bill?")) return;

    try {
      const res = await fetch(`${API_BASE}/bills/${billId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        // Remove the deleted bill from local state to update the UI instantly
        setBills(bills.filter(b => b.id !== billId));
      } else {
        alert("Failed to delete the bill.");
      }
    } catch (error) {
      console.error("Error deleting bill:", error);
      alert("An error occurred while deleting the bill.");
    }
  };

  const totalRevenue = bills.reduce((sum, b) => sum + b.total, 0);
  const totalCost = bills.reduce((sum, b) => sum + (b.total_cost || 0), 0);
  const netProfit = totalRevenue - totalCost;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Financial Dashboard</h2>
        <p className="text-sm text-slate-500">Gross sales, cost of goods sold, and net profit analytics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Revenue (Gross Sales)</span>
          <h3 className="text-3xl font-bold mt-2 text-orange-600 dark:text-orange-400">₹{totalRevenue.toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Cost of Goods Sold (COGS)</span>
          <h3 className="text-3xl font-bold mt-2 text-slate-700 dark:text-slate-300">₹{totalCost.toFixed(2)}</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Net Profit Earned</span>
          <h3 className="text-3xl font-bold mt-2 text-emerald-500">₹{netProfit.toFixed(2)}</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-base mb-4">Profit Breakdown per Bill</h3>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
              <th className="pb-3">Bill ID</th>
              <th className="pb-3">Customer</th>
              <th className="pb-3 text-right">Revenue</th>
              <th className="pb-3 text-right">Cost</th>
              <th className="pb-3 text-right">Profit</th>
              <th className="pb-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {bills.map(b => {
              const rev = b.total;
              const cost = b.total_cost || 0;
              const profit = rev - cost;
              return (
                <tr key={b.id}>
                  <td className="py-3 font-semibold text-orange-600 dark:text-orange-400">{b.id}</td>
                  <td className="py-3">{b.customer_name}</td>
                  <td className="py-3 text-right">₹{rev}</td>
                  <td className="py-3 text-right">₹{cost}</td>
                  <td className="py-3 text-right font-bold text-emerald-500">₹{profit.toFixed(2)}</td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => handleDeleteBill(b.id)}
                      className="px-3 py-1 text-xs font-medium bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 

// --- RESTOCKING & SALES ANALYTICS VIEW (Admin Only) ---
function AnalyticsView({ token }) {
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setForecast(data.restockingForecast);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Next Year Planning & Restocking Forecast</h2>
        <p className="text-sm text-slate-500">Total units sold per product over the season to guide wholesale re-orders for next year.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">
              <th className="p-4">Firecracker Product</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Total Units Sold This Season</th>
              <th className="p-4 text-right">Total Revenue Generated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            {forecast.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-slate-400">No sales data recorded yet for restocking forecasts.</td>
              </tr>
            ) : (
              forecast.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                  <td className="p-4 font-semibold">{item.name}</td>
                  <td className="p-4"><span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">{item.category}</span></td>
                  <td className="p-4 text-right font-bold text-base">{item.unitsSold} units</td>
                  <td className="p-4 text-right">₹{item.revenue.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- WORKER MANAGEMENT VIEW (Admin Only) ---

function WorkersView({ token }) {
  const [workers, setWorkers] = useState([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Get all users
  const fetchWorkers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setWorkers(await res.json());
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to load workers');
      }
    } catch (error) {
      console.error(error);
      alert('Server connection failed');
    }
  };

  // Create worker
  const handleCreateWorker = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      if (res.ok) {
        setName('');
        setEmail('');
        setPassword('');

        await fetchWorkers();

        alert('Worker account created successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create worker');
      }
    } catch (error) {
      console.error(error);
      alert('Server connection failed');
    }
  };

  // Remove worker
  const handleRemoveWorker = async (workerId, workerName) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove worker "${workerName}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/users/${workerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await fetchWorkers();
        alert('Worker removed successfully!');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to remove worker');
      }
    } catch (error) {
      console.error(error);
      alert('Server connection failed');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* CREATE WORKER */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">

        <h3 className="font-bold text-base mb-4">
          Create New Staff Account
        </h3>

        <form onSubmit={handleCreateWorker} className="space-y-4">

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Full Name
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Role is intentionally removed.
              Backend will always create a worker. */}

          <button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-xl transition shadow-lg shadow-orange-600/30"
          >
            Create Worker
          </button>

        </form>
      </div>


      {/* WORKER LIST */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">

        <div className="flex items-center justify-between mb-4">

          <h3 className="font-bold text-base">
            Authorized Staff & Workers
          </h3>

          <button
            onClick={fetchWorkers}
            className="text-sm px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            Refresh
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-left border-collapse">

            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase">

                <th className="pb-3">Name</th>

                <th className="pb-3">Email</th>

                <th className="pb-3">Role</th>

                <th className="pb-3 text-right">Action</th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">

              {workers.map(w => (

                <tr key={w.id}>

                  <td className="py-3 font-semibold">
                    {w.name}
                  </td>

                  <td className="py-3 text-slate-500">
                    {w.email}
                  </td>

                  <td className="py-3">

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        w.role === 'admin'
                          ? 'bg-orange-500/10 text-orange-600'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {w.role}
                    </span>

                  </td>

                  <td className="py-3 text-right">

                    {w.role === 'worker' ? (

                      <button
                        onClick={() =>
                          handleRemoveWorker(w.id, w.name)
                        }
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition"
                      >
                        Remove
                      </button>

                    ) : (

                      <span className="text-xs text-slate-400">
                        Protected
                      </span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

        {workers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No users found.
          </div>
        )}

      </div>

    </div>
  );
}