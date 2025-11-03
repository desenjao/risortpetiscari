// Global Variables
let cart = []
let currentScreen = "homeScreen"
let isDelivery = true
let appData = null

// DOM Elements
const loadingScreen = document.getElementById("loadingScreen")
const cartIcon = document.getElementById("cartIcon")
const floatingCart = document.getElementById("floatingCart")
const cartPanel = document.getElementById("cartPanel")
const closeCart = document.getElementById("closeCart")
const cartItems = document.getElementById("cartItems")
const cartTotal = document.getElementById("cartTotal")
const checkoutBtn = document.getElementById("checkoutBtn")
const deliveryOption = document.getElementById("deliveryOption")
const pickupOption = document.getElementById("pickupOption")
const navItems = document.querySelectorAll(".nav-item")
const categories = document.querySelectorAll(".category")
const promotionProducts = document.getElementById("promotionProducts")
const popularProducts = document.getElementById("popularProducts")
const allProducts = document.getElementById("allProducts")
const ordersList = document.getElementById("ordersList")
const userName = document.getElementById("userName")
const userEmail = document.getElementById("userEmail")
const userPhone = document.getElementById("userPhone")
const userAddress = document.getElementById("userAddress")

// Initialize App
document.addEventListener("DOMContentLoaded", initApp)

async function initApp() {
  try {
    // Load all data from JSON
    await loadAllData()

    // Setup event listeners
    setupEventListeners()

    // Load products
    loadProducts()

    // Load user profile
    loadUserProfile()

    // Load orders
    loadOrders()

    // Hide loading screen
    setTimeout(() => {
      loadingScreen.classList.add("hidden")
    }, 1500)
  } catch (error) {
    console.error("Erro ao inicializar app:", error)
    alert("Erro ao carregar dados. Por favor, recarregue a página.")
  }
}

// Load All Data from JSON
async function loadAllData() {
  try {
    const response = await fetch("./data/bdrisorte.json")
    if (!response.ok) throw new Error("Erro ao carregar dados")

    appData = await response.json()
    console.log("Dados carregados:", appData)
  } catch (error) {
    console.error("Erro ao carregar JSON:", error)
    // Fallback to default data if JSON fails
    appData = getDefaultData()
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Cart toggle
  cartIcon.addEventListener("click", () => cartPanel.classList.add("active"))
  floatingCart.addEventListener("click", () => cartPanel.classList.add("active"))
  closeCart.addEventListener("click", () => cartPanel.classList.remove("active"))

  // Delivery options
  deliveryOption.addEventListener("click", () => {
    isDelivery = true
    deliveryOption.classList.add("active")
    pickupOption.classList.remove("active")
    updateCart()
  })

  pickupOption.addEventListener("click", () => {
    isDelivery = false
    pickupOption.classList.add("active")
    deliveryOption.classList.remove("active")
    updateCart()
  })

  // Navigation
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const screenId = item.getAttribute("data-screen")
      showScreen(screenId)
    })
  })

  // Categories
  categories.forEach((category) => {
    category.addEventListener("click", () => {
      categories.forEach((c) => c.classList.remove("active"))
      category.classList.add("active")
      const categoryName = category.getAttribute("data-category")
      filterProducts(categoryName)
    })
  })

  // Checkout
  checkoutBtn.addEventListener("click", handleCheckout)
}

// Show Screen
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active")
  })

  document.getElementById(screenId).classList.add("active")
  currentScreen = screenId

  navItems.forEach((item) => {
    item.classList.remove("active")
    if (item.getAttribute("data-screen") === screenId) {
      item.classList.add("active")
    }
  })
}

// Load Products
function loadProducts() {
  if (!appData || !appData.produtos) return

  // Load promotion products
  const promoProducts = []
  Object.values(appData.produtos).forEach((category) => {
    category.forEach((produto) => {
      if (produto.promocao) promoProducts.push(produto)
    })
  })
  renderProducts(promotionProducts, promoProducts.slice(0, 4))

  // Load popular products (destaque)
  const popularItems = []
  Object.values(appData.produtos).forEach((category) => {
    category.forEach((produto) => {
      if (produto.destaque) popularItems.push(produto)
    })
  })
  renderProducts(popularProducts, popularItems.slice(0, 4))

  // Load all products
  const allItems = []
  Object.values(appData.produtos).forEach((category) => {
    allItems.push(...category)
  })
  renderProducts(allProducts, allItems)
}

// Render Products
function renderProducts(container, products) {
  container.innerHTML = ""

  if (products.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>Nenhum produto encontrado</h3>
                <p>Tente outra categoria</p>
            </div>
        `
    return
  }

  products.forEach((produto) => {
    const card = createProductCard(produto)
    container.appendChild(card)
  })
}

// Create Product Card
function createProductCard(produto) {
  const div = document.createElement("div")
  div.className = "product-card"

  div.innerHTML = `
        <div class="product-image" style="background-image: url('${produto.imagem}')">
            ${produto.promocao ? '<div class="product-badge">🔥 PROMOÇÃO</div>' : ""}
        </div>
        <div class="product-info">
            <h3 class="product-title">${produto.nome}</h3>
            <p class="product-description">${produto.descricao}</p>
            <div class="product-price">R$ ${produto.preco.toFixed(2).replace(".", ",")}</div>
            <button class="add-to-cart" data-id="${produto.id}">
                <i class="fas fa-cart-plus"></i> Adicionar
            </button>
        </div>
    `

  // Add to cart event
  const addBtn = div.querySelector(".add-to-cart")
  addBtn.addEventListener("click", (e) => {
    e.stopPropagation()
    addToCart(produto)
    animateProductToCart(e.target, produto.imagem)
  })

  return div
}

// Filter Products
function filterProducts(categoryName) {
  if (!appData || !appData.produtos) return

  if (categoryName === "all") {
    loadProducts()
    return
  }

  const filtered = appData.produtos[categoryName] || []
  renderProducts(allProducts, filtered)
  renderProducts(promotionProducts, filtered.filter((p) => p.promocao).slice(0, 4))
  renderProducts(popularProducts, filtered.filter((p) => p.destaque).slice(0, 4))
}

// Add to Cart
function addToCart(produto) {
  const existingItem = cart.find((item) => item.id === produto.id)

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.push({
      id: produto.id,
      title: produto.nome,
      price: produto.preco,
      image: produto.imagem,
      quantity: 1,
    })
  }

  updateCart()
  showFeedback(`✓ ${produto.nome} adicionado!`)
}

// Animate Product to Cart
function animateProductToCart(button, imageUrl) {
  const flyingProduct = document.getElementById("flyingProduct")
  const buttonRect = button.getBoundingClientRect()
  const cartRect = cartIcon.getBoundingClientRect()

  flyingProduct.style.backgroundImage = `url('${imageUrl}')`
  flyingProduct.style.left = buttonRect.left + "px"
  flyingProduct.style.top = buttonRect.top + "px"
  flyingProduct.classList.add("animate")

  // Calculate end position
  const endX = cartRect.left + cartRect.width / 2 - 40
  const endY = cartRect.top + cartRect.height / 2 - 40

  flyingProduct.style.setProperty("--end-x", `${endX}px`)
  flyingProduct.style.setProperty("--end-y", `${endY}px`)

  // Add dynamic animation
  const animation = flyingProduct.animate(
    [
      {
        left: buttonRect.left + "px",
        top: buttonRect.top + "px",
        opacity: 1,
        transform: "scale(1) rotate(0deg)",
      },
      {
        left: endX + "px",
        top: endY + "px",
        opacity: 0,
        transform: "scale(0.3) rotate(360deg)",
      },
    ],
    {
      duration: 800,
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
  )

  animation.onfinish = () => {
    flyingProduct.classList.remove("animate")
    // Shake cart icon
    cartIcon.style.animation = "shake 0.5s"
    setTimeout(() => {
      cartIcon.style.animation = ""
    }, 500)
  }
}

// Add shake animation
const style = document.createElement("style")
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px) rotate(-5deg); }
        75% { transform: translateX(5px) rotate(5deg); }
    }
`
document.head.appendChild(style)

// Update Cart
function updateCart() {
  cartItems.innerHTML = ""

  if (cart.length === 0) {
    cartItems.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-cart"></i>
                <h3>Carrinho vazio</h3>
                <p>Adicione produtos para continuar</p>
            </div>
        `
    document.querySelector(".cart-count").textContent = "0"
    document.querySelector(".floating-cart-count").textContent = "0"
    cartTotal.textContent = "R$ 0,00"
    return
  }

  let totalItems = 0
  let subtotal = 0

  cart.forEach((item) => {
    totalItems += item.quantity
    subtotal += item.price * item.quantity

    const cartItem = document.createElement("div")
    cartItem.className = "cart-item"
    cartItem.innerHTML = `
            <div class="cart-item-image" style="background-image: url('${item.image}')"></div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.title}</div>
                <div class="cart-item-price">R$ ${item.price.toFixed(2).replace(".", ",")}</div>
                <div class="cart-item-actions">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
            </div>
        `

    cartItems.appendChild(cartItem)
  })

  // Add event listeners to quantity buttons
  document.querySelectorAll(".decrease").forEach((btn) => {
    btn.addEventListener("click", () => decreaseQuantity(btn.dataset.id))
  })

  document.querySelectorAll(".increase").forEach((btn) => {
    btn.addEventListener("click", () => increaseQuantity(btn.dataset.id))
  })

  // Calculate total
  const deliveryFee = isDelivery ? appData?.config?.taxa_entrega || 5.0 : 0
  const total = subtotal + deliveryFee

  document.querySelector(".cart-count").textContent = totalItems
  document.querySelector(".floating-cart-count").textContent = totalItems
  cartTotal.textContent = `R$ ${total.toFixed(2).replace(".", ",")}`
}

// Increase Quantity
function increaseQuantity(id) {
  const item = cart.find((item) => item.id == id)
  if (item) {
    item.quantity += 1
    updateCart()
  }
}

// Decrease Quantity
function decreaseQuantity(id) {
  const itemIndex = cart.findIndex((item) => item.id == id)
  if (itemIndex !== -1) {
    if (cart[itemIndex].quantity > 1) {
      cart[itemIndex].quantity -= 1
    } else {
      cart.splice(itemIndex, 1)
    }
    updateCart()
  }
}

// Calculate Total
function calculateTotal() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = isDelivery ? appData?.config?.taxa_entrega || 5.0 : 0
  return subtotal + deliveryFee
}

// Handle Checkout
function handleCheckout() {
  if (cart.length === 0) {
    showFeedback("❌ Seu carrinho está vazio!")
    return
  }

  showOrderConfirmationModal()
}

// Show Order Confirmation Modal
function showOrderConfirmationModal() {
  cartPanel.classList.remove("active")

  const modal = document.createElement("div")
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
        animation: fadeIn 0.3s ease-out;
    `

  const total = calculateTotal()
  const taxaEntrega = isDelivery ? appData?.config?.taxa_entrega || 5.0 : 0

  modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: slideUp 0.4s ease-out;
        ">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, #EA1D2C, #FFB300);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    animation: pulse 2s infinite;
                ">
                    <i class="fas fa-shopping-bag" style="color: white; font-size: 24px;"></i>
                </div>
                <h3 style="margin: 0 0 8px 0; color: #2C3E50; font-weight: 700; font-size: 22px;">Confirmar Pedido</h3>
                <p style="margin: 0; color: #717171; font-size: 14px;">Revise seus itens antes de finalizar</p>
            </div>
            
            <div style="
                background: #F7F7F7;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                max-height: 200px;
                overflow-y: auto;
            ">
                ${generateOrderItemsHTML()}
            </div>
            
            <div style="
                background: linear-gradient(135deg, #EA1D2C10, #FFB30010);
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 20px;
                border: 1px solid #EA1D2C20;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #2C3E50;">Subtotal:</span>
                    <span style="color: #2C3E50; font-weight: 600;">R$ ${(total - taxaEntrega).toFixed(2).replace(".", ",")}</span>
                </div>
                ${
                  isDelivery
                    ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #2C3E50;">Taxa de Entrega:</span>
                    <span style="color: #2C3E50; font-weight: 600;">R$ ${taxaEntrega.toFixed(2).replace(".", ",")}</span>
                </div>
                `
                    : ""
                }
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 2px solid #EA1D2C30; margin-top: 10px;">
                    <span style="color: #2C3E50; font-weight: 700; font-size: 18px;">Total:</span>
                    <span style="color: #EA1D2C; font-weight: 800; font-size: 20px;">R$ ${total.toFixed(2).replace(".", ",")}</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="cancelOrderBtn" style="
                    flex: 1;
                    padding: 15px;
                    border: 2px solid #717171;
                    background: white;
                    color: #717171;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 15px;
                ">Cancelar</button>
                <button id="confirmOrderBtn" style="
                    flex: 2;
                    padding: 15px;
                    border: none;
                    background: linear-gradient(135deg, #EA1D2C, #FFB300);
                    color: white;
                    border-radius: 10px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(234, 29, 44, 0.3);
                    font-size: 15px;
                ">✓ Finalizar Pedido</button>
            </div>
        </div>
    `

  document.body.appendChild(modal)

  // Event listeners
  modal.querySelector("#cancelOrderBtn").addEventListener("click", () => {
    document.body.removeChild(modal)
    cartPanel.classList.add("active")
  })

  modal.querySelector("#confirmOrderBtn").addEventListener("click", () => {
    processOrder(modal)
  })

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal)
      cartPanel.classList.add("active")
    }
  })
}

// Generate Order Items HTML
function generateOrderItemsHTML() {
  let html = ""
  cart.forEach((item, index) => {
    html += `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: ${index < cart.length - 1 ? "1px solid #E0E0E0" : "none"};
                animation: fadeIn 0.5s ease-out ${index * 0.1}s both;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="
                        width: 40px;
                        height: 40px;
                        border-radius: 8px;
                        background-image: url('${item.image}');
                        background-size: cover;
                        background-position: center;
                    "></div>
                    <div>
                        <div style="font-weight: 600; color: #2C3E50; font-size: 14px;">${item.title}</div>
                        <div style="color: #717171; font-size: 12px;">Qtd: ${item.quantity}</div>
                    </div>
                </div>
                <div style="font-weight: 700; color: #EA1D2C;">R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}</div>
            </div>
        `
  })
  return html
}

// Process Order
function processOrder(modal) {
  modal.querySelector("div > div").innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <div style="
                width: 80px;
                height: 80px;
                border: 4px solid #F7F7F7;
                border-top: 4px solid #EA1D2C;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            "></div>
            
            <h3 style="margin: 0 0 10px 0; color: #2C3E50; font-weight: 700;">Processando Pedido</h3>
            <p style="margin: 0 0 20px 0; color: #717171; font-size: 14px;">Preparando tudo para você...</p>
            
            <div id="processingItems" style="
                background: #F7F7F7;
                border-radius: 12px;
                padding: 15px;
                margin-bottom: 20px;
                text-align: left;
            ">
                ${generateProcessingItemsHTML()}
            </div>
            
            <p style="color: #717171; font-size: 13px; margin-bottom: 15px;">
                Você será redirecionado para o WhatsApp
            </p>
            
            <button id="whatsappBtn" style="
                width: 100%;
                padding: 18px;
                border: none;
                background: #25D366;
                color: white;
                border-radius: 12px;
                font-weight: 700;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                transition: all 0.3s;
                font-size: 16px;
                box-shadow: 0 4px 15px rgba(37, 211, 102, 0.3);
            ">
                <i class="fab fa-whatsapp" style="font-size: 20px;"></i>
                Enviar Pedido no WhatsApp
            </button>
        </div>
    `

  animateProcessingItems()

  modal.querySelector("#whatsappBtn").addEventListener("click", () => {
    sendWhatsAppOrder()
    document.body.removeChild(modal)
    cart = []
    updateCart()
  })
}

// Generate Processing Items HTML
function generateProcessingItemsHTML() {
  let html =
    '<div style="font-weight: 700; color: #2C3E50; margin-bottom: 10px; font-size: 15px;">📦 Itens do Pedido:</div>'
  cart.forEach((item, index) => {
    html += `
            <div class="processing-item" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: ${index < cart.length - 1 ? "1px solid #E0E0E0" : "none"};
                opacity: 0;
            ">
                <span style="color: #2C3E50; font-size: 14px;">${item.quantity}x ${item.title}</span>
                <div class="check-icon" style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #E0E0E0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: white;
                "></div>
            </div>
        `
  })
  return html
}

// Animate Processing Items
function animateProcessingItems() {
  const items = document.querySelectorAll(".processing-item")
  items.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = "1"
      item.style.transition = "all 0.5s ease-out"
      item.style.transform = "translateX(0)"

      setTimeout(() => {
        const checkIcon = item.querySelector(".check-icon")
        checkIcon.style.background = "#00C851"
        checkIcon.innerHTML = "✓"
        checkIcon.style.transition = "all 0.3s"
      }, 500)
    }, index * 600)
  })
}
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/javascript; charset=utf-8");
  next();
});

// Enviar pedido via WhatsApp (versão sem emojis)
function sendWhatsAppOrder() {
  const total = calculateTotal();
  const config = appData?.config || {};
  const user = appData?.user || {};
  const phoneNumber = config.telefone_whatsapp || "+5511999999999";
  const formattedPhone = phoneNumber.replace(/\D/g, "");

  let message = `*PEDIDO - ${config.nome_estabelecimento || "Risorte Petiscaria"}*\n\n`;
  message += `*Cliente:* ${user.nome || "Cliente"}\n`;

  if (isDelivery && user.endereco) {
    const end = user.endereco;
    message += `*Endereço:* ${end.rua}, ${end.bairro}, ${end.cidade}`;
    if (end.complemento) message += ` - ${end.complemento}`;
    message += `\n`;
  }

  message += `*Tipo:* ${isDelivery ? "Delivery" : "Retirada no Local"}\n\n`;
  message += `*ITENS DO PEDIDO:*\n`;
  message += `------------------------------\n`;

  cart.forEach((item) => {
    message += `${item.quantity}x ${item.title}\n`;
    message += `  R$ ${(item.price * item.quantity).toFixed(2).replace(".", ",")}\n`;
  });

  message += `------------------------------\n`;

  if (isDelivery) {
    const taxa = config.taxa_entrega || 5.0;
    message += `Taxa de Entrega: R$ ${taxa.toFixed(2).replace(".", ",")}\n`;
  }

  message += `\n*TOTAL:* R$ ${total.toFixed(2).replace(".", ",")}\n\n`;
  message += `*Forma de Pagamento:* A combinar\n`;

  const tempoMin = isDelivery
    ? config.tempo_entrega_min
    : config.tempo_retirada_min;
  const tempoMax = isDelivery
    ? config.tempo_entrega_max
    : config.tempo_retirada_max;

  message += `*Previsão:* ${tempoMin || 30}-${tempoMax || 45} minutos\n\n`;
  message += `_Pedido gerado via App Risorte Petiscaria_`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;

  window.open(whatsappURL, "_blank");
  showSuccessMessage();
}


// Show Success Message
function showSuccessMessage() {
  const feedback = document.createElement("div")
  feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #00C851, #00A040);
        color: white;
        padding: 30px 40px;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10001;
        font-weight: 500;
        text-align: center;
        animation: slideUp 0.5s ease-out;
    `
  feedback.innerHTML = `
        <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
        <div style="font-weight: 700; margin-bottom: 8px; font-size: 20px;">Pedido Enviado!</div>
        <div style="font-size: 14px; opacity: 0.95;">Aguarde o contato no WhatsApp</div>
    `

  document.body.appendChild(feedback)

  setTimeout(() => {
    feedback.style.animation = "fadeOut 0.5s ease-in"
    setTimeout(() => {
      document.body.removeChild(feedback)
    }, 500)
  }, 3000)
}

// Show Feedback
function showFeedback(message) {
  const feedback = document.createElement("div")
  feedback.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--success);
        color: white;
        padding: 15px 25px;
        border-radius: 25px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 600;
        animation: slideDown 0.3s ease-out;
        font-size: 14px;
    `
  feedback.textContent = message

  document.body.appendChild(feedback)

  setTimeout(() => {
    feedback.style.animation = "slideUp 0.3s ease-in"
    setTimeout(() => {
      document.body.removeChild(feedback)
    }, 300)
  }, 2000)
}

// Load User Profile
function loadUserProfile() {
  if (!appData || !appData.user) return

  const user = appData.user
  userName.textContent = user.nome || "Usuário"
  userEmail.textContent = user.email || "email@exemplo.com"
  userPhone.textContent = user.telefone || "Não informado"

  if (user.endereco) {
    const end = user.endereco
    userAddress.textContent = `${end.rua}, ${end.bairro}, ${end.cidade}`
  }
}

// Load Orders
function loadOrders() {
  if (!appData || !appData.pedidos) return

  ordersList.innerHTML = ""

  if (appData.pedidos.length === 0) {
    ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>Nenhum pedido ainda</h3>
                <p>Faça seu primeiro pedido!</p>
            </div>
        `
    return
  }

  appData.pedidos.forEach((order) => {
    const orderCard = createOrderCard(order)
    ordersList.appendChild(orderCard)
  })
}

// Create Order Card
function createOrderCard(order) {
  const div = document.createElement("div")
  div.className = "order-card"

  let statusClass = ""
  let statusText = ""

  switch (order.status) {
    case "entregue":
      statusClass = "status-delivered"
      statusText = "✓ Entregue"
      break
    case "preparando":
      statusClass = "status-preparing"
      statusText = "🔥 Preparando"
      break
    case "pendente":
      statusClass = "status-pending"
      statusText = "⏳ Pendente"
      break
  }

  let itemsHtml = ""
  order.items.forEach((item) => {
    itemsHtml += `
            <div class="order-item">
                <span>${item.quantidade || 1}x ${item.nome}</span>
                <span>R$ ${item.preco.toFixed(2).replace(".", ",")}</span>
            </div>
        `
  })

  div.innerHTML = `
        <div class="order-header">
            <div class="order-id">#${order.id}</div>
            <div class="order-status ${statusClass}">${statusText}</div>
        </div>
        <div class="order-items">
            ${itemsHtml}
        </div>
        <div class="order-total">
            <span>Total</span>
            <span>R$ ${order.total.toFixed(2).replace(".", ",")}</span>
        </div>
    `

  return div
}

// Get Default Data (Fallback)
function getDefaultData() {
  return {
    config: {
      nome_estabelecimento: "Risorte Petiscaria",
      telefone_whatsapp: "+5511999999999",
      taxa_entrega: 5.0,
      tempo_entrega_min: 30,
      tempo_entrega_max: 45,
    },
    user: {
      nome: "Cliente",
      email: "cliente@email.com",
      telefone: "+5511999999999",
      endereco: {
        rua: "Rua Exemplo, 123",
        bairro: "Centro",
        cidade: "São Paulo - SP",
      },
    },
    produtos: {
      porcoes: [],
    },
    pedidos: [],
  }
}
