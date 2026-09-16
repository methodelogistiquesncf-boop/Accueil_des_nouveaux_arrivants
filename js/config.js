/* ==================== CONFIG FIREBASE ==================== */
const firebaseConfig = {
  apiKey: "AIzaSyAzbOkSQraq6bZqh2BLwQ0A61ZAQQuNX9U",
  authDomain: "accueildesarrivants.firebaseapp.com",
  projectId: "accueildesarrivants",
  storageBucket: "accueildesarrivants.firebasestorage.app",
  messagingSenderId: "252923959783",
  appId: "1:252923959783:web:5451cc95fa4ce3b0418542"
};
/* ========================================================= */

/* Réglages de la vue semaine */
const DEBUT_JOURNEE = 7, FIN_JOURNEE = 19, HOUR_H = 44, SNAP = 0.5;

/* Chemins du modèle type */
const COL_MODELE_TACHES   = () => collection(db,"modele","standard","taches");
const COL_MODELE_PLANNING = () => collection(db,"modele","standard","planning");

/* Propositions type par défaut (contenu de votre Excel) */
const DEFAUT_MODELE = {
  taches: [
    { off:-5, description:"Commander le PC portable" },
    { off:-5, description:"Récupérer le calendrier d'alternance (Seb Dubresson)" },
    { off:-5, description:"Créer compte Reflex (profil Gstock)" },
    { off:-3, description:"Basculer l'écran de Lucas vers l'alternant si possible" },
    { off:-3, description:"Badge accès magasin + badge pour badger (jour d'arrivée donné par RH)" },
    { off: 0, description:"Accueil Mika / Ami" },
    { off: 0, description:"Récupérer les EPIs (gilet, chaussures, casquette…)" },
    { off: 0, description:"Visite du site en général + visite LI" },
    { off: 0, description:"Diffusion des documents et mise à jour avec Gequi" },
    { off: 0, description:"Voir si besoin de facilité de circulation en attendant" },
    { off: 1, description:"Accueil sécurité (9h00–11h00)" },
    { off: 2, description:"Planning « vie ma vie » avec les équipes (réception, expédition, prélèvement, rangement, kitting, ordo, stock, appros)" },
    { off: 2, description:"Formation base : comment vient le besoin … et Reflex" },
  ],
  planning: [
    { off:0, heure:"08:00–09:00", activite:"Accueil & récupération des EPI" },
    { off:0, heure:"10:00–12:00", activite:"Visite du site en général + visite LI" },
    { off:0, heure:"13:00",       activite:"Diffusion documentaire" },
    { off:1, heure:"09:00–11:00", activite:"Accueil sécurité" },
    { off:1, heure:"13:00",       activite:"Vie ma vie – Réception" },
    { off:1, heure:"14:00",       activite:"Vie ma vie – Rangement" },
    { off:1, heure:"15:00",       activite:"Vie ma vie – Kitting" },
    { off:1, heure:"16:00",       activite:"Vie ma vie – Ordo" },
    { off:1, heure:"16:30",       activite:"Vie ma vie – Appro" },
    { off:1, heure:"17:00",       activite:"Vie ma vie – Gstock" },
  ]
};
