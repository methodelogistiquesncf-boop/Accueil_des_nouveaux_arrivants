const $ = id => document.getElementById(id);
const esc = s => (s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseISO = s => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); };
const toISO = d => d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const addDays = (iso, off) => { const d = parseISO(iso); d.setDate(d.getDate()+off); return toISO(d); };
const fmtLong = iso => iso ? parseISO(iso).toLocaleDateString("fr-FR",{weekday:"long",day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
const lundiDe = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay()+6)%7)); return x; };

/* Heures */
const hmToDec = hm => { const p = (hm||"").split(":"); return (+p[0]||0) + ((+p[1]||0)/60); };
const hhmm = dec => String(Math.floor(dec)).padStart(2,"0") + ":" + String(Math.round((dec%1)*60)).padStart(2,"0");
function parseHeure(str){
  const m = (str||"").match(/(\d{1,2})[:hH](\d{2})?/g) || [];
  const vals = m.map(x=>{ const p = x.match(/(\d{1,2})[:hH](\d{2})?/); return (+p[1]) + (p[2] ? (+p[2])/60 : 0); });
  let deb = vals.length ? vals[0] : 9;
  let fin = vals.length > 1 ? vals[1] : deb + 1;
  if(fin <= deb) fin = deb + 1;
  deb = Math.min(Math.max(deb, DEBUT_JOURNEE), FIN_JOURNEE - 0.5);
  fin = Math.min(Math.max(fin, deb + 0.5), FIN_JOURNEE);
  return { deb, fin };
}
function normSlot(s){
  if(s && s.debut){
    const d = hmToDec(s.debut), f = s.fin ? hmToDec(s.fin) : d + 1;
    return { deb: d, fin: (f > d ? f : d + 1) };
  }
  return parseHeure(s ? s.heure : "");
}
const labelHeure = (deb, fin) => hhmm(deb) + "–" + hhmm(fin);

/* Erreurs Firebase en français */
const ERREURS_FR = {
  "auth/invalid-email":"Adresse email invalide.",
  "auth/user-disabled":"Ce compte a été désactivé.",
  "auth/user-not-found":"Aucun compte trouvé avec cet email. Contactez votre administrateur pour qu'il crée votre accès.",
  "auth/wrong-password":"Mot de passe incorrect.",
  "auth/invalid-credential":"Email ou mot de passe incorrect. Si vous n'avez pas de compte, contactez votre administrateur.",
  "auth/email-already-in-use":"Un compte existe déjà avec cet email.",
  "auth/weak-password":"Mot de passe trop faible (6 caractères minimum).",
  "auth/too-many-requests":"Trop de tentatives. Réessayez dans quelques minutes.",
  "auth/operation-not-allowed":"Connexion email/mot de passe non activée dans la console Firebase.",
  "auth/network-request-failed":"Problème de connexion internet.",
  "auth/missing-password":"Veuillez saisir un mot de passe.",
};
const traduireErreur = (code, message) => ERREURS_FR[code] || message || "Une erreur est survenue.";

function afficherMessageAuth(txt, type){ const el = $("auth-message"); el.textContent = txt; el.className = "message " + type; }
function effacerMessageAuth(){ $("auth-message").className = "message"; $("auth-message").textContent = ""; }
