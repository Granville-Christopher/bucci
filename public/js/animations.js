window.addEventListener("load", function () {
    let heroText = document.querySelector(".hero-text")
    if(heroText){
        heroText.style.animation = "slideIn 1s ease-out forwards";
        document.querySelector(".hero-text .btn").style.animation = "slideUp 1s ease-out forwards 0.5s";
        document.querySelector(".hero-image img").style.animation = "zoomIn 1.5s ease-out forwards";
    }
});
