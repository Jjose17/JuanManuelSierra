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
    setDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyB9ndh-LFqNXEbcRWr12tR6xSQhnDaOzNo",
    authDomain: "doctor-sierra.firebaseapp.com",
    projectId: "doctor-sierra",
    storageBucket: "doctor-sierra.firebasestorage.app",
    messagingSenderId: "168314821376",
    appId: "1:168314821376:web:d221297df2864f6251f1e5",
    measurementId: "G-265K7C89MY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null;
let currentRating = 5;

// Elementos DOM
const authPrompt = document.getElementById("auth-prompt");
const reviewFormContainer = document.getElementById("review-form-container");
const btnGoogleLogin = document.getElementById("btn-google-login");
const btnLogout = document.getElementById("btn-logout");
const userName = document.getElementById("user-name");
const userAvatar = document.getElementById("user-avatar");
const reviewForm = document.getElementById("review-form");
const reviewComment = document.getElementById("review-comment");
const charCount = document.getElementById("char-count");
const reviewConsent = document.getElementById("review-consent");
const reviewsList = document.getElementById("reviews-list");
const stars = document.querySelectorAll("#star-rating .star");

// Contador de caracteres
reviewComment?.addEventListener("input", () => {
    if (charCount) charCount.textContent = reviewComment.value.length;
});

// Selector de estrellas
stars.forEach(star => {
    star.addEventListener("click", () => {
        currentRating = parseInt(star.dataset.value);
        stars.forEach(s => {
            s.classList.toggle("active", parseInt(s.dataset.value) <= currentRating);
        });
    });
});

// Control de Estado de Autenticación
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authPrompt.style.display = "none";
        reviewFormContainer.style.display = "block";
        userName.textContent = user.displayName || "Usuario de Google";
        userAvatar.src = user.photoURL || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(user.displayName || "U");
    } else {
        authPrompt.style.display = "flex";
        reviewFormContainer.style.display = "none";
    }
});

btnGoogleLogin?.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo completar el inicio de sesión con Google.");
    }
});

btnLogout?.addEventListener("click", () => signOut(auth));

// Guardar/Actualizar Opinión (FASE 8: 1 documento por UID de usuario)
reviewForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!reviewConsent || !reviewConsent.checked) {
        alert("Debes aceptar la autorización de publicación antes de enviar tu opinión.");
        return;
    }

    const text = reviewComment.value.trim();
    if (text.length < 5 || text.length > 500) {
        alert("El comentario debe tener entre 5 y 500 caracteres.");
        return;
    }

    const submitBtn = document.getElementById("btn-submit-review");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando a moderación...";

    try {
        // setDoc con ID = currentUser.uid para evitar duplicados
        await setDoc(doc(db, "opiniones", currentUser.uid), {
            userId: currentUser.uid,
            name: currentUser.displayName || "Usuario de Google",
            photo: currentUser.photoURL || "",
            rating: currentRating,
            comment: text,
            status: "pending", // Siempre vuelve a revisión si modifica
            createdAt: serverTimestamp()
        });

        reviewComment.value = "";
        if (charCount) charCount.textContent = "0";
        if (reviewConsent) reviewConsent.checked = false;
        currentRating = 5;
        stars.forEach(s => s.classList.add("active"));

        alert("¡Gracias! Tu opinión ha sido recibida y pasará por un proceso de revisión antes de ser publicada.");

    } catch (error) {
        console.error("Error al guardar opinión:", error);
        alert("Ocurrió un error al enviar la opinión: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publicar opinión";
    }
});

// Cargar SOLAMENTE opiniones APROBADAS (status == 'approved')
const q = query(
    collection(db, "opiniones"),
    where("status", "==", "approved"),
    orderBy("createdAt", "desc")
);

onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
        reviewsList.innerHTML = '<p class="empty-text">Aún no hay opiniones publicadas. Las opiniones recibidas están en proceso de verificación.</p>';
        return;
    }

    reviewsList.innerHTML = "";
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const card = document.createElement("article");
        card.className = "review-card";

        const starsDiv = document.createElement("div");
        starsDiv.className = "review-stars";
        starsDiv.textContent = "★".repeat(data.rating || 5) + "☆".repeat(5 - (data.rating || 5));

        const commentP = document.createElement("p");
        commentP.className = "review-text";
        commentP.textContent = `"${data.comment}"`;

        const authorDiv = document.createElement("div");
        authorDiv.className = "review-author";

        const img = document.createElement("img");
        img.src = data.photo || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(data.name || "U");
        img.alt = data.name || "Usuario";

        const metaDiv = document.createElement("div");
        const nameStrong = document.createElement("strong");
        nameStrong.textContent = data.name || "Usuario de Google";

        // FASE 6: Texto conceptualmente exacto
        const tagSmall = document.createElement("small");
        tagSmall.textContent = "Publicado por una cuenta autenticada de Google";

        metaDiv.appendChild(nameStrong);
        metaDiv.appendChild(tagSmall);
        authorDiv.appendChild(img);
        authorDiv.appendChild(metaDiv);

        card.appendChild(starsDiv);
        card.appendChild(commentP);
        card.appendChild(authorDiv);

        reviewsList.appendChild(card);
    });
}, (error) => {
    console.error("Error al cargar opiniones:", error);
    reviewsList.innerHTML = '<p class="empty-text">No se pudieron cargar las opiniones.</p>';
});
