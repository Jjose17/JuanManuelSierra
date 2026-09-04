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
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB9ndh-LFqNXEbcRWr12tR6xSQhnDaOzNo",
    authDomain: "doctor-sierra.firebaseapp.com",
    projectId: "doctor-sierra",
    storageBucket: "doctor-sierra.firebasestorage.app",
    messagingSenderId: "168314821376",
    appId: "1:168314821376:web:d221297df2864f6251f1e5",
    measurementId: "G-265K7C89MY"
};

// Inicializar Firebase
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
const reviewsList = document.getElementById("reviews-list");
const stars = document.querySelectorAll("#star-rating .star");

// 1. Selector interactivo de estrellas
stars.forEach(star => {
    star.addEventListener("click", () => {
        currentRating = parseInt(star.dataset.value);
        stars.forEach(s => {
            s.classList.toggle("active", parseInt(s.dataset.value) <= currentRating);
        });
    });
});

// 2. Control de Estado de Autenticación
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        authPrompt.style.display = "none";
        reviewFormContainer.style.display = "block";
        userName.textContent = user.displayName || "Paciente";
        userAvatar.src = user.photoURL || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(user.displayName || "P");
    } else {
        authPrompt.style.display = "flex";
        reviewFormContainer.style.display = "none";
    }
});

// 3. Iniciar sesión con Google
btnGoogleLogin?.addEventListener("click", async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error al iniciar sesión:", error);
        alert("No se pudo iniciar sesión con Google: " + error.message);
    }
});

// 4. Cerrar sesión
btnLogout?.addEventListener("click", () => signOut(auth));

// 5. Guardar opinión en Firestore
reviewForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    const text = reviewComment.value.trim();
    if (!text) return;

    const submitBtn = document.getElementById("btn-submit-review");
    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    try {
        await addDoc(collection(db, "opiniones"), {
            name: currentUser.displayName || "Paciente verificado",
            photo: currentUser.photoURL || "",
            rating: currentRating,
            comment: text,
            createdAt: serverTimestamp()
        });

        reviewComment.value = "";
        // Resetear estrellas a 5
        currentRating = 5;
        stars.forEach(s => s.classList.add("active"));
        alert("¡Muchas gracias! Tu opinión ha sido publicada con éxito.");
    } catch (error) {
        console.error("Error al guardar la opinión:", error);
        alert("Hubo un error al publicar la opinión: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Publicar opinión";
    }
});

// 6. Escuchar y mostrar opiniones en tiempo real
const q = query(collection(db, "opiniones"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
        reviewsList.innerHTML = '<p class="empty-text">Aún no hay opiniones publicadas. ¡Sé el primero en calificar la consulta!</p>';
        return;
    }

    reviewsList.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const starString = "★".repeat(data.rating || 5) + "☆".repeat(5 - (data.rating || 5));
        const avatar = data.photo || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(data.name || "P");

        const card = document.createElement("article");
        card.className = "review-card";
        card.innerHTML = `
      <div class="review-stars">${starString}</div>
      <p class="review-text">"${data.comment}"</p>
      <div class="review-author">
        <img src="${avatar}" alt="${data.name}" />
        <div>
          <strong>${data.name}</strong>
          <small>Opinión verificada con Google</small>
        </div>
      </div>
    `;
        reviewsList.appendChild(card);
    });
}, (error) => {
    console.error("Error al cargar opiniones:", error);
    reviewsList.innerHTML = '<p class="empty-text">No se pudieron cargar las opiniones.</p>';
});
