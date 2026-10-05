import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ==========================================================================
// CONFIGURACIÓN Y LISTA BLANCA DE ADMINISTRADORES (FASE 11)
// ==========================================================================
// Agrega aquí los correos autorizados para administrar el sitio:
const ADMIN_EMAILS = [
    "chiquibar2007@gmail.com", // Reemplazar o agregar tus correos reales
    "doctor.sierra@gmail.com"
];

const firebaseConfig = {
    apiKey: "AIzaSyB9ndh-LFqNXEbcRWr12tR6xSQhnDaOzNo",
    authDomain: "doctor-sierra.firebaseapp.com",
    projectId: "doctor-sierra",
    storageBucket: "doctor-sierra.firebasestorage.app",
    messagingSenderId: "168314821376",
    appId: "1:168314821376:web:d221297df2864f6251f1e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentStatusFilter = "pending";
let allReviews = [];

const adminAuthGuard = document.getElementById("admin-auth-guard");
const adminDashboard = document.getElementById("admin-dashboard");
const btnLogin = document.getElementById("btn-admin-login");
const btnLoginMain = document.getElementById("btn-admin-login-main");
const btnLogout = document.getElementById("btn-admin-logout");
const reviewsList = document.getElementById("admin-reviews-list");

// Iniciar sesión con Google
[btnLogin, btnLoginMain].forEach(btn => {
    btn?.addEventListener("click", () => signInWithPopup(auth, provider));
});

btnLogout?.addEventListener("click", () => signOut(auth));

// Control de roles de administrador
onAuthStateChanged(auth, (user) => {
    if (user && user.email) {
        const userEmail = user.email.toLowerCase();
        const isAdmin = ADMIN_EMAILS.some(email => email.toLowerCase() === userEmail);

        if (isAdmin) {
            adminAuthGuard.style.display = "none";
            adminDashboard.style.display = "block";
            if (btnLogin) btnLogin.style.display = "none";
            if (btnLogout) btnLogout.style.display = "inline-block";
            loadReviews();
        } else {
            // Usuario no autorizado
            adminDashboard.style.display = "none";
            adminAuthGuard.style.display = "block";
            adminAuthGuard.innerHTML = `
                <h3 style="color: #d9534f;">🚫 Acceso Denegado</h3>
                <p style="color: var(--muted); margin-bottom: 20px;">
                    La cuenta <strong>${escapeHtml(user.email)}</strong> no tiene permisos de administración.
                </p>
                <button id="btn-switch-account" class="button button-small button-dark-outline">Cambiar de cuenta</button>
            `;
            document.getElementById("btn-switch-account")?.addEventListener("click", () => signOut(auth));
            if (btnLogin) btnLogin.style.display = "none";
            if (btnLogout) btnLogout.style.display = "inline-block";
        }
    } else {
        adminAuthGuard.style.display = "block";
        adminDashboard.style.display = "none";
        adminAuthGuard.innerHTML = `
            <h3>Acceso Restringido</h3>
            <p style="color: var(--muted); margin-bottom: 20px;">Debes iniciar sesión con una cuenta autorizada de administrador.</p>
            <button id="btn-admin-login-main" class="button button-emerald">Iniciar Sesión con Google</button>
        `;
        document.getElementById("btn-admin-login-main")?.addEventListener("click", () => signInWithPopup(auth, provider));
        if (btnLogin) btnLogin.style.display = "inline-block";
        if (btnLogout) btnLogout.style.display = "none";
    }
});

// Filtros por pestaña
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        currentStatusFilter = e.currentTarget.dataset.status;
        renderReviews();
    });
});

function loadReviews() {
    const q = query(collection(db, "opiniones"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snapshot) => {
        allReviews = [];
        snapshot.forEach(docSnap => {
            allReviews.push({ id: docSnap.id, ...docSnap.data() });
        });
        updateCounts();
        renderReviews();
    }, (error) => {
        console.error("Error al cargar opiniones en Admin:", error);
        reviewsList.innerHTML = `<p style="color:red; padding: 20px;">Error al cargar opiniones: ${error.message}</p>`;
    });
}

function updateCounts() {
    // Se usa el fallback (r.status || "pending") para contar adecuadamente las reseñas previas
    const pending = allReviews.filter(r => (r.status || "pending") === "pending").length;
    const approved = allReviews.filter(r => r.status === "approved").length;
    const rejected = allReviews.filter(r => r.status === "rejected").length;

    const elP = document.getElementById("count-pending");
    const elA = document.getElementById("count-approved");
    const elR = document.getElementById("count-rejected");

    if (elP) elP.textContent = pending;
    if (elA) elA.textContent = approved;
    if (elR) elR.textContent = rejected;
}

function renderReviews() {
    const filtered = allReviews.filter(r => (r.status || "pending") === currentStatusFilter);
    reviewsList.innerHTML = "";

    if (filtered.length === 0) {
        reviewsList.innerHTML = `<p style="color: var(--muted); padding: 20px; background: #fff; border-radius: 8px;">No hay opiniones con estado "${currentStatusFilter}".</p>`;
        return;
    }

    filtered.forEach(review => {
        const card = document.createElement("div");
        card.className = "admin-review-card";

        const currentStatus = review.status || "pending";
        const badgeClass = currentStatus === "approved" ? "badge-approved" : (currentStatus === "rejected" ? "badge-rejected" : "badge-pending");
        const statusLabel = currentStatus === "approved" ? "Aprobada" : (currentStatus === "rejected" ? "Rechazada" : "Pendiente");

        const starsText = "★".repeat(review.rating || 5) + "☆".repeat(5 - (review.rating || 5));

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <span class="badge-status ${badgeClass}">${statusLabel}</span>
                    <strong style="margin-left: 10px; font-size: 16px;">${escapeHtml(review.name || "Usuario")}</strong>
                    <span style="color: #f0ad4e; margin-left: 8px;">${starsText}</span>
                </div>
                <small style="color: var(--muted);">${review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString() : "Reciente"}</small>
            </div>

            <p style="font-size: 15px; color: var(--ink); margin: 6px 0;">"${escapeHtml(review.comment || "")}"</p>

            <div class="admin-review-actions">
                ${currentStatus !== "approved" ? `<button class="btn-approve" data-id="${review.id}">Aprobar</button>` : ""}
                ${currentStatus !== "rejected" ? `<button class="btn-reject" data-id="${review.id}">Rechazar</button>` : ""}
                <button class="btn-delete" data-id="${review.id}">Eliminar</button>
            </div>
        `;

        card.querySelector(".btn-approve")?.addEventListener("click", () => updateStatus(review.id, "approved"));
        card.querySelector(".btn-reject")?.addEventListener("click", () => updateStatus(review.id, "rejected"));
        card.querySelector(".btn-delete")?.addEventListener("click", () => deleteReview(review.id));

        reviewsList.appendChild(card);
    });
}

async function updateStatus(id, newStatus) {
    try {
        await updateDoc(doc(db, "opiniones", id), {
            status: newStatus
        });
    } catch (error) {
        alert("Error al actualizar estado: " + error.message);
    }
}

async function deleteReview(id) {
    if (!confirm("¿Está seguro de eliminar esta opinión de forma permanente?")) return;
    try {
        await deleteDoc(doc(db, "opiniones", id));
    } catch (error) {
        alert("Error al eliminar la opinión: " + error.message);
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
