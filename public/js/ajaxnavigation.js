document.addEventListener("DOMContentLoaded", function () {
  console.log("ajaxnavigation.js loaded!");
  updateCartCounterUI();
  markWishlistButtons();
  markWishlistButton();
  updateWishlistCounterUI();
  markCartButton();

  // window.addEventListener("storage", function () {
  //   updateCartCounterUI();
  //   updateWishlistCounterUI();
  // });

  let searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = "search";
    });
  }
});
// recently viewed
function updateRecentlyViewed(product) {
  let viewedItems = JSON.parse(localStorage.getItem("recentlyViewed")) || [];

  // Add new product to start
  viewedItems.unshift(product);

  // Keep max 5
  if (viewedItems.length > 6) viewedItems = viewedItems.slice(0, 6);

  localStorage.setItem("recentlyViewed", JSON.stringify(viewedItems));
}

// Attach click listeners to all product-item links
const productLinks = document.querySelectorAll(".product-item a");
if (productLinks) {
  productLinks.forEach((link) => {
    link.addEventListener("click", function () {
      const productItem = this.closest(".product-item");
      const product = {
        image: productItem.querySelector("img").src,
        name: productItem.querySelector("h5")?.textContent.trim() || "",
        price: productItem.querySelector("p")?.textContent.trim() || "",
        view: productItem.querySelector("h4")?.textContent.trim() || "",
        link: this.href,
      };

      updateRecentlyViewed(product);
    });
  });
}

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");
const navOverlay = document.getElementById("nav-overlay");

if (navToggle) {
  navToggle.addEventListener("click", function (event) {
    navLinks.classList.toggle("active");
    navOverlay.classList.toggle("active");
    event.stopPropagation();
  });

  // Close when clicking outside
  document.addEventListener("click", function (event) {
    if (!navLinks.contains(event.target) && !navToggle.contains(event.target)) {
      navLinks.classList.remove("active");
      navOverlay.classList.remove("active");
    }
  });

  // Close when clicking the ✖ inside menu (we use ::before pseudo)
  navLinks.addEventListener("click", function (e) {
    if (e.target.textContent === "✖") {
      navLinks.classList.remove("active");
      navOverlay.classList.remove("active");
    }
  });
}

//pdetails wishlist
function handlePDetailsWishlist(button) {
  const productId = document.getElementById("product-id").value.trim();
  const productName = document.querySelector("h2").textContent.trim();
  const productPrice = document
    .querySelector(".product-price")
    .textContent.trim();
  const productImage = document.getElementById("main-product-img").src;

  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const existingIndex = wishlist.findIndex((item) => item.id === productId);

  if (existingIndex === -1) {
    // ✅ Add to wishlist
    wishlist.push({
      id: productId,
      name: productName,
      price: productPrice,
      image: productImage,
    });
    button.classList.add("activer");
  } else {
    // ✅ Remove from wishlist
    wishlist.splice(existingIndex, 1);
    button.classList.remove("activer");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistCounterUI();
}

function markWishlistButton() {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  const button = document.getElementById("wishlist-btn");
  const productIdInput = document.getElementById("product-id");

  if (!productIdInput || !button) return;

  const productId = productIdInput.value.trim();
  const isInWishlist = wishlist.some((item) => item.id === productId);

  if (isInWishlist) {
    button.classList.add("activer");
  } else {
    button.classList.remove("activer");
  }
}

// 💖 Add or Remove Wishlist Item
function addToWishlist(button) {
  const productItem = button.closest(".product-item");

  const product = {
    id: productItem.querySelector("h3 a").textContent.trim(),
    name: productItem.querySelector("h5 a").textContent.trim(),
    image: productItem.querySelector("img").src,
    price: productItem.querySelector("p").textContent.trim(),
    view: productItem.querySelector("h4").textContent.trim(),
    link: productItem.querySelector("h5 a").getAttribute("href"),
  };

  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  const existingIndex = wishlist.findIndex((item) => item.id === product.id);

  if (existingIndex === -1) {
    wishlist.push(product);
    button.classList.add("activer");
  } else {
    wishlist.splice(existingIndex, 1);
    button.classList.remove("activer");
  }

  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  updateWishlistCounterUI();
}

// 🔢 Update the wishlist count in the navbar
function updateWishlistCounterUI() {
  const wishlistCounter = document.getElementById("wishlist-count");
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  if (wishlistCounter) {
    wishlistCounter.textContent = wishlist.length;
  }
}

function markWishlistButtons() {
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

  document.querySelectorAll(".wishlist-btn").forEach((button) => {
    const productItem = button.closest(".product-item");
    const productIdElement = productItem.querySelector("h3 a#id");

    if (!productIdElement) return;

    const productId = productIdElement.textContent.trim();

    const isInWishlist = wishlist.some((item) => item.id === productId);

    if (isInWishlist) {
      button.classList.add("activer");
    } else {
      button.classList.remove("activer");
    }
  });
}

// cart

function changeQuantity(amount) {
  const quantityInput = document.querySelector("#quantity-input");

  if (!quantityInput) {
    console.error("Quantity input field not found.");
    return;
  }

  let currentQty = parseInt(quantityInput.value) || 1;
  currentQty += amount;
  if (currentQty < 1) currentQty = 1;
  quantityInput.value = currentQty;

  // Also update in cart
  updateCartVariant("quantity", currentQty);
}

// ✅ Marks the cart button correctly on page load
function markCartButton() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const productName = document.querySelector("h2");
  if (productName) {
    let cartNameValue = productName.textContent.trim();
    const exists = cart.some((item) => item.name === cartNameValue);
    const cartbutton = document.getElementById("cart-btn");
    if (cartbutton) {
      cartbutton.textContent = exists ? "Remove from Cart" : "Add to Cart";
    }
  }
}

function handleCart(button) {
  const productId = document.getElementById("product-id").value;
  const productName = document.querySelector("h2").textContent.trim();
  const productImage = document.getElementById("main-product-img").src;
  const quantityInput = document.querySelector("#quantity-input");

  // Get flash sale price safely
  
  const productSection = button.closest(".product-section"); // or the actual container class
  const flashSalePriceElement = productSection?.querySelector(".flashsale-price");
  

  const flashsalePrice = flashSalePriceElement
  ? parseFloat(flashSalePriceElement.textContent.match(/\d+(\.\d+)?/)[0])
  : null;

  

  // Get normal price safely
  const normalPriceElement = document.querySelector(".product-price span");
  const normalPrice = normalPriceElement
    ? parseFloat(normalPriceElement.textContent.match(/\d+(\.\d+)?/)[0])
    : 0;

  // Use final price: prefer flashsalePrice if available
  const finalPrice = flashsalePrice !== null ? flashsalePrice : normalPrice;


  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const productIndex = cart.findIndex((item) => item.id === productId);

  if (productIndex !== -1) {
    cart.splice(productIndex, 1);
    button.textContent = "Add to Cart";
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCounterUI();
    return;
  }

  const selectedColorBtn = document.querySelector(".color-btn.activee");
  const selectedSizeBtn = document.querySelector(".size-btn.activee");

  const selectedColor = selectedColorBtn
    ? selectedColorBtn.textContent.trim()
    : null;
  const selectedSize = selectedSizeBtn
    ? selectedSizeBtn.textContent.trim()
    : null;

  const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

  if (!selectedColor || !selectedSize) {
    alert("Please select both a color and a size.");
    return;
  }

  cart.push({
    id: productId,
    name: productName,
    price: normalPrice,
    flashsalePrice: flashsalePrice,
    finalPrice: finalPrice,
    image: productImage,
    quantity: quantity,
    color: selectedColor,
    size: selectedSize,
  });
  

  button.textContent = "Remove from Cart";
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCounterUI();
}

function selectColor(button) {
  document
    .querySelectorAll(".color-btn")
    .forEach((btn) => btn.classList.remove("activee"));
  button.classList.add("activee");

  updateCartVariant("color", button.textContent.trim());
}

function selectSize(button) {
  document
    .querySelectorAll(".size-btn")
    .forEach((btn) => btn.classList.remove("activee"));
  button.classList.add("activee");

  updateCartVariant("size", button.textContent.trim());
}

function updateCartVariant(type, value) {
  const productId = window.location.pathname.split("/").pop();
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  const cartIndex = cart.findIndex((item) => item.id === productId);

  if (cartIndex !== -1) {
    cart[cartIndex][type] = value;
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log(`Cart updated: ${type} changed to ${value}`);
  }
}

let removeCart = document.getElementById("remove-all-cart");
if (removeCart) {
  removeCart.addEventListener("click", removeAllCartItems);
}

function removeAllCartItems() {
  localStorage.removeItem("cart");
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartCount = cart.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
  const counter = document.getElementById("cart-count");
  if (counter) {
    counter.textContent = cartCount;
  }
  loadCart();
}

function updateCartCounterUI() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  // const cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const counter = document.getElementById("cart-count");
  if (counter) {
    counter.textContent = cart.length;
  }
}

// remove item from cart
function removeFromCart(productId) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart = cart.filter((item) => item.id !== productId); // Remove by ID
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
  updateCartCounterUI();
}

// remove item from wishlist
function removeFromWishlist(productId) {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  wishlist = wishlist.filter((item) => item.id !== productId); // Remove by ID
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  loadWishlist(); // Reload wishlist UI
  updateWishlistCounterUI(); // Optional: if you’re showing a count badge
}

document.addEventListener("click", function (e) {
  // Cart removal
  if (e.target.classList.contains("remove-cart")) {
    const index = e.target.getAttribute("data-index");
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const item = cart[index];
    if (item && item.id) {
      removeFromCart(item.id);
    }
  }

  // Wishlist removal
  if (e.target.classList.contains("remove-wishlist")) {
    const index = e.target.getAttribute("data-index");
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const item = wishlist[index];
    if (item && item.id) {
      removeFromWishlist(item.id);
    }
  }
});

// load wishlist
document.addEventListener("DOMContentLoaded", function () {
  loadWishlist();
});
function loadWishlist() {
  let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  let wishlistContainer = document.getElementById("wishlist-container");
  let emptyMessage = document.getElementById("empty-wishlist-msg");

  if (wishlist.length === 0) {
    if (emptyMessage) {
      emptyMessage.style.display = "block";
      emptyMessage.innerHTML = "Your wishlist is empty.";
    }
    if (wishlistContainer) {
      wishlistContainer.innerHTML = "";
    }
  } else {
    if (emptyMessage) {
      emptyMessage.style.display = "none";
    }
    if (wishlistContainer) {
      wishlistContainer.innerHTML = wishlist
        .map((product, index) => {
          return `
            <div class="row border-bottom py-2 align-items-center wishlist-item">
              <div class="col-2">
                <img src="${product.image}" class="img-fluid" alt="${product.name}">
              </div>
              <div class="col-4">
                <h6>${product.name}</h6>
                <p>${product.price}</p>
              </div>
              <div class="col-4">
                <a href="${product.link}" data-index="${index}">View Item</a>
              </div>
              <div class="col-2 text-end">
                <button class="btn btn-sm btn-danger remove-wishlist" data-index="${index}">✖</button>
              </div>
            </div>
          `;
        })
        .join("");
    }
  }
}

let removeAllWishlist = document.getElementById("remove-all-wishlist");
if (removeAllWishlist) {
  removeAllWishlist.addEventListener("click", removeAllWishlistItems);
}
function removeAllWishlistItems() {
  localStorage.removeItem("wishlist");
  let wishlistContainer = document.getElementById("wishlist-container");
  wishlistContainer.innerHTML = "";

  const wishlistCounter = document.getElementById("wishlist-count");
  const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  if (wishlistCounter) {
    wishlistCounter.textContent = wishlist.length;
  }
  loadWishlist();
}

function loadCart() {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let cartContainer = document.getElementById("cart-container");
  let totalItems = document.getElementById("total-items");
  let subtotalElement = document.getElementById("subtotal");
  let totalPriceElement = document.getElementById("total-price");

  if (!cartContainer || !totalItems || !subtotalElement || !totalPriceElement) {
    return;
  }

  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your Cart is empty.</p>";
    totalItems.textContent = "0";
    subtotalElement.textContent = "₦0.00";
    totalPriceElement.textContent = "₦0.00";
    return;
  }

  let subtotal = 0;

  cartContainer.innerHTML = cart
    .map((product, index) => {
      let quantity = product.quantity || 1;
      let price = parseFloat(product.finalPrice);
      if (isNaN(price)) {
        console.error("Invalid price for product:", product);
        return "";
      }

      let totalPrice = price * quantity;
      subtotal += totalPrice;

      let priceDisplay = product.flashsalePrice
        ? `<span style="text-decoration: line-through; color: gray;" class="mx-4">₦${product.price.toFixed(
            2
          )}</span><br>
           <span style="color: red; font-weight: bold;">₦${product.flashsalePrice.toFixed(
             2
           )}</span>`
        : `<span>₦${product.price.toFixed(2)}</span>`;

      return `
        <div class="row cart-item border-bottom py-2 align-items-center">
          <div class="col-2">
            <img src="${product.image}" class="img-fluid" alt="${product.name}">
          </div>
          <div class="col-4">
            <h6>${product.name}</h6>
            <p>${priceDisplay}</p>
          </div>
          <div class="col-4">
            <button class="btn btn-sm btn-outline-secondary decrease" data-index="${index}" ${
        quantity === 1 ? "disabled" : ""
      }>-</button>
            <span class="mx-2">${quantity}</span>
            <button class="btn btn-sm btn-outline-secondary increase" data-index="${index}">+</button>
          </div>
          <div class="col-2 text-end">
            <button class="btn btn-sm btn-danger remove-cart" data-index="${index}">✖</button>
          </div>
        </div>`;
    })
    .join("");

  totalItems.textContent = cart.length;
  subtotalElement.textContent = `₦${subtotal.toFixed(2)}`;
  totalPriceElement.textContent = `₦${subtotal.toFixed(2)}`;
}

// Update Total Price Based on Shipping
// Function to update the total price based on subtotal and shipping
function updateTotalPrice() {
  const subtotalElement = document.getElementById("subtotal");
  const shippingElement = document.getElementById("shipping");
  const totalPriceElement = document.getElementById("total-price");

  const subtotal = subtotalElement
    ? parseFloat(subtotalElement.textContent.replace(/[^\d.]/g, "")) || 0
    : 0;

  const shipping = shippingElement
    ? parseFloat(shippingElement.value.replace(/[^\d.]/g, "")) || 0
    : 0;

  const total = subtotal + shipping;

  if (totalPriceElement) {
    totalPriceElement.textContent = `₦${total.toFixed(2)}`;
  }
}

// Listen for changes
const shippingElement = document.getElementById("shipping");

if (shippingElement) {
  shippingElement.addEventListener("change", updateTotalPrice);
  shippingElement.addEventListener("input", updateTotalPrice);
}

// 🔥 Update immediately once page loads (after DOM is ready)
document.addEventListener("DOMContentLoaded", updateTotalPrice);


// Increase Quantity
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("increase")) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let index = event.target.getAttribute("data-index");
    cart[index].quantity = (cart[index].quantity || 1) + 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
  }
});

// Decrease Quantity
document.addEventListener("click", function (event) {
  if (event.target.classList.contains("decrease")) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let index = event.target.getAttribute("data-index");

    if (cart[index].quantity > 1) {
      cart[index].quantity -= 1;
      localStorage.setItem("cart", JSON.stringify(cart));
      loadCart();
    }
  }
});

// Load Cart on Page Load
document.addEventListener("DOMContentLoaded", loadCart);
