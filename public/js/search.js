document.addEventListener("DOMContentLoaded", function () {

  console.log("✅ Script loaded and running!");

  let keywordSuggestions = [
    "Jacket",
    "Jeans",
    "Sneakers",
    "Sunglasses",
    "T-Shirt",
    "Running Shoes",
    "Denim",
    "Belt",
    "Blazer",
    "Polo Shirt",
    "Cap",
    "Boots",
    "Sweater",
    "Hoodie",
  ];

  let productList = [
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Leather Jacket",
      price: "$99",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Slim Fit Jeans",
      price: "$49",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Nike Sneakers",
      price: "$120",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Ray-Ban Sunglasses",
      price: "$89",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Ray-Ban Sunglasses",
      price: "$89",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Ray-Ban Sunbeam",
      price: "$89",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Ray-Ban Sundress",
      price: "$89",
    },
    {
      image: "/IMG/pexels-rfera-432059.jpg",
      name: "Graphic T-Shirt",
      price: "$25",
    },
  ];

  let searchInput = document.getElementById("search-input-section");
  let suggestionsContainer = document.getElementById(
    "search-suggestions-section"
  );
  let resultsContainer = document.getElementById("search-results-page");

  if (!searchInput || !suggestionsContainer || !resultsContainer) {
    console.error("❌ One or more elements are missing!");
    return;
  }

  searchInput.addEventListener("input", function () {
    let query = searchInput.value.trim().toLowerCase();
    console.log("User is typing:", query);
    suggestionsContainer.innerHTML = "";
    resultsContainer.innerHTML = "";

    if (query.length > 1) {
      // Show keyword suggestions
      let keywordMatches = keywordSuggestions
        .filter((word) => word.toLowerCase().includes(query))
        .slice(0, 10)
        .map(
          (word) => `<li class="list-group-item search-suggestion">${word}</li>`
        )
        .join("");

      if (keywordMatches) {
        suggestionsContainer.innerHTML = `<ul class="list-group">${keywordMatches}</ul>`;
        suggestionsContainer.style.display = "block";
      } else {
        suggestionsContainer.style.display = "none";
      }

      // Show matching products
      let matchingProducts = productList
        .filter((product) => product.name.toLowerCase().includes(query))
        .map(
          (product) => `
               <div class="col-6 col-md-3">
                <div class="product-item">
                    <button class="wishlist-btn" onclick="addToWishlist(this)">
                        <i class="fa fa-heart"></i>
                    </button>
                    
                    <a href="pdetails">
                        <img src="${product.image}" class="img-fluid" alt="Top">
                    </a>
                    
                    <h5><a href="pdetails">${product.name}</a></h5>
                    
                    <p>${product.price}</p>
                    
                    <h4 class="view-button" ><a href="pdetails">View This</a></h4>
                </div>
            </div>
          `
        )
        .join("");

      resultsContainer.innerHTML = matchingProducts
        ? `<div class="row justify-content-start">${matchingProducts}</div>`
        : "<p class='text-center'>No products found.</p>";
    } else {
      suggestionsContainer.style.display = "none";
    }
  });

  // Click suggestion to fill input
  document.addEventListener("click", function (event) {
    if (event.target.classList.contains("search-suggestion")) {
      console.log("Suggestion clicked:", event.target.innerText);
      searchInput.value = event.target.innerText;
      searchInput.dispatchEvent(new Event("input"));
      suggestionsContainer.style.display = "none";
    }
  });
});
