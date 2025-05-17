document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        let category = this.getAttribute('data-category');
        fetchProducts(category);
    });
});

function fetchProducts(category) {
    // Placeholder function to dynamically load products
    console.log(`Fetching products for category: ${category}`);
    
    // This will later be replaced with an actual API/database call
}
