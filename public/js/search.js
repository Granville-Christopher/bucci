document.getElementById("search-input-section").addEventListener("input", async function () {
  const query = this.value.trim().toLowerCase();
  const suggestionsContainer = document.getElementById("search-suggestions-section");
  const resultsContainer = document.getElementById("search-results-page");

  suggestionsContainer.innerHTML = "";
  resultsContainer.innerHTML = "";

  if (query.length < 1) {
    suggestionsContainer.style.display = "none";
    return;
  }

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();

    // Render suggestions
    if (data.suggestions.length > 0) {
      suggestionsContainer.innerHTML = `
        <ul class="list-group">
          ${data.suggestions.map(s => `<li class="list-group-item search-suggestion" style="display: flex;">${s}</li>`).join("")}
        </ul>
      `;
      suggestionsContainer.style.display = "block";
    } else {
      suggestionsContainer.style.display = "none";
    }

    // Render products
    if (data.products.length > 0) {
      resultsContainer.innerHTML = `
        ${data.products.map(product => `
          <div class="col-6 col-md-3">
            <div class="product-item position-relative">
              ${product.flashsale ? `<div class="ribbon ribbon-top-left"><span>Flash Sale</span></div>` : ""}

              <button class="wishlist-btn" onclick="addToWishlist(this)">
                <i class="fa fa-heart"></i>
              </button>

              <a href="/product/${product._id}">
                <img src="${product.product_images[0]}" class="img-fluid" alt="${product.product_name}">
              </a>

              <h5><a href="/product/${product._id}">${product.product_name}</a></h5>

              <p class="product-price">
                ${
                  product.flashsale
                    ? `<span style="text-decoration: line-through; color: gray;">₦${product.price}</span> 
                       <span style="color: red; font-weight: bold;">₦${product.flashsale_price}</span>`
                    : `₦${product.price}`
                }
              </p>

              <h4 class="view-button"><a href="/product/${product._id}">View This</a></h4>
            </div>
          </div>
        `).join("")}
      `;
    } else {
      resultsContainer.innerHTML = "<p class='text-center'>No products found.</p>";
    }
  } catch (error) {
    console.error("❌ Error fetching search results:", error);
  }
});

// ✅ Handle suggestion click
document.getElementById("search-suggestions-section").addEventListener("click", async function (e) {
  if (e.target.classList.contains("search-suggestion")) {
    const selectedText = e.target.textContent;
    const input = document.getElementById("search-input-section");
    const resultsContainer = document.getElementById("search-results-page");

    // Set input value and hide suggestions
    input.value = selectedText;
    this.style.display = "none";

    // Trigger search
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(selectedText)}`);
      const data = await response.json();

      if (data.products.length > 0) {
        resultsContainer.innerHTML = `
          ${data.products.map(product => `
            <div class="col-6 col-md-3">
              <div class="product-item position-relative">
                ${product.flashsale ? `<div class="ribbon ribbon-top-left"><span>Flash Sale</span></div>` : ""}

                <button class="wishlist-btn" onclick="addToWishlist(this)">
                  <i class="fa fa-heart"></i>
                </button>

                <a href="/product/${product._id}">
                  <img src="${product.product_images[0]}" class="img-fluid" alt="${product.product_name}">
                </a>

                <h5><a href="/product/${product._id}">${product.product_name}</a></h5>

                <p class="product-price">
                  ${
                    product.flashsale
                      ? `<span style="text-decoration: line-through; color: gray;">₦${product.price}</span> 
                         <span style="color: red; font-weight: bold;">₦${product.flashsale_price}</span>`
                      : `₦${product.price}`
                  }
                </p>

                <h4 class="view-button"><a href="/product/${product._id}">View This</a></h4>
              </div>
            </div>
          `).join("")}
        `;
      } else {
        resultsContainer.innerHTML = "<p class='text-center'>No products found.</p>";
      }
    } catch (error) {
      console.error("❌ Error triggering search from suggestion:", error);
    }
  }
});
document.addEventListener("click", function (e) {
  const suggestionsContainer = document.getElementById("search-suggestions-section");
  if (!suggestionsContainer.contains(e.target) && e.target.id !== "search-input-section") {
    suggestionsContainer.style.display = "none";
  }
});
