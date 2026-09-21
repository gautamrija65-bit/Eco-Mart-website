// Simple Ecomart demo: client-side signup/login + cart using localStorage
(function(){
  const items = [
    {id:1,title:'Eco T-Shirt',price:19.99,src:'Images/Eco T-shirt.jpg',desc:'Comfortable organic cotton T-shirt.'},
    {id:2,title:'Reusable Bottle',price:14.5,src:'Images/Reusable Bottle.png',desc:'Stainless steel reusable bottle.'},
    {id:3,title:'Organic Soap Set',price:9.99,src:'Images/Organic Soap Set.jpg',desc:'Natural soap trio for sensitive skin.'},
    {id:4,title:'Bamboo Toothbrush',price:4.5,src:'Images/Bamboo Toothbrush.jpg',desc:'Biodegradable bamboo toothbrush.'},
    {id:5,title:'Recycled Notebook',price:7.25,src:'Images/Recycled Notebook.webp',desc:'Notebook made from recycled paper.'}
  ];
  
  // DOM refs
  const itemsEl = document.getElementById('items');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const welcome = document.getElementById('welcome');
  const authModal = document.getElementById('auth-modal');
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubmit = document.getElementById('auth-submit');
  const switchToSignup = document.getElementById('switch-to-signup');
  const authClose = document.getElementById('auth-close');
  const authMessage = document.getElementById('auth-message');
  const authUsername = document.getElementById('auth-username');
  const authPassword = document.getElementById('auth-password');

  const cartBtn = document.getElementById('btn-cart');
  const cartModal = document.getElementById('cart-modal');
  const cartClose = document.getElementById('cart-close');
  const cartItemsEl = document.getElementById('cart-items');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalItems = document.getElementById('cart-total-items');
  const cartTotalPrice = document.getElementById('cart-total-price');
  const checkoutBtn = document.getElementById('checkout-btn');
  const shopNow = document.getElementById('shop-now');
  const searchInput = document.getElementById('search');

  let authMode = 'login'; // or 'signup'

  function saveUsers(users){ localStorage.setItem('ecomart_users', JSON.stringify(users)); }
  function loadUsers(){ return JSON.parse(localStorage.getItem('ecomart_users')||'[]'); }
  function setCurrentUser(u){ localStorage.setItem('ecomart_currentUser', u); }
  function getCurrentUser(){ return localStorage.getItem('ecomart_currentUser'); }
  function userCartKey(user){ return 'cart_' + user; }

  function getFiltered(q){
    const ql = (q||'').trim().toLowerCase();
    if(!ql) return items.slice();
    return items.filter(i=> i.title.toLowerCase().includes(ql) || (i.desc||'').toLowerCase().includes(ql));
  }

  function attachItemHandlers(container){
    if(!container) return;
    container.querySelectorAll('button[data-id]').forEach(b=>{
      b.addEventListener('click', (e)=>{
        e.stopPropagation();
        const id = Number(b.getAttribute('data-id'));
        if(!getCurrentUser()){ openAuth('login'); authMessage.textContent='Please login or signup to add items.'; return; }
        addToCart(id);
      });
    });
    container.querySelectorAll('.card, .product-card').forEach(card=>{
      card.addEventListener('click', e=>{
        if(e.target.tagName.toLowerCase()==='button') return;
        const id = Number(card.getAttribute('data-id') || card.querySelector('button[data-id]')?.getAttribute('data-id'));
        if(!id) return;
        openProductModal(id);
      });
    });
  }

  function renderHomepage(query=''){
    const container = document.getElementById('items'); if(!container) return;
    const list = getFiltered(query).slice(0,5);
    container.innerHTML = '';
    list.forEach(it=>{
      const c = document.createElement('div'); c.className='card'; c.setAttribute('data-id', it.id);
      c.innerHTML = `<img src="${it.src}" alt="${it.title}"><h3>${it.title}</h3><div class="price">$${it.price.toFixed(2)}</div><button data-id="${it.id}">Add to cart</button>`;
      container.appendChild(c);
    });
    attachItemHandlers(container);
  }

  function renderProductsPage(query=''){
    const container = document.getElementById('products-list'); if(!container) return;
    const list = getFiltered(query);
    container.innerHTML = '';
    list.forEach(it=>{
      const d = document.createElement('div'); d.className='product-card'; d.setAttribute('data-id', it.id);
      d.innerHTML = `<img src="${it.src}" alt="${it.title}"><h3>${it.title}</h3><p>${it.desc}</p><div class="price">$${it.price.toFixed(2)}</div><button data-id="${it.id}">Add to cart</button>`;
      container.appendChild(d);
    });
    attachItemHandlers(container);
  }

  // Product modal functions
  const productModal = document.getElementById('product-modal');
  const productClose = document.getElementById('product-close');
  const productImg = document.getElementById('product-img');
  const productTitle = document.getElementById('product-title');
  const productPrice = document.getElementById('product-price');
  const productDesc = document.getElementById('product-desc');
  const productAdd = document.getElementById('product-add');
  let currentProductId = null;

  function openProductModal(id){
    const it = items.find(i=>i.id===id); if(!it) return;
    currentProductId = id;
    productImg.src = it.src; productImg.alt = it.title;
    productTitle.textContent = it.title; productPrice.textContent = '$' + it.price.toFixed(2);
    productDesc.textContent = it.desc || '';
    productModal.classList.remove('hidden');
  }
  function closeProductModal(){ productModal.classList.add('hidden'); currentProductId = null; }
  productClose.addEventListener('click', closeProductModal);
  productAdd.addEventListener('click', ()=>{
    if(!getCurrentUser()){ openAuth('login'); authMessage.textContent='Please login or signup to add items.'; return; }
    if(currentProductId) addToCart(currentProductId);
    closeProductModal();
  });

  function loadCart(){
    const user = getCurrentUser();
    if(!user) return [];
    return JSON.parse(localStorage.getItem(userCartKey(user))||'[]');
  }
  function saveCart(cart){ const user = getCurrentUser(); if(!user) return; localStorage.setItem(userCartKey(user), JSON.stringify(cart)); }

  function addToCart(itemId){
    const cart = loadCart();
    const found = cart.find(c=>c.id===itemId);
    if(found){ found.qty++; } else { cart.push({id:itemId,qty:1}); }
    saveCart(cart); renderCartCount();
    alert('Added to cart');
  }

  function renderCart(){
    const cart = loadCart();
    cartItemsEl.innerHTML='';
    let totalItems=0,totalPrice=0;
    cart.forEach(ci=>{
      const it = items.find(i=>i.id===ci.id);
      if(!it) return;
      totalItems += ci.qty;
      totalPrice += it.price * ci.qty;
      const div = document.createElement('div'); div.className='cart-item';
      div.innerHTML = `<img src="${it.src}" alt="${it.title}"><div><strong>${it.title}</strong><div>$${it.price.toFixed(2)} × ${ci.qty}</div></div><div class="cart-actions"><button data-id="${ci.id}" data-act="minus">-</button><button data-id="${ci.id}" data-act="plus">+</button><button data-id="${ci.id}" data-act="remove">Remove</button></div>`;
      cartItemsEl.appendChild(div);
    });
    cartTotalItems.textContent = totalItems;
    cartTotalPrice.textContent = totalPrice.toFixed(2);
    cartItemsEl.querySelectorAll('button[data-act]').forEach(b=>{
      b.addEventListener('click',()=>{
        const id = Number(b.getAttribute('data-id'));
        const act = b.getAttribute('data-act');
        const cart = loadCart();
        const idx = cart.findIndex(c=>c.id===id);
        if(idx===-1) return;
        if(act==='plus'){ cart[idx].qty++; }
        else if(act==='minus'){ cart[idx].qty--; if(cart[idx].qty<=0) cart.splice(idx,1); }
        else if(act==='remove'){ cart.splice(idx,1); }
        saveCart(cart); renderCart(); renderCartCount();
      });
    });
  }

  function renderCartCount(){
    const cart = loadCart();
    const count = cart.reduce((s,c)=>s+c.qty,0);
    cartCountEl.textContent = count;
  }

  function openAuth(mode='login'){
    authMode = mode;
    authTitle.textContent = mode==='login' ? 'Login' : 'Signup';
    authSubmit.textContent = mode==='login' ? 'Login' : 'Create account';
    authMessage.textContent = '';
    authModal.classList.remove('hidden');
    authUsername.focus();
  }

  function closeAuth(){ authModal.classList.add('hidden'); authForm.reset(); }

  function handleSignup(username,password){
    const users = loadUsers();
    if(users.find(u=>u.username===username)){ authMessage.textContent='Username taken'; return false; }
    users.push({username,password}); saveUsers(users); setCurrentUser(username); updateAuthUI(); return true;
  }

  function handleLogin(username,password){
    const users = loadUsers();
    const found = users.find(u=>u.username===username && u.password===password);
    if(!found){ authMessage.textContent='Invalid credentials'; return false; }
    setCurrentUser(username); updateAuthUI(); return true;
  }

  function updateAuthUI(){
    const user = getCurrentUser();
    if(user){ welcome.textContent = 'Hello, ' + user; welcome.classList.remove('hidden'); btnLogin.classList.add('hidden'); btnLogout.classList.remove('hidden'); } else { welcome.classList.add('hidden'); btnLogin.classList.remove('hidden'); btnLogout.classList.add('hidden'); }
    renderCartCount();
  }

  // Events
  btnLogin.addEventListener('click',()=> openAuth('login'));
  switchToSignup.addEventListener('click',()=> openAuth(authMode==='login'?'signup':'login'));
  authClose.addEventListener('click',closeAuth);
  authForm.addEventListener('submit',e=>{
    e.preventDefault(); const u = authUsername.value.trim(); const p = authPassword.value.trim();
    if(authMode==='signup'){ if(handleSignup(u,p)){ closeAuth(); alert('Signup successful'); } }
    else { if(handleLogin(u,p)){ closeAuth(); alert('Login successful'); } }
  });

  btnLogout.addEventListener('click',()=>{ localStorage.removeItem('ecomart_currentUser'); updateAuthUI(); });

  cartBtn.addEventListener('click',()=>{
    if(!getCurrentUser()){ openAuth('login'); authMessage.textContent='Please login to view cart.'; return; }
    renderCart(); cartModal.classList.remove('hidden');
  });
  cartClose.addEventListener('click',()=> cartModal.classList.add('hidden'));

  checkoutBtn.addEventListener('click',()=>{
    const cart = loadCart(); if(cart.length===0){ alert('Cart is empty'); return; }
    const user = getCurrentUser(); if(!user){ openAuth('login'); return; }
    // compute total and simulate checkout
    const total = cart.reduce((s,c)=>{
      const it = items.find(i=>i.id===c.id); return s + (it? it.price * c.qty : 0);
    },0);
    alert('Order placed. Total bill: $' + total.toFixed(2));
    localStorage.removeItem(userCartKey(user)); renderCart(); renderCartCount(); cartModal.classList.add('hidden');
  });

  // Hero 'Shop Now' scroll behavior
  if(shopNow){
    shopNow.addEventListener('click', ()=>{
      const target = document.getElementById('items');
      if(target) target.scrollIntoView({behavior:'smooth'});
    });
  }

  // Search behaviour
  if(searchInput){
    searchInput.addEventListener('input', ()=>{
      const q = searchInput.value;
      if(document.getElementById('products-list')) renderProductsPage(q);
      else renderHomepage(q);
    });
  }

  // init
  if(document.getElementById('products-list')) renderProductsPage();
  else renderHomepage();
  updateAuthUI();
})();
