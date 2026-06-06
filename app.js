import { INVENTARIO_LOCAL, CONFIG_MULTIMEDIA } from './datos.js';

let inventario = [];
let carrito = [];
let categoriaSeleccionada = "todas";

// Control Automático de Slides del Header (Sección Inicio)
const inicializarSlider = () => {
  const slides = document.querySelectorAll(".slide");
  if (!slides.length) return;
  let currentSlide = 0;
  setInterval(() => {
    slides[currentSlide].classList.remove("active");
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add("active");
  }, 5000);
};

// Carga del Catálogo
function cargarProductos() {
  inventario = [...INVENTARIO_LOCAL];
  crearFiltrosCategorias(inventario);
  renderizarCatalogo(inventario);
}

function crearFiltrosCategorias(items) {
  const filterContainer = document.getElementById("categories-filter-container");
  if (!items || !filterContainer || items.length === 0) return;

  const categoriaPrevia = categoriaSeleccionada;
  const categoriasSet = new Set();

  items.forEach((prod) => {
    if (prod.categoria) {
      categoriasSet.add(prod.categoria.trim());
    }
  });

  let filtrosHTML = `<button class="filter-btn ${categoriaPrevia === "todas" ? "active" : ""}" data-category="todas" id="btn-filtro-todas">Todas</button>`;

  categoriasSet.forEach((cat) => {
    const esActiva = categoriaPrevia.toLowerCase() === cat.toLowerCase();
    filtrosHTML += `<button class="filter-btn ${esActiva ? "active" : ""}" data-category="${cat.toLowerCase()}">${cat}</button>`;
  });

  filterContainer.innerHTML = filtrosHTML;

  filterContainer.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.target.getAttribute('data-category');
      const realCat = e.target.innerText;
      filtrarCatalogo(cat === 'todas' ? 'todas' : realCat, e.target);
    });
  });
}

function filtrarCatalogo(categoria, botonElemento) {
  categoriaSeleccionada = categoria;
  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
  botonElemento.classList.add("active");
  renderizarCatalogo(inventario);
}

function obtenerHtmlImagen(url, nombre) {
  const src = url && url.trim() !== "" ? url.trim() : CONFIG_MULTIMEDIA.fallbacks.imagen;
  const loadingAttr = CONFIG_MULTIMEDIA.ajustes.lazyLoading ? 'loading="lazy"' : '';
  return `<img src="${src}" alt="${nombre}" class="product-img" ${loadingAttr} onerror="this.onerror=null; this.src='${CONFIG_MULTIMEDIA.fallbacks.imagen}';">`;
}

function obtenerHtmlVideo(url) {
  const src = url && url.trim() !== "" ? url.trim() : CONFIG_MULTIMEDIA.fallbacks.video;
  const muted = CONFIG_MULTIMEDIA.ajustes.videoMuted ? "muted" : "";
  const loop = CONFIG_MULTIMEDIA.ajustes.videoLoop ? "loop" : "";
  const autoplay = CONFIG_MULTIMEDIA.ajustes.videoAutoplay ? "autoplay" : "";
  return `<video src="${src}" ${loop} ${muted} playsinline ${autoplay}></video>`;
}

function renderizarCatalogo(items) {
  const container = document.getElementById("products-container");
  if (!container) return;
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: #ffaa00">No hay productos registrados en el inventario local.</p>`;
    return;
  }

  const itemsFiltrados = items.filter((prod) => {
    if (categoriaSeleccionada.toLowerCase() === "todas") return true;
    return prod.categoria && prod.categoria.trim().toLowerCase() === categoriaSeleccionada.toLowerCase();
  });

  if (itemsFiltrados.length === 0) {
    container.innerHTML = `<p style="text-align: center; grid-column: 1/-1; color: #ffaa00">No hay productos disponibles en esta categoría.</p>`;
    return;
  }

  itemsFiltrados.forEach((prod) => {
    let idProducto = prod.id || Math.random().toString();
    let nombreProducto = prod.nombre || "Producto Sin Nombre";
    let categoryProducto = prod.categoria || "General";

    let precioCrudo = prod.costo || prod.precio || 0;
    let precioFormateado = parseFloat(String(precioCrudo).replace(/[^0-9.-]+/g, ""));
    if (isNaN(precioFormateado)) precioFormateado = 0;

    let mediaHTML = obtenerHtmlImagen(prod.imagen, nombreProducto);
    let videoHTML = obtenerHtmlVideo(prod.video);

    let mensajeWhatsAppProducto = encodeURIComponent(
      `Hola, me interesa obtener más información sobre el producto específico: *${nombreProducto}* que vi en su catálogo web.`
    );

    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-card-inner">
          <div class="product-front">
              <span class="product-tag">${categoryProducto}</span>
              <div class="media-container">
                 ${mediaHTML}
              </div>
              <h3 class="product-title">${nombreProducto}</h3>
              <p class="product-price">$${precioFormateado.toFixed(2)}</p>
              <button class="add-btn" data-id="${idProducto}">Agregar al Carrito</button>
          </div>
          
          <div class="product-back">
              <span class="product-tag" style="background: rgba(121, 40, 202, 0.2); color: var(--neon-cyan); border-color: var(--neon-purple);">Vista de Video</span>
              <div class="video-container">
                  ${videoHTML}
              </div>
              <h3 class="product-title" style="font-size: 1rem; min-height: auto;">${nombreProducto}</h3>
              <p class="back-info-text">Demostración en tiempo real del producto.</p>
              <a href="https://wa.me/584143693311?text=${mensajeWhatsAppProducto}" target="_blank" class="consult-wa-btn" data-back-link="true">
                  <i class="fa-brands fa-whatsapp"></i> Consultar Producto
              </a>
          </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-btn') || e.target.closest('[data-back-link="true"]')) {
        return; 
      }
      card.classList.toggle("flipped");
    });

    card.querySelector('.add-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      agregarAlCarrito(e.target.getAttribute('data-id'));
    });

    container.appendChild(card);
  });
}

// Gestión del Carrito
window.toggleCart = function(show) {
  const modal = document.getElementById("cart-modal");
  if (modal) modal.classList.toggle("open", show);
  validarFormulario();
};

function agregarAlCarrito(id) {
  const producto = inventario.find((p) => p.id == id);
  if (!producto) return;

  const existe = carrito.find((item) => item.id == id);
  let nombre = producto.nombre || "Producto";
  let imagen = producto.imagen || CONFIG_MULTIMEDIA.fallbacks.imagen;
  let precioCrudo = producto.costo || producto.precio || 0;
  let precio = parseFloat(String(precioCrudo).replace(/[^0-9.-]+/g, "")) || 0;

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({ id, nombre, precio, imagen, cantidad: 1 });
  }
  actualizarInterfazCarrito();
}

function actualizarInterfazCarrito() {
  const badge = document.getElementById("cart-count");
  const lista = document.getElementById("cart-items-list");
  const totalText = document.getElementById("cart-total");

  if (!lista || !badge || !totalText) return;

  let numItems = 0;
  let total = 0;
  lista.innerHTML = "";

  carrito.forEach((item) => {
    numItems += item.cantidad;
    total += item.precio * item.cantidad;
    
    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div class="cart-item-thumb">
          <img src="${item.imagen}" alt="${item.nombre}" onerror="this.onerror=null; this.src='${CONFIG_MULTIMEDIA.fallbacks.imagen}';">
      </div>
      <div class="cart-item-details">
          <p class="cart-item-name">${item.nombre}</p>
          <p class="cart-item-price">$${item.precio.toFixed(2)}</p>
      </div>
      <div class="cart-qty-controls">
          <button type="button" class="qty-btn btn-minus"><i class="fa-solid fa-minus"></i></button>
          <span class="qty-number">${item.cantidad}</span>
          <button type="button" class="qty-btn btn-plus"><i class="fa-solid fa-plus"></i></button>
      </div>
      <i class="fa-solid fa-trash-can cart-item-delete" title="Eliminar del carrito"></i>
    `;

    row.querySelector('.btn-minus').addEventListener('click', () => cambiarCantidad(item.id, -1));
    row.querySelector('.btn-plus').addEventListener('click', () => cambiarCantidad(item.id, 1));
    row.querySelector('.cart-item-delete').addEventListener('click', () => eliminarDelCarrito(item.id));

    lista.appendChild(row);
  });

  badge.innerText = numItems;
  totalText.innerText = `$${total.toFixed(2)}`;
  validarFormulario();
}

function cambiarCantidad(id, cambio) {
  const item = carrito.find((prod) => prod.id == id);
  if (!item) return;

  item.cantidad += cambio;
  if (item.cantidad <= 0) {
    eliminarDelCarrito(id);
  } else {
    actualizarInterfazCarrito();
  }
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter((item) => item.id != id);
  actualizarInterfazCarrito();
}

function validarFormulario() {
  const formulario = document.getElementById("whatsapp-form");
  const botonEnviar = document.getElementById("submit-order-btn");
  if (!formulario || !botonEnviar) return;

  if (formulario.checkValidity() && carrito.length > 0) {
    botonEnviar.removeAttribute("disabled");
  } else {
    botonEnviar.setAttribute("disabled", "true");
  }
}

function procesarPedidoWhatsApp(event) {
  event.preventDefault();
  if (carrito.length === 0) return alert("El carrito está vacío.");

  const cedula = document.getElementById("cust-id").value;
  const nombre = document.getElementById("cust-name").value;
  const direccion = document.getElementById("cust-address").value;
  const telefono = document.getElementById("cust-phone").value;

  let msg = `*NUEVO PEDIDO TODO PARA TU USO*\n\n`;
  msg += `*Cliente:* ${nombre}\n`;
  msg += `*Cédula:* ${cedula}\n`;
  msg += `*Teléfono:* ${telefono}\n`;
  msg += `*Dirección:* ${direccion}\n\n`;
  msg += `*Productos:*\n`;

  let total = 0;
  carrito.forEach((item) => {
    msg += `- ${item.cantidad}x ${item.nombre} ($${item.precio.toFixed(2)} c/u)\n`;
    total += item.precio * item.cantidad;
  });
  msg += `\n*Total de la Orden:* $${total.toFixed(2)} USD`;

  const urlFinal = `https://wa.me/584143693311?text=${encodeURIComponent(msg)}`;

  // Limpieza completa e inmediata de datos
  carrito = [];
  actualizarInterfazCarrito();
  document.getElementById("whatsapp-form").reset();

  document.querySelectorAll(".checkout-form input").forEach((input) => {
    input.classList.remove("touched");
  });

  validarFormulario();
  window.toggleCart(false);
  window.open(urlFinal, "_blank");
}

// Inicialización General
document.addEventListener("DOMContentLoaded", () => {
  inicializarSlider();
  cargarProductos();

  const formulario = document.getElementById("whatsapp-form");
  if (formulario) {
    formulario.addEventListener("submit", procesarPedidoWhatsApp);
    formulario.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => {
        input.classList.add("touched");
        validarFormulario();
      });
    });
  }

  // Cierre automático del panel móvil tras un clic en los anclajes
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      const checkboxMenu = document.getElementById('menu-toggle');
      if (checkboxMenu) checkboxMenu.checked = false;
    });
  });
});