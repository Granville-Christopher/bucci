document.querySelectorAll('.filter-btn').forEach(button => {
  button.addEventListener('click', function () {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');

    const category = this.getAttribute('data-category');
    const container = document.querySelector("#product-container");
    const loader = document.querySelector("#loading-spinner");

    loader.style.display = "block"; // Show loader
    container.style.opacity = "0.5"; // Optional: Fade products during loading

    fetch(`/api/filter-products?category=${encodeURIComponent(category)}`)
      .then(response => response.json())
      .then(products => {
        if (!container) return;

        if (products.length === 0) {
          container.innerHTML = `<p class="text-center">No products to show.</p>`;
        } else {
          container.innerHTML = products.map(product => `
            <div class="col-6 col-md-3">
              <div class="product-item position-relative">
                ${product.flashsale ? `<div class="ribbon ribbon-top-left"><span>Flash Sale</span></div>` : ''}
                <button class="wishlist-btn" onclick="addToWishlist(this)">
                  <i class="fa fa-heart"></i>
                </button>
                <a href="/product/${product._id}">
                  <img src="${product.product_images[0]}" class="img-fluid" alt="${product.product_name}">
                </a>
                <h5><a href="/product/${product._id}">${product.product_name}</a></h5>
                <p class="product-price" data-flashsale="${product.flashsale}" data-flashsale-price="${product.flashsale_price}" data-price="${product.price}">
                  ${product.flashsale
                    ? `<span style="text-decoration: line-through; color: gray;">₦${product.price}</span>
                       <span style="color: red; font-weight: bold;">₦${product.flashsale_price}</span>`
                    : `₦${product.price}`
                  }
                </p>
                <h4 class="view-button"><a href="/product/${product._id}">View This</a></h4>
              </div>
            </div>
          `).join("");
        }
      })
      .catch(error => {
        console.error("Error loading products:", error);
        container.innerHTML = `<p class="text-center">An error occurred while fetching products.</p>`;
      })
      .finally(() => {
        loader.style.display = "none"; // Hide loader
        container.style.opacity = "1";
      });
  });
});


document.querySelectorAll('.brand-filter-btn').forEach(button => {
  button.addEventListener('click', async function () {
    const brand = this.getAttribute('data-category');
    try {
      const res = await fetch(`/filter-brand?brand=${brand}`);
      const html = await res.text();
      document.getElementById('product-container').innerHTML = html;
    } catch (err) {
      console.error("Error loading brand:", err);
    }
  });
});
