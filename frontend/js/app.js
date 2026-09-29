// API Base URL
const API_BASE = 'http://localhost:3000/api';

// State
let currentUser = null;
let cart = [];
let allProducts = [];

// DOM Elements
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const currentUserSpan = document.getElementById('current-user');
const logoutBtn = document.getElementById('logout-btn');
const navButtons = document.querySelectorAll('nav button');
const sections = document.querySelectorAll('.section');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkSession();
});

function setupEventListeners() {
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sectionId = btn.dataset.section;
      navigateToSection(sectionId);
    });
  });

  // Dashboard
  document.getElementById('refresh-dashboard')?.addEventListener('click', loadDashboard);

  // Products
  document.getElementById('add-product-btn')?.addEventListener('click', openAddProductModal);
  document.getElementById('save-product-btn')?.addEventListener('click', saveProduct);
  document.getElementById('close-product-modal')?.addEventListener('click', closeProductModal);

  // Sales
  document.getElementById('search-product')?.addEventListener('input', searchProducts);
  document.getElementById('add-to-cart-btn')?.addEventListener('click', addToCart);
  document.getElementById('complete-sale-btn')?.addEventListener('click', completeSale);
  document.getElementById('refresh-sales-history')?.addEventListener('click', loadSalesHistory);

  // Close modals
  document.querySelectorAll('.close-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.remove('active');
    });
  });
}

// Auth
function handleLogin(e) {
  e.preventDefault();
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    showAlert('Please enter username and password', 'error');
    return;
  }

  fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        currentUser = data.user;
        sessionStorage.setItem('user', JSON.stringify(currentUser));
        showApp();
        showAlert(`Welcome, ${currentUser.username}!`, 'success');
      } else {
        showAlert(data.error || 'Login failed', 'error');
      }
    })
    .catch((err) => {
      console.error('Login error:', err);
      showAlert('Login error: ' + err.message, 'error');
    });
}

function handleLogout() {
  currentUser = null;
  sessionStorage.removeItem('user');
  cart = [];
  showLogin();
  usernameInput.value = '';
  passwordInput.value = '';
}

function checkSession() {
  const savedUser = sessionStorage.getItem('user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.style.display = 'flex';
  appSection.style.display = 'none';
}

function showApp() {
  loginSection.style.display = 'none';
  appSection.style.display = 'block';
  currentUserSpan.textContent = `${currentUser.username} (${currentUser.role})`;
  navigateToSection('dashboard');
}

// Navigation
function navigateToSection(sectionId) {
  sections.forEach((section) => {
    section.classList.remove('active');
  });

  navButtons.forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.section === sectionId) {
      btn.classList.add('active');
    }
  });

  const section = document.getElementById(`${sectionId}-section`);
  if (section) {
    section.classList.add('active');

    if (sectionId === 'dashboard') {
      loadDashboard();
    } else if (sectionId === 'products') {
      loadProducts();
    } else if (sectionId === 'sales') {
      loadAllProducts();
      clearCart();
    } else if (sectionId === 'history') {
      loadSalesHistory();
    }
  }
}

// Dashboard
function loadDashboard() {
  fetch(`${API_BASE}/dashboard/today`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById('today-sales').textContent = data.sale_count || 0;
      document.getElementById('today-total').textContent = (data.total_sales || 0).toLocaleString();
      
      const stockHtml = (data.products || [])
        .map(
          (p) =>
            `<tr>
              <td>${p.name}</td>
              <td>${p.quantity}</td>
            </tr>`
        )
        .join('');
      document.getElementById('stock-table').innerHTML = stockHtml || '<tr><td colspan="2">No products</td></tr>';
    })
    .catch((err) => {
      console.error('Dashboard error:', err);
      showAlert('Failed to load dashboard', 'error');
    });
}

// Products
function loadProducts() {
  fetch(`${API_BASE}/products`)
    .then((res) => res.json())
    .then((products) => {
      const html = (products || [])
        .map(
          (p) =>
            `<tr>
              <td>${p.name}</td>
              <td>${p.price.toLocaleString()}</td>
              <td>${p.quantity}</td>
              <td>
                <button class="btn" onclick="editProduct(${p.id})">Edit</button>
              </td>
            </tr>`
        )
        .join('');
      document.getElementById('products-table').innerHTML = html || '<tr><td colspan="4">No products</td></tr>';
    })
    .catch((err) => {
      console.error('Products error:', err);
      showAlert('Failed to load products', 'error');
    });
}

function openAddProductModal() {
  document.getElementById('product-id').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-quantity').value = '';
  document.getElementById('product-modal-title').textContent = 'Add Product';
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

function editProduct(id) {
  fetch(`${API_BASE}/products/${id}`)
    .then((res) => res.json())
    .then((product) => {
      document.getElementById('product-id').value = product.id;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-quantity').value = product.quantity;
      document.getElementById('product-modal-title').textContent = 'Edit Product';
      document.getElementById('product-modal').classList.add('active');
    })
    .catch((err) => {
      console.error('Error loading product:', err);
      showAlert('Failed to load product', 'error');
    });
}

function saveProduct() {
  const id = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = parseFloat(document.getElementById('product-price').value);
  const quantity = parseInt(document.getElementById('product-quantity').value);

  if (!name || !price || quantity === undefined) {
    showAlert('Please fill in all fields', 'error');
    return;
  }

  const method = id ? 'PUT' : 'POST';
  const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, price, quantity })
  })
    .then((res) => res.json())
    .then(() => {
      showAlert(id ? 'Product updated' : 'Product added', 'success');
      closeProductModal();
      loadProducts();
    })
    .catch((err) => {
      console.error('Error saving product:', err);
      showAlert('Failed to save product', 'error');
    });
}

// Sales/Checkout
function loadAllProducts() {
  fetch(`${API_BASE}/products`)
    .then((res) => res.json())
    .then((products) => {
      allProducts = products || [];
    })
    .catch((err) => {
      console.error('Error loading products:', err);
      showAlert('Failed to load products', 'error');
    });
}

function searchProducts() {
  const search = document.getElementById('search-product').value.toLowerCase().trim();
  const resultsDiv = document.getElementById('search-results');

  if (!search) {
    resultsDiv.classList.remove('active');
    return;
  }

  const results = allProducts.filter(
    (p) => p.name.toLowerCase().includes(search) && p.quantity > 0
  );

  if (results.length === 0) {
    resultsDiv.classList.remove('active');
    return;
  }

  const html = results
    .map(
      (p) =>
        `<div class="search-result-item" onclick="selectProduct(${p.id}, '${p.name}', ${p.price})">
          <strong>${p.name}</strong> - ${p.price.toLocaleString()} (Stock: ${p.quantity})
        </div>`
    )
    .join('');

  resultsDiv.innerHTML = html;
  resultsDiv.classList.add('active');
}

function selectProduct(id, name, price) {
  document.getElementById('selected-product-id').value = id;
  document.getElementById('selected-product-name').value = name;
  document.getElementById('selected-product-price').value = price;
  document.getElementById('search-product').value = '';
  document.getElementById('search-results').classList.remove('active');
  document.getElementById('product-quantity').value = 1;
}

function addToCart() {
  const productId = parseInt(document.getElementById('selected-product-id').value);
  const productName = document.getElementById('selected-product-name').value.trim();
  const price = parseFloat(document.getElementById('selected-product-price').value);
  const quantity = parseInt(document.getElementById('product-quantity').value);

  if (!productId || !productName || !price || !quantity) {
    showAlert('Please select a product and quantity', 'error');
    return;
  }

  const product = allProducts.find((p) => p.id === productId);
  if (!product || product.quantity < quantity) {
    showAlert('Insufficient stock', 'error');
    return;
  }

  const existingItem = cart.find((item) => item.product_id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.subtotal = existingItem.quantity * existingItem.price;
  } else {
    cart.push({ product_id: productId, name: productName, price, quantity, subtotal: quantity * price });
  }

  updateCartDisplay();
  document.getElementById('selected-product-id').value = '';
  document.getElementById('selected-product-name').value = '';
  document.getElementById('selected-product-price').value = '';
  document.getElementById('product-quantity').value = 1;
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function updateQuantity(index, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(index);
    return;
  }

  const product = allProducts.find((p) => p.id === cart[index].product_id);
  if (!product || product.quantity < newQuantity) {
    showAlert('Insufficient stock for this quantity', 'error');
    return;
  }

  cart[index].quantity = newQuantity;
  cart[index].subtotal = newQuantity * cart[index].price;
  updateCartDisplay();
}

function updateCartDisplay() {
  const cartItemsDiv = document.getElementById('cart-items');

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = '<div class="empty-state"><p>Cart is empty</p></div>';
    document.getElementById('total-amount').textContent = '0';
    document.getElementById('amount-paid').value = '';
    document.getElementById('change').textContent = '0';
    return;
  }

  const html = `
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Subtotal</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${cart
          .map(
            (item, index) =>
              `<tr>
              <td>${item.name}</td>
              <td>${item.price.toLocaleString()}</td>
              <td>
                <div class="quantity-control">
                  <button onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                  <input type="number" value="${item.quantity}" min="1" 
                    onchange="updateQuantity(${index}, parseInt(this.value))" readonly>
                  <button onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                </div>
              </td>
              <td>${item.subtotal.toLocaleString()}</td>
              <td><button class="btn btn-danger" onclick="removeFromCart(${index})">Remove</button></td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

  cartItemsDiv.innerHTML = html;

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  document.getElementById('total-amount').textContent = totalAmount.toLocaleString();

  document.getElementById('amount-paid').addEventListener('input', updateChange);
}

function updateChange() {
  const totalAmount = parseFloat(document.getElementById('total-amount').textContent) || 0;
  const amountPaid = parseFloat(document.getElementById('amount-paid').value) || 0;
  const change = amountPaid - totalAmount;
  document.getElementById('change').textContent = (change >= 0 ? change : 0).toLocaleString();
}

function completeSale() {
  if (cart.length === 0) {
    showAlert('Cart is empty', 'error');
    return;
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const amountPaid = parseFloat(document.getElementById('amount-paid').value);

  if (!amountPaid || amountPaid < totalAmount) {
    showAlert('Amount paid must be at least the total amount', 'error');
    return;
  }

  const saleData = {
    user_id: currentUser.id,
    items: cart,
    total_amount: totalAmount,
    amount_paid: amountPaid
  };

  fetch(`${API_BASE}/sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData)
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.id) {
        showAlert('Sale completed successfully!', 'success');
        clearCart();
        loadAllProducts();
      } else {
        showAlert(data.error || 'Failed to complete sale', 'error');
      }
    })
    .catch((err) => {
      console.error('Sale error:', err);
      showAlert('Failed to complete sale: ' + err.message, 'error');
    });
}

function clearCart() {
  cart = [];
  updateCartDisplay();
}

// Sales History
function loadSalesHistory() {
  fetch(`${API_BASE}/sales`)
    .then((res) => res.json())
    .then((sales) => {
      const html = (sales || [])
        .map(
          (sale) =>
            `<tr>
              <td>${new Date(sale.created_at).toLocaleString()}</td>
              <td>${sale.username}</td>
              <td>${sale.total_amount.toLocaleString()}</td>
              <td>
                <button class="btn" onclick="viewSaleDetails(${sale.id})">View</button>
              </td>
            </tr>`
        )
        .join('');
      document.getElementById('sales-history-table').innerHTML = html || '<tr><td colspan="4">No sales</td></tr>';
    })
    .catch((err) => {
      console.error('Sales history error:', err);
      showAlert('Failed to load sales history', 'error');
    });
}

function viewSaleDetails(saleId) {
  fetch(`${API_BASE}/sales/details/${saleId}`)
    .then((res) => res.json())
    .then((data) => {
      const itemsHtml = (data.items || [])
        .map(
          (item) =>
            `<tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>${item.price.toLocaleString()}</td>
              <td>${item.subtotal.toLocaleString()}</td>
            </tr>`
        )
        .join('');

      const detailsHtml = `
        <div class="modal-header">
          <h2>Sale Details</h2>
          <button class="close-btn" onclick="closeSaleDetailsModal()">&times;</button>
        </div>
        <p><strong>Date:</strong> ${new Date(data.sale.created_at).toLocaleString()}</p>
        <p><strong>Cashier:</strong> ${data.sale.username}</p>
        <p><strong>Total:</strong> ${data.sale.total_amount.toLocaleString()}</p>
        <p><strong>Paid:</strong> ${data.sale.amount_paid.toLocaleString()}</p>
        <p><strong>Change:</strong> ${data.sale.change.toLocaleString()}</p>
        <h3 style="margin-top: 20px;">Items</h3>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      `;

      document.getElementById('sale-details-content').innerHTML = detailsHtml;
      document.getElementById('sale-details-modal').classList.add('active');
    })
    .catch((err) => {
      console.error('Error loading sale details:', err);
      showAlert('Failed to load sale details', 'error');
    });
}

function closeSaleDetailsModal() {
  document.getElementById('sale-details-modal').classList.remove('active');
}

// Utilities
function showAlert(message, type = 'info') {
  const alertsDiv = document.getElementById('alerts');
  const alertEl = document.createElement('div');
  alertEl.className = `alert alert-${type}`;
  alertEl.textContent = message;
  alertsDiv.appendChild(alertEl);

  setTimeout(() => {
    alertEl.remove();
  }, 4000);
}
