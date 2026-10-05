// ==========================================================================
// CONSTANTES DE CONFIGURACIÓN Y FUENTE DE VERDAD (Fase 2)
// ==========================================================================
const WHATSAPP_NUMBER = "573124233933";

// Actualización del año en el footer
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Menú móvil accesible
const menuButton = document.querySelector(".menu-toggle");
const menu = document.getElementById("main-menu");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
    });
  });
}

// ==========================================================================
// FUNCIÓN CENTRALIZADA DE WHATSAPP CON TRACKING (Fase 4 & 12)
// ==========================================================================
function openWhatsApp(customMessage, category = "General") {
  const defaultMessage = "Hola Dr. Sierra, quisiera obtener información para solicitar una consulta de columna.";
  const message = customMessage || defaultMessage;

  if (typeof gtag === "function") {
    gtag("event", "whatsapp_click", {
      event_category: "Contacto",
      event_label: category
    });
  }

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
}

// Botones de WhatsApp con mensaje según contexto
document.querySelectorAll(".btn-whatsapp").forEach(button => {
  button.addEventListener("click", (e) => {
    const context = e.currentTarget.getAttribute("data-whatsapp-context") || "General";
    let message = "Hola Dr. Sierra, me gustaría solicitar una cita de consulta.";

    if (context === "Hero") {
      message = "Hola Dr. Sierra, vi su sitio web y desearía consultar disponibilidad para agendar una cita.";
    } else if (context === "SegundaOpinion") {
      message = "Hola Dr. Sierra, solicito una cita de valoración para una Segunda Opinión Médica.";
    } else if (context === "Patologia") {
      const cardTitle = e.currentTarget.closest(".pathology-card")?.querySelector("h3")?.textContent || "mi condición";
      message = `Hola Dr. Sierra, desearía consultar sobre la atención para: ${cardTitle}.`;
    }

    openWhatsApp(message, context);
  });
});

document.getElementById("whatsapp-float")?.addEventListener("click", (e) => {
  e.preventDefault();
  openWhatsApp("Hola Dr. Sierra, desearía agendar una cita de consulta.", "BotonFlotante");
});

// ==========================================================================
// FORMULARIO DE CONTACTO DIRECTO A WHATSAPP (Fase 3)
// ==========================================================================
const contactForm = document.getElementById("contact-form");
const contactStatusMsg = document.getElementById("contact-status-msg");

if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const honeypot = document.getElementById("website_hp")?.value;
    if (honeypot) return;

    const name = document.getElementById("contact-name").value.trim();
    const phone = document.getElementById("contact-phone").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const reason = document.getElementById("contact-reason").value;
    const message = document.getElementById("contact-message").value.trim();

    if (!name || !phone || !email || !message) {
      if (contactStatusMsg) {
        contactStatusMsg.style.color = "#d9534f";
        contactStatusMsg.textContent = "Por favor completa todos los campos obligatorios (*).";
      }
      return;
    }

    const formattedMsg = `Hola Dr. Sierra, me gustaría solicitar una consulta:\n\n👤 Nombre: ${name}\n📞 Teléfono: ${phone}\n✉️ Correo: ${email}\n📋 Motivo: ${reason}\n💬 Mensaje: ${message}`;

    openWhatsApp(formattedMsg, "FormularioContacto");

    if (contactStatusMsg) {
      contactStatusMsg.style.color = "#20ba82";
      contactStatusMsg.textContent = "¡Solicitud generada! Se ha abierto WhatsApp para confirmar tu mensaje.";
    }
    contactForm.reset();
  });
}

// ==========================================================================
// TRACKING DE CONVERSIONES SECUNDARIAS GA4 (Fase 12)
// ==========================================================================

// Clic en enlaces de mapas
document.querySelectorAll('a[href*="maps"]').forEach(mapLink => {
  mapLink.addEventListener("click", () => {
    if (typeof gtag === "function") {
      gtag("event", "map_click", {
        event_category: "Ubicacion",
        event_label: "Google Maps Consultorio"
      });
    }
  });
});

// Clic en llamadas telefónicas
document.querySelectorAll('a[href^="tel:"]').forEach(phoneLink => {
  phoneLink.addEventListener("click", () => {
    if (typeof gtag === "function") {
      gtag("event", "phone_click", {
        event_category: "Contacto",
        event_label: "Llamada Directa"
      });
    }
  });
});
