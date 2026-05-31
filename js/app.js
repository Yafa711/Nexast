window.addEventListener('load', function() {
  DB.init();
  var u = DB.getCurrentUser();
  if (u) showMainApp(u);
  else showScreen('login-screen');
});

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  window.scrollTo(0, 0);
}

function showMainApp(u) {
  showScreen('main-app');
  document.getElementById('app-header').innerHTML = '<div class="header-logo">🛍️ <span>Nexa</span>Shop</div><div class="header-actions"><button class="icon-btn" onclick="showTab(\'cart\')">🛒<span class="badge" id="cart-badge">0</span></button><button class="icon-btn" onclick="showTab(\'profile\')">👤</button></div>';
  showTab('home');
  updateCartBadge();
}

function showTab(tab) {
  document.querySelectorAll('.tab-page').forEach(function(p) { p.style.display = 'none'; });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var p = document.getElementById('page-' + tab);
  if (p) p.style.display = 'block';
  var n = document.querySelector('[data-tab="' + tab + '"]');
  if (n) n.classList.add('active');
  if (tab === 'home') renderHome();
  if (tab === 'shop') renderShop();
  if (tab === 'cart') renderCart();
  if (tab === 'profile') renderProfile();
  if (tab === 'local') renderLocal();
}

function handleLogin() {
  var email = document.getElementById('login-email').value.trim();
  var pw = document.getElementById('login-password').value;
  var err = document.getElementById('login-error');
  if (!email || !pw) { err.textContent = '❌ يرجى تعبئة جميع الحقول'; return; }
  var u = DB.getUsers().find(function(x) { return x.email === email && x.password === pw; });
  if (!u) { err.textContent = '❌ البريد أو كلمة المرور غير صحيحة'; return; }
  DB.setCurrentUser(u);
  showMainApp(u);
}

function handleRegister() {
  var name = document.getElementById('reg-name').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var pw = document.getElementById('reg-password').value;
  var cf = document.getElementById('reg-confirm').value;
  var err = document.getElementById('register-error');
  if (!name || !email || !pw || !cf) { err.textContent = '❌ يرجى تعبئة جميع الحقول'; return; }
  if (pw !== cf) { err.textContent = '❌ كلمتا المرور غير متطابقتين'; return; }
  if (pw.length < 6) { err.textContent = '❌ كلمة المرور 6 أحرف على الأقل'; return; }
  var us = DB.getUsers();
  if (us.find(function(x) { return x.email === email; })) { err.textContent = '❌ البريد مسجل مسبقاً'; return; }
  var nu = { id: 'user_' + Date.now(), email: email, password: pw, name: name, role: 'user', avatar: '👤' };
  us.push(nu);
  DB.saveUsers(us);
  DB.setCurrentUser(nu);
  showMainApp(nu);
}

function goToRegister() { showScreen('register-screen'); }
function goToLogin() { showScreen('login-screen'); }
function doLogout() { DB.logout(); showScreen('login-screen'); }

function renderHome() {
  var ps = DB.getProducts();
  var cats = [];
  ps.forEach(function(p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
  document.getElementById('page-home').innerHTML = '<div class="page-content"><div class="hero-banner"><h2>مرحباً بك في NexaShop 🎉</h2><p>أفضل المنتجات بأسعار لا تُقاوم</p><button class="btn btn-gold" style="width:auto;padding:10px 20px;font-size:13px" onclick="showTab(\'shop\')">تسوق الآن</button></div><div class="section-header"><h3>الفئات</h3></div><div class="categories-scroll">' + cats.map(function(c) { return '<button class="cat-chip" onclick="filterShop(\'' + c + '\')">' + c + '</button>'; }).join('') + '</div><div class="section-header"><h3>منتجات مميزة</h3><a onclick="showTab(\'shop\')">عرض الكل</a></div><div class="products-grid">' + ps.slice(0, 4).map(productCard).join('') + '</div></div>';
}

var currentFilter = 'الكل';
function filterShop(f) { currentFilter = f; renderShop(); }

function renderShop() {
  var all = DB.getProducts();
  var cats = ['الكل'];
  all.forEach(function(p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
  var ps = currentFilter === 'الكل' ? all : all.filter(function(p) { return p.category === currentFilter; });
  document.getElementById('page-shop').innerHTML = '<div class="page-content"><div class="search-bar"><span>🔍</span><input type="text" placeholder="ابحث عن منتج..." oninput="searchProducts(this.value)"></div><div class="categories-scroll">' + cats.map(function(c) { return '<button class="cat-chip ' + (currentFilter === c ? 'active' : '') + '" onclick="filterShop(\'' + c + '\')">' + c + '</button>'; }).join('') + '</div><div class="products-grid" id="products-grid">' + ps.map(productCard).join('') + '</div></div>';
}

function searchProducts(q) {
  var all = DB.getProducts();
  var ps = q ? all.filter(function(p) { return p.name.indexOf(q) >= 0 || p.description.indexOf(q) >= 0; }) : all;
  var el = document.getElementById('products-grid');
  if (el) el.innerHTML = ps.map(productCard).join('');
}

function productCard(p) {
  return '<div class="product-card" onclick="showProduct(\'' + p.id + '\')"><img class="product-img" src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/300x160?text=صورة\'"><div class="product-info"><div class="product-category">' + p.category + '</div><div class="product-name">' + p.name + '</div><div class="product-rating">⭐⭐⭐⭐ (' + p.rating + ')</div><div class="product-price"><span class="price-current">' + p.price + ' ر.س</span>' + (p.oldPrice ? '<span class="price-old">' + p.oldPrice + ' ر.س</span>' : '') + '</div></div></div>';
}

function showProduct(id) {
  var p = DB.getProducts().find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('page-product').innerHTML = '<div class="page-header"><button class="back-btn" onclick="goBack()">← رجوع</button><h2>' + p.name + '</h2></div><img class="product-detail-img" src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/400x280\'"><div class="product-detail-content"><div class="product-category">' + p.category + '</div><div class="product-detail-name">' + p.name + '</div><div class="product-rating">⭐⭐⭐⭐ ' + p.rating + ' · ' + p.sales + ' مبيعة</div><div style="display:flex;align-items:center;gap:12px;margin-top:8px"><div class="product-detail-price">' + p.price + ' ر.س</div>' + (p.oldPrice ? '<span style="color:#999;text-decoration:line-through">' + p.oldPrice + ' ر.س</span>' : '') + '</div><div class="product-detail-desc">' + p.description + '</div><div class="detail-actions"><button class="btn btn-primary" onclick="addToCart(\'' + p.id + '\')">🛒 أضف للسلة</button><button class="btn btn-outline" onclick="buyNow(\'' + p.id + '\')">⚡ اشتري الآن</button></div></div>';
  showScreen('product-screen');
}

function goBack() { showScreen('main-app'); }

function renderCart() {
  var cart = DB.getCart();
  var ps = DB.getProducts();
  if (!cart.length) {
    document.getElementById('page-cart').innerHTML = '<div class="page-content"><div class="empty-state"><div class="icon">🛒</div><h3>السلة فارغة</h3><p>أضف بعض المنتجات للبدء</p><button class="btn btn-primary" style="width:auto;margin-top:16px" onclick="showTab(\'shop\')">تصفح المنتجات</button></div></div>';
    return;
  }
  var total = 0;
  var items = cart.map(function(item) {
    var p = ps.find(function(x) { return x.id === item.id; });
    if (!p) return '';
    total += p.price * item.qty;
    return '<div class="cart-item"><img class="cart-item-img" src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/70\'"><div class="cart-item-info"><div class="cart-item-name">' + p.name + '</div><div class="cart-item-price">' + p.price + ' ر.س</div><div class="qty-control"><button class="qty-btn" onclick="changeQty(\'' + p.id + '\',-1)">−</button><span class="qty-num">' + item.qty + '</span><button class="qty-btn" onclick="changeQty(\'' + p.id + '\',1)">+</button></div></div><button class="cart-remove" onclick="removeFromCart(\'' + p.id + '\')">🗑️</button></div>';
  }).join('');
  document.getElementById('page-cart').innerHTML = '<div class="page-content"><div class="section-header"><h3>سلة التسوق (' + cart.length + ')</h3></div>' + items + '<div class="cart-summary"><div class="summary-row"><span>المجموع</span><span>' + total + ' ر.س</span></div><div class="summary-row"><span>الشحن</span><span style="color:var(--success)">مجاني</span></div><div class="summary-row summary-total"><span>الإجمالي</span><span>' + total + ' ر.س</span></div><button class="btn btn-primary" style="margin-top:12px" onclick="showCheckout(' + total + ')">متابعة الدفع ←</button></div></div>';
}

function addToCart(id) {
  var cart = DB.getCart();
  var ex = cart.find(function(x) { return x.id === id; });
  if (ex) ex.qty++; else cart.push({ id: id, qty: 1 });
  DB.saveCart(cart);
  updateCartBadge();
  showToast('✅ تم إضافة المنتج للسلة');
}

function buyNow(id) { addToCart(id); showScreen('main-app'); showTab('cart'); }

function removeFromCart(id) {
  DB.saveCart(DB.getCart().filter(function(x) { return x.id !== id; }));
  updateCartBadge(); renderCart();
}

function changeQty(id, d) {
  var cart = DB.getCart();
  var item = cart.find(function(x) { return x.id === id; });
  if (item) { item.qty += d; if (item.qty <= 0) DB.saveCart(cart.filter(function(x) { return x.id !== id; })); else DB.saveCart(cart); }
  updateCartBadge(); renderCart();
}

function updateCartBadge() {
  var t = DB.getCart().reduce(function(s, i) { return s + i.qty; }, 0);
  var b = document.getElementById('cart-badge');
  if (b) b.textContent = t;
}

function showCheckout(total) {
  var ms = DB.getPayments().filter(function(m) { return m.enabled; });
  document.getElementById('checkout-modal-body').innerHTML = '<div class="modal-header"><h3>إتمام الطلب 💳</h3><button class="modal-close" onclick="closeModal(\'checkout-modal\')">✕</button></div><div class="form-group"><label>الاسم الكامل</label><input type="text" id="co-name" placeholder="اسمك الكامل"></div><div class="form-group"><label>رقم الهاتف</label><input type="text" id="co-phone" placeholder="05xxxxxxxx"></div><div class="form-group"><label>العنوان</label><input type="text" id="co-addr" placeholder="المدينة، الحي، الشارع"></div><div class="section-header" style="margin-top:16px"><h3>طريقة الدفع</h3></div><div id="pay-list">' + ms.map(function(m, i) { return '<div class="payment-item ' + (i === 0 ? 'selected' : '') + '" onclick="selPay(this)"><span class="payment-icon">' + m.icon + '</span><div class="payment-info"><div class="payment-name">' + m.name + '</div><div class="payment-desc">' + m.description + '</div></div></div>'; }).join('') + '</div><div style="background:#f8f9fa;border-radius:12px;padding:14px;margin:16px 0;text-align:center"><div style="font-size:13px;color:#636e72">الإجمالي</div><div style="font-size:24px;font-weight:900;color:var(--accent)">' + total + ' ر.س</div></div><button class="btn btn-primary" onclick="placeOrder(' + total + ')">تأكيد الطلب ✓</button>';
  openModal('checkout-modal');
}

function selPay(el) {
  document.querySelectorAll('.payment-item').forEach(function(i) { i.classList.remove('selected'); });
  el.classList.add('selected');
}

function placeOrder(total) {
  var name = document.getElementById('co-name').value;
  var phone = document.getElementById('co-phone').value;
  var addr = document.getElementById('co-addr').value;
  if (!name || !phone || !addr) { showToast('❌ يرجى تعبئة جميع الحقول'); return; }
  var u = DB.getCurrentUser();
  var orders = DB.getOrders();
  var sel = document.querySelector('.payment-item.selected');
  orders.push({ id: 'ORD-' + Date.now(), userId: u ? u.id : '', userName: name, phone: phone, address: addr, items: DB.getCart(), total: total, paymentMethod: sel ? sel.querySelector('.payment-name').textContent : 'غير محدد', status: 'قيد المعالجة', date: new Date().toLocaleDateString('ar-SA') });
  DB.saveOrders(orders);
  DB.saveCart([]);
  updateCartBadge();
  closeModal('checkout-modal');
  showToast('🎉 تم تأكيد طلبك بنجاح!');
  setTimeout(function() { renderCart(); }, 500);
}

function renderLocal() {
  var ps = DB.getProducts().filter(function(p) { return p.category === 'ملابس محلية'; });
  document.getElementById('page-local').innerHTML = '<div class="page-content"><div class="hero-banner" style="background:linear-gradient(135deg,#2c1810,#8B4513)"><h2>الملابس المحلية التراثية 🌟</h2><p>أصيلة من قلب التراث العربي</p></div><div class="section-header"><h3>المجموعة التراثية</h3></div>' + (ps.length ? '<div class="products-grid">' + ps.map(productCard).join('') + '</div>' : '<div class="empty-state"><div class="icon">👘</div><h3>لا توجد منتجات بعد</h3></div>') + '</div>';
}

function renderProfile() {
  var u = DB.getCurrentUser();
  var isSA = u && u.role === 'superadmin';
  var isA = u && (u.role === 'admin' || u.role === 'superadmin');
  document.getElementById('page-profile').innerHTML = '<div class="profile-header"><div class="profile-avatar">' + (u ? u.avatar : '👤') + '</div><div class="profile-name">' + (u ? u.name : '') + '</div><div class="profile-role">' + (u ? u.email : '') + '</div></div><div class="profile-body"><div class="menu-card"><div class="menu-item" onclick="showMyOrders()"><span class="menu-icon">📦</span><span class="menu-label">طلباتي</span><span class="menu-arrow">←</span></div><div class="menu-item" onclick="showPaymentPage()"><span class="menu-icon">💳</span><span class="menu-label">طرق الدفع</span><span class="menu-arrow">←</span></div></div>' + (isA ? '<div class="menu-card"><div style="padding:12px 16px;font-size:12px;color:var(--text-light);font-weight:700">لوحة الإدارة</div>' + (isSA ? '<div class="menu-item" onclick="showDashboard()"><span class="menu-icon">📊</span><span class="menu-label">لوحة المعلومات</span><span class="menu-arrow">←</span></div><div class="menu-item" onclick="showUsers()"><span class="menu-icon">👥</span><span class="menu-label">إدارة المستخدمين</span><span class="menu-arrow">←</span></div>' : '') + '<div class="menu-item" onclick="showAdminProducts()"><span class="menu-icon">🏪</span><span class="menu-label">إدارة المنتجات</span><span class="menu-arrow">←</span></div>' + (isSA ? '<div class="menu-item" onclick="showAdminPayments()"><span class="menu-icon">💵</span><span class="menu-label">إدارة طرق الدفع</span><span class="menu-arrow">←</span></div>' : '') + '<div class="menu-item" onclick="showAdminOrders()"><span class="menu-icon">📋</span><span class="menu-label">إدارة الطلبات</span><span class="menu-arrow">←</span></div></div>' : '') + '<div class="menu-card"><div class="menu-item" onclick="doLogout()" style="color:#e74c3c"><span class="menu-icon">🚪</span><span class="menu-label" style="color:#e74c3c">تسجيل الخروج</span><span class="menu-arrow">←</span></div></div></div>';
}

function showMyOrders() {
  var u = DB.getCurrentUser();
  var orders = DB.getOrders().filter(function(o) { return o.userId === u.id; });
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>طلباتي</h2></div><div class="page-content">' + (orders.length ? orders.map(function(o) { return '<div class="admin-section"><div style="display:flex;justify-content:space-between"><div><div style="font-weight:700">' + o.id + '</div><div style="font-size:12px;color:var(--text-light)">' + o.date + '</div></div><span style="background:#d5f5e3;color:#00b894;padding:4px 10px;border-radius:20px;font-size:12px">' + o.status + '</span></div><div style="margin-top:8px;font-size:13px;color:var(--text-light)">' + o.paymentMethod + ' · ' + o.total + ' ر.س</div></div>'; }).join('') : '<div class="empty-state"><div class="icon">📦</div><h3>لا توجد طلبات</h3></div>') + '</div>';
  showScreen('admin-screen');
}

function showPaymentPage() {
  var ms = DB.getPayments().filter(function(m) { return m.enabled; });
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>طرق الدفع المتاحة</h2></div><div class="page-content">' + ms.map(function(m) { return '<div class="payment-item"><span class="payment-icon">' + m.icon + '</span><div class="payment-info"><div class="payment-name">' + m.name + '</div><div class="payment-desc">' + m.description + '</div></div></div>'; }).join('') + '</div>';
  showScreen('admin-screen');
}

function showDashboard() {
  var orders = DB.getOrders();
  var ps = DB.getProducts();
  var users = DB.getUsers().filter(function(u) { return u.role === 'user'; });
  var rev = orders.reduce(function(s, o) { return s + o.total; }, 0);
  var sales = ps.map(function(p) { return p.sales; });
  var maxS = sales.length ? Math.max.apply(null, sales) : 1;
  document.getElementById('admin-page').innerHTML = '<div class="admin-header"><h2>📊 لوحة المعلومات</h2><p>إحصائيات المتجر</p></div><div class="page-content"><div class="stats-grid"><div class="stat-card"><div class="stat-icon">💰</div><div class="stat-value">' + rev + '</div><div class="stat-label">الإيرادات (ر.س)</div></div><div class="stat-card"><div class="stat-icon">📦</div><div class="stat-value">' + orders.length + '</div><div class="stat-label">الطلبات</div></div><div class="stat-card"><div class="stat-icon">🛍️</div><div class="stat-value">' + ps.length + '</div><div class="stat-label">المنتجات</div></div><div class="stat-card"><div class="stat-icon">👥</div><div class="stat-value">' + users.length + '</div><div class="stat-label">المستخدمون</div></div></div><div class="admin-section"><div class="admin-section-header"><h3>أكثر المنتجات مبيعاً</h3></div>' + ps.slice().sort(function(a, b) { return b.sales - a.sales; }).slice(0, 5).map(function(p) { return '<div class="chart-bar-item"><div class="chart-bar-label"><span>' + p.name + '</span><span>' + p.sales + ' مبيعة</span></div><div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + Math.round((p.sales / maxS) * 100) + '%"></div></div></div>'; }).join('') + '</div><div class="admin-section"><div class="admin-section-header"><h3>آخر الطلبات</h3></div>' + (orders.length ? orders.slice(-5).reverse().map(function(o) { return '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)"><div><div style="font-weight:700;font-size:13px">' + o.id + '</div><div style="font-size:11px;color:var(--text-light)">' + o.userName + ' · ' + o.date + '</div></div><div style="font-weight:800;color:var(--accent)">' + o.total + ' ر.س</div></div>'; }).join('') : '<p style="padding:20px;text-align:center;color:var(--text-light)">لا توجد طلبات بعد</p>') + '</div><div style="padding:16px 0 80px"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button></div></div>';
  showScreen('admin-screen');
}

function showAdminProducts() { renderAPList(); showScreen('admin-screen'); }

function renderAPList() {
  var ps = DB.getProducts();
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>إدارة المنتجات</h2></div><div class="page-content"><button class="btn btn-primary" style="margin-bottom:16px" onclick="showAddP()">+ إضافة منتج</button>' + ps.map(function(p) { return '<div class="admin-product-item"><img class="admin-product-img" src="' + p.image + '" onerror="this.src=\'https://via.placeholder.com/56\'"><div class="admin-product-info"><div class="admin-product-name">' + p.name + '</div><div style="font-size:11px;color:var(--text-light)">' + p.category + ' · مخزون: ' + p.stock + '</div><div class="admin-product-price">' + p.price + ' ر.س</div></div><div class="admin-product-actions"><button class="btn btn-outline btn-sm" onclick="showEditP(\'' + p.id + '\')">✏️</button><button class="btn btn-danger btn-sm" onclick="delProduct(\'' + p.id + '\')">🗑️</button></div></div>'; }).join('') + '</div>';
}

function showAddP() {
  var cats = [];
  DB.getProducts().forEach(function(p) { if (cats.indexOf(p.category) === -1) cats.push(p.category); });
  document.getElementById('product-modal-body').innerHTML = '<div class="modal-header"><h3>إضافة منتج</h3><button class="modal-close" onclick="closeModal(\'product-modal\')">✕</button></div><div class="form-group"><label>الاسم</label><input id="pm-n" type="text"></div><div class="form-group"><label>الفئة</label><input id="pm-c" type="text" list="clist"><datalist id="clist">' + cats.map(function(c) { return '<option value="' + c + '">'; }).join('') + '<option value="ملابس محلية"></datalist></div><div class="form-group"><label>السعر (ر.س)</label><input id="pm-p" type="number"></div><div class="form-group"><label>السعر القديم</label><input id="pm-op" type="number"></div><div class="form-group"><label>المخزون</label><input id="pm-s" type="number" value="10"></div><div class="form-group"><label>رابط الصورة</label><input id="pm-i" type="url"></div><div class="form-group"><label>الوصف</label><textarea id="pm-d"></textarea></div><button class="btn btn-primary" onclick="saveNewP()">حفظ</button>';
  openModal('product-modal');
}

function saveNewP() {
  var n = document.getElementById('pm-n').value;
  var c = document.getElementById('pm-c').value;
  var p = parseFloat(document.getElementById('pm-p').value);
  if (!n || !c || !p) { showToast('❌ يرجى تعبئة الحقول الأساسية'); return; }
  var ps = DB.getProducts();
  ps.push({ id: 'p' + Date.now(), name: n, category: c, price: p, oldPrice: parseFloat(document.getElementById('pm-op').value) || null, stock: parseInt(document.getElementById('pm-s').value) || 10, image: document.getElementById('pm-i').value || 'https://via.placeholder.com/400x300?text=منتج', description: document.getElementById('pm-d').value, rating: 4.5, sales: 0 });
  DB.saveProducts(ps);
  closeModal('product-modal');
  renderAPList();
  showToast('✅ تم إضافة المنتج');
}

function showEditP(id) {
  var p = DB.getProducts().find(function(x) { return x.id === id; });
  if (!p) return;
  document.getElementById('product-modal-body').innerHTML = '<div class="modal-header"><h3>تعديل المنتج</h3><button class="modal-close" onclick="closeModal(\'product-modal\')">✕</button></div><div class="form-group"><label>الاسم</label><input id="pm-n" type="text" value="' + p.name + '"></div><div class="form-group"><label>الفئة</label><input id="pm-c" type="text" value="' + p.category + '"></div><div class="form-group"><label>السعر</label><input id="pm-p" type="number" value="' + p.price + '"></div><div class="form-group"><label>السعر القديم</label><input id="pm-op" type="number" value="' + (p.oldPrice || '') + '"></div><div class="form-group"><label>المخزون</label><input id="pm-s" type="number" value="' + p.stock + '"></div><div class="form-group"><label>رابط الصورة</label><input id="pm-i" type="url" value="' + p.image + '"></div><div class="form-group"><label>الوصف</label><textarea id="pm-d">' + p.description + '</textarea></div><button class="btn btn-primary" onclick="saveEditP(\'' + id + '\')">حفظ التعديلات</button>';
  openModal('product-modal');
}

function saveEditP(id) {
  var ps = DB.getProducts();
  var i = ps.findIndex(function(x) { return x.id === id; });
  if (i < 0) return;
  ps[i].name = document.getElementById('pm-n').value;
  ps[i].category = document.getElementById('pm-c').value;
  ps[i].price = parseFloat(document.getElementById('pm-p').value);
  ps[i].oldPrice = parseFloat(document.getElementById('pm-op').value) || null;
  ps[i].stock = parseInt(document.getElementById('pm-s').value);
  ps[i].image = document.getElementById('pm-i').value;
  ps[i].description = document.getElementById('pm-d').value;
  DB.saveProducts(ps);
  closeModal('product-modal');
  renderAPList();
  showToast('✅ تم التعديل');
}

function delProduct(id) {
  if (!confirm('حذف هذا المنتج؟')) return;
  DB.saveProducts(DB.getProducts().filter(function(p) { return p.id !== id; }));
  renderAPList();
  showToast('🗑️ تم الحذف');
}

function showAdminPayments() { renderPayList(); showScreen('admin-screen'); }

function renderPayList() {
  var ms = DB.getPayments();
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>إدارة طرق الدفع</h2></div><div class="page-content"><button class="btn btn-primary" style="margin-bottom:16px" onclick="showAddPay()">+ إضافة طريقة دفع</button>' + ms.map(function(m) { return '<div class="admin-section" style="margin-bottom:10px"><div style="display:flex;align-items:center;gap:12px"><span style="font-size:30px">' + m.icon + '</span><div style="flex:1"><div style="font-weight:700">' + m.name + '</div><div style="font-size:12px;color:var(--text-light)">' + m.description + '</div></div><div style="display:flex;align-items:center;gap:8px"><label class="toggle"><input type="checkbox" ' + (m.enabled ? 'checked' : '') + ' onchange="togglePay(\'' + m.id + '\',this.checked)"><span class="toggle-slider"></span></label><button class="btn btn-outline btn-sm" onclick="showEditPay(\'' + m.id + '\')">✏️</button><button class="btn btn-danger btn-sm" onclick="delPay(\'' + m.id + '\')">🗑️</button></div></div></div>'; }).join('') + '</div>';
}

function showAddPay() {
  document.getElementById('product-modal-body').innerHTML = '<div class="modal-header"><h3>إضافة طريقة دفع</h3><button class="modal-close" onclick="closeModal(\'product-modal\')">✕</button></div><div class="form-group"><label>الاسم</label><input id="py-n" type="text"></div><div class="form-group"><label>الأيقونة (إيموجي)</label><input id="py-i" type="text" maxlength="4" placeholder="💳"></div><div class="form-group"><label>الوصف / التعليمات</label><textarea id="py-d"></textarea></div><button class="btn btn-primary" onclick="saveNewPay()">إضافة</button>';
  openModal('product-modal');
}

function saveNewPay() {
  var n = document.getElementById('py-n').value;
  if (!n) { showToast('❌ أدخل الاسم'); return; }
  var ms = DB.getPayments();
  ms.push({ id: 'pm' + Date.now(), name: n, icon: document.getElementById('py-i').value || '💳', description: document.getElementById('py-d').value, enabled: true });
  DB.savePayments(ms);
  closeModal('product-modal');
  renderPayList();
  showToast('✅ تمت الإضافة');
}

function showEditPay(id) {
  var m = DB.getPayments().find(function(x) { return x.id === id; });
  if (!m) return;
  document.getElementById('product-modal-body').innerHTML = '<div class="modal-header"><h3>تعديل طريقة الدفع</h3><button class="modal-close" onclick="closeModal(\'product-modal\')">✕</button></div><div class="form-group"><label>الاسم</label><input id="py-n" type="text" value="' + m.name + '"></div><div class="form-group"><label>الأيقونة</label><input id="py-i" type="text" value="' + m.icon + '" maxlength="4"></div><div class="form-group"><label>الوصف</label><textarea id="py-d">' + m.description + '</textarea></div><button class="btn btn-primary" onclick="saveEditPay(\'' + id + '\')">حفظ</button>';
  openModal('product-modal');
}

function saveEditPay(id) {
  var ms = DB.getPayments();
  var i = ms.findIndex(function(x) { return x.id === id; });
  if (i < 0) return;
  ms[i].name = document.getElementById('py-n').value;
  ms[i].icon = document.getElementById('py-i').value;
  ms[i].description = document.getElementById('py-d').value;
  DB.savePayments(ms);
  closeModal('product-modal');
  renderPayList();
  showToast('✅ تم التعديل');
}

function togglePay(id, en) {
  var ms = DB.getPayments();
  var m = ms.find(function(x) { return x.id === id; });
  if (m) m.enabled = en;
  DB.savePayments(ms);
  showToast(en ? '✅ تم التفعيل' : '⛔ تم التعطيل');
}

function delPay(id) {
  if (!confirm('حذف طريقة الدفع؟')) return;
  DB.savePayments(DB.getPayments().filter(function(m) { return m.id !== id; }));
  renderPayList();
  showToast('🗑️ تم الحذف');
}

function showUsers() {
  var users = DB.getUsers();
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>إدارة المستخدمين</h2></div><div class="page-content"><div class="admin-section">' + users.map(function(u) { return '<div class="user-item"><span class="user-avatar">' + (u.avatar || '👤') + '</span><div class="user-info"><div class="user-name">' + u.name + '</div><div class="user-email">' + u.email + '</div></div><div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end"><span class="role-badge role-' + u.role + '">' + (u.role === 'superadmin' ? 'مدير عام' : u.role === 'admin' ? 'مدير' : 'مستخدم') + '</span>' + (u.role === 'user' ? '<button class="btn btn-gold btn-sm" onclick="promoteU(\'' + u.id + '\')">ترقية</button>' : '') + (u.role === 'admin' ? '<button class="btn btn-outline btn-sm" onclick="demoteU(\'' + u.id + '\')">إزالة صلاحيات</button>' : '') + '</div></div>'; }).join('') + '</div></div>';
  showScreen('admin-screen');
}

function promoteU(id) {
  var us = DB.getUsers();
  var u = us.find(function(x) { return x.id === id; });
  if (u) u.role = 'admin';
  DB.saveUsers(us);
  showUsers();
  showToast('✅ تم الترقية');
}

function demoteU(id) {
  var us = DB.getUsers();
  var u = us.find(function(x) { return x.id === id; });
  if (u) u.role = 'user';
  DB.saveUsers(us);
  showUsers();
  showToast('تم إزالة الصلاحيات');
}

function showAdminOrders() {
  var orders = DB.getOrders();
  document.getElementById('admin-page').innerHTML = '<div class="page-header"><button class="back-btn" onclick="showScreen(\'main-app\');showTab(\'profile\')">← رجوع</button><h2>إدارة الطلبات (' + orders.length + ')</h2></div><div class="page-content">' + (orders.length ? orders.slice().reverse().map(function(o) { return '<div class="admin-section" style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><div style="font-weight:800">' + o.id + '</div><select onchange="updateStatus(\'' + o.id + '\',this.value)" style="border:1px solid var(--border);border-radius:8px;padding:4px 8px;font-family:Tajawal,sans-serif;font-size:12px"><option ' + (o.status === 'قيد المعالجة' ? 'selected' : '') + '>قيد المعالجة</option><option ' + (o.status === 'تم الشحن' ? 'selected' : '') + '>تم الشحن</option><option ' + (o.status === 'تم التسليم' ? 'selected' : '') + '>تم التسليم</option><option ' + (o.status === 'ملغي' ? 'selected' : '') + '>ملغي</option></select></div><div style="font-size:13px">' + o.userName + ' · ' + o.phone + '</div><div style="font-size:13px">' + o.address + '</div><div style="font-size:15px;font-weight:800;color:var(--accent);margin-top:6px">' + o.total + ' ر.س · ' + o.date + '</div></div>'; }).join('') : '<div class="empty-state"><div class="icon">📋</div><h3>لا توجد طلبات</h3></div>') + '</div>';
  showScreen('admin-screen');
}

function updateStatus(id, s) {
  var os = DB.getOrders();
  var o = os.find(function(x) { return x.id === id; });
  if (o) o.status = s;
  DB.saveOrders(os);
  showToast('✅ تم تحديث الحالة');
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

function showToast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// حفظ الجلسة بشكل دائم
var _origSetCurrentUser = DB.setCurrentUser.bind(DB);
DB.setCurrentUser = function(u) {
  localStorage.setItem('nx_user_persist', JSON.stringify(u));
  sessionStorage.setItem('nx_user', JSON.stringify(u));
};
var _origGetCurrentUser = DB.getCurrentUser.bind(DB);
DB.getCurrentUser = function() {
  var u = sessionStorage.getItem('nx_user');
  if (!u || u === 'null') {
    u = localStorage.getItem('nx_user_persist');
    if (u && u !== 'null') sessionStorage.setItem('nx_user', u);
  }
  return u ? JSON.parse(u) : null;
};
var _origLogout = DB.logout.bind(DB);
DB.logout = function() {
  sessionStorage.removeItem('nx_user');
  localStorage.removeItem('nx_user_persist');
};
