
const whatsappNumber = "3124233933"; // Tengo que reemplazar con el numero oficial
const whatsappMessage = "Hola, quisiera obtener información para solicitar una consulta con el Dr. Juan Manuel Sierra La Rotta.";

document.getElementById("year").textContent = new Date().getFullYear();

const menuButton = document.querySelector(".menu-toggle");
const menu = document.getElementById("main-menu");
menuButton.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(isOpen));
  menuButton.innerHTML = isOpen ? 'Cerrar <span>×</span>' : 'Menú <span>☰</span>';
});

menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  menu.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = 'Menú <span>☰</span>';
}));

document.getElementById("whatsapp-button").addEventListener("click", () => {
  if (!whatsappNumber) {
    alert("Aún falta configurar el número oficial de WhatsApp en el archivo script.js.");
    return;
  }
  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`, "_blank", "noopener");
});
