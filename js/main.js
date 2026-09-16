function cacherSections(){
  $("vue-liste").hidden = true; $("vue-detail").hidden = true;
  $("vue-modele").hidden = true; $("vue-users").hidden = true;
}
function fermerDetail(){ unsubsDetail.forEach(u=>u()); unsubsDetail = []; idCourant = null; semDebut = null; }

function ouvrirDetail(id){
  fermerDetail(); idCourant = id;
  cacherSections(); $("vue-detail").hidden = false;
  unsubsDetail.push(onSnapshot(doc(db,"arrivants",id),
    s => { if(s.exists()){ arrivantCourant = {id:s.id, ...s.data()}; renderEntete(); } },
    err => console.error("Erreur fiche :", err)));
  unsubsDetail.push(onSnapshot(query(collection(db,"arrivants",id,"taches"), orderBy("date")),
    s => {
      docsTaches = s.docs.slice().sort((a,b)=>{
        const ta=a.data(), tb=b.data();
        return (ta.date||"").localeCompare(tb.date||"") || (ta.ordre||0)-(tb.ordre||0);
      });
      renderChecklist();
    },
    err => console.error("Erreur checklist :", err)));
  unsubsDetail.push(onSnapshot(query(collection(db,"arrivants",id,"planning"), orderBy("date")),
    s => {
      docsPlanning = s.docs.slice().sort((a,b)=>{
        const ta=a.data(), tb=b.data();
        return (ta.date||"").localeCompare(tb.date||"") || normSlot(ta).deb - normSlot(tb).deb;
      });
      renderSemaine();
    },
    err => console.error("Erreur planning :", err)));
}
function ouvrirModele(){ fermerDetail(); cacherSections(); $("vue-modele").hidden = false; }
function ouvrirUsers(){
  if(monRole !== "admin"){ alert("Accès réservé aux administrateurs."); return; }
  fermerDetail(); cacherSections(); $("vue-users").hidden = false;
}
function retourListe(){ fermerDetail(); cacherSections(); $("vue-liste").hidden = false; }
function majBtnUsers(){ $("btn-users").style.display = (monRole === "admin") ? "" : "none"; }

function demarrer(){
  if(appDemarree) return; appDemarree = true;

  $("btn-retour").onclick = retourListe;
  $("btn-retour-modele").onclick = retourListe;
  $("btn-retour-users").onclick = retourListe;
  $("btn-modele").onclick = ouvrirModele;
  $("btn-users").onclick = ouvrirUsers;
  $("liste-arrivants").addEventListener("click", e => { const b = e.target.closest("[data-ouvrir]"); if(b) ouvrirDetail(b.dataset.ouvrir); });

  initPlanningEvents();
  initModeleEvents();
  initUsersEvents();
  initDetailEvents();
  initNouvelArrivantEvents();

  /* Abonnements temps réel globaux */
  assurerModele();
  onSnapshot(query(collection(db,"arrivants"), orderBy("creeLe","desc")),
    s => renderListe(s.docs), err => console.error("Erreur liste :", err));
  onSnapshot(query(COL_MODELE_TACHES(), orderBy("ordre")),
    s => renderModeleTaches(s.docs), err => console.error("Erreur modèle tâches :", err));
  onSnapshot(query(COL_MODELE_PLANNING(), orderBy("ordre")),
    s => renderModelePlanning(s.docs), err => console.error("Erreur modèle planning :", err));
  onSnapshot(query(collection(db,"utilisateurs"), orderBy("email")),
    s => { docsUsers = s.docs; renderUsers(s.docs); }, err => console.error("Erreur utilisateurs :", err));
}

/* Point d'entrée appelé par le module Firebase de index.html */
function demarrerApp(){
  onAuthStateChanged(auth, gererChangementAuth);
  $("form-login").addEventListener("submit", gestionLogin);
  $("btn-forgot").addEventListener("click", gestionForgot);
  $("btn-deconnexion").addEventListener("click", gestionDeconnexion);
  if(/COLLEZ|VOTRE_PROJET/.test(firebaseConfig.apiKey + firebaseConfig.projectId)) $("cfg-warning").hidden = false;
}
