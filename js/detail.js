/* ----- Checklist prérequis ----- */
function initChecklistEvents(){
  $("corps-checklist").addEventListener("change", async e => {
    const el = e.target, id = el.dataset.id; if(!id) return;
    if(el.dataset.action === "fait"){
      await updateDoc(doc(db,"arrivants",idCourant,"taches",id), { fait: el.checked });
      await updateDoc(doc(db,"arrivants",idCourant), { nbFaites: increment(el.checked ? 1 : -1) });
    }
    if(el.dataset.action === "date"){
      await updateDoc(doc(db,"arrivants",idCourant,"taches",id), { date: el.value });
    }
  });
  $("corps-checklist").addEventListener("click", async e => {
    const b = e.target.closest("button[data-action]"); if(!b) return;
    const id = b.dataset.id;
    if(b.dataset.action === "edit"){ editionId = id; renderChecklist(); }
    if(b.dataset.action === "cancel"){ editionId = null; renderChecklist(); }
    if(b.dataset.action === "save"){
      await updateDoc(doc(db,"arrivants",idCourant,"taches",id),
        { description: $("edit-desc").value.trim(), date: $("edit-date").value });
      editionId = null;
    }
    if(b.dataset.action === "del"){
      if(!confirm("Supprimer ce prérequis ?")) return;
      const fait = docsTaches.find(d=>d.id===id)?.data().fait;
      await deleteDoc(doc(db,"arrivants",idCourant,"taches",id));
      await updateDoc(doc(db,"arrivants",idCourant), { nbTaches: increment(-1), nbFaites: increment(fait ? -1 : 0) });
    }
  });
  $("form-tache").addEventListener("submit", async e => {
    e.preventDefault();
    const desc = $("tache-desc").value.trim(); if(!desc) return;
    await addDoc(collection(db,"arrivants",idCourant,"taches"),
      { description: desc, date: $("tache-date").value || "", fait:false, ordre: Date.now() });
    await updateDoc(doc(db,"arrivants",idCourant), { nbTaches: increment(1) });
    e.target.reset();
  });
}

/* ----- Création d'un arrivant ----- */
function initNouvelArrivantEvents(){
  $("btn-nouveau").onclick = () => { $("nv-date").value = toISO(new Date()); $("dlg-nouveau").showModal(); };
  $("btn-annuler").onclick = () => $("dlg-nouveau").close();
  $("form-nouveau").addEventListener("submit", async e => {
    e.preventDefault();
    const nom = $("nv-nom").value.trim(), dateArrivee = $("nv-date").value;
    if(!nom || !dateArrivee) return;
    let mtDocs = [], mpDocs = [];
    if($("nv-modele").checked){
      const [mt, mp] = await Promise.all([
        getDocs(query(COL_MODELE_TACHES(),   orderBy("ordre"))),
        getDocs(query(COL_MODELE_PLANNING(), orderBy("ordre")))
      ]);
      mtDocs = mt.docs; mpDocs = mp.docs;
    }
    const ref = await addDoc(collection(db,"arrivants"), {
      nom, matricule: $("nv-matricule").value.trim(), dateArrivee,
      nbTaches: mtDocs.length, nbFaites: 0, creeLe: serverTimestamp() });
    if(mtDocs.length || mpDocs.length){
      const batch = writeBatch(db);
      mtDocs.forEach((d,i)=>{ const t = d.data();
        batch.set(doc(collection(db,"arrivants",ref.id,"taches")),
          { description:t.description, date:addDays(dateArrivee, t.off||0), fait:false, ordre:i }); });
      mpDocs.forEach((d,i)=>{ const s = d.data();
        const {deb, fin} = parseHeure(s.heure);
        batch.set(doc(collection(db,"arrivants",ref.id,"planning")),
          { date:addDays(dateArrivee, s.off||0), debut:hhmm(deb), fin:hhmm(fin),
            heure:labelHeure(deb,fin), activite:s.activite||"", ordre:i }); });
      await batch.commit();
    }
    $("dlg-nouveau").close(); ouvrirDetail(ref.id);
  });
}

/* ----- Édition de la fiche (nom, CP, date) + décalage des dates ----- */
async function decalerDates(delta){
  const batch = writeBatch(db);
  docsTaches.forEach(d=>{ const t=d.data(); if(t.date) batch.update(d.ref, { date: addDays(t.date, delta) }); });
  docsPlanning.forEach(d=>{ const s=d.data(); if(s.date) batch.update(d.ref, { date: addDays(s.date, delta) }); });
  await batch.commit();
}

function initFicheEvents(){
  $("btn-edit-fiche").onclick = () => {
    const a = arrivantCourant; if(!a) return;
    $("f-nom").value = a.nom || "";
    $("f-cp").value  = a.matricule || "";
    $("f-date").value = a.dateArrivee || "";
    $("dlg-fiche").showModal();
  };
  $("f-annuler").onclick = () => $("dlg-fiche").close();
  $("form-fiche").addEventListener("submit", async e => {
    e.preventDefault();
    const a = arrivantCourant; if(!a) return;
    const nom = $("f-nom").value.trim(), cp = $("f-cp").value.trim(), date = $("f-date").value;
    if(!nom || !date) return;
    const ancienne = a.dateArrivee;
    await updateDoc(doc(db,"arrivants",idCourant), { nom, matricule: cp, dateArrivee: date });
    $("dlg-fiche").close();
    if(ancienne && date && date !== ancienne){
      const delta = Math.round((parseISO(date) - parseISO(ancienne)) / 86400000);
      if(delta !== 0 &&
         confirm(`La date d'arrivée a changé (${delta>0?"+":""}${delta} jour(s)).\nDécaler toutes les dates existantes (prérequis + planning) du même nombre de jours ?`)){
        await decalerDates(delta);
      }
      semDebut = null;   // recentre le calendrier sur la nouvelle date
    }
  });
}

/* ----- Suppression d'un arrivant ----- */
function initSuppressionEvents(){
  $("btn-suppr-arrivant").onclick = async () => {
    if(!confirm("Supprimer définitivement cet arrivant et tout son suivi ?")) return;
    const snaps = await Promise.all([ getDocs(collection(db,"arrivants",idCourant,"taches")),
                                      getDocs(collection(db,"arrivants",idCourant,"planning")) ]);
    const batch = writeBatch(db);
    snaps.forEach(s => s.docs.forEach(d => batch.delete(d.ref)));
    batch.delete(doc(db,"arrivants",idCourant));
    await batch.commit(); retourListe();
  };
}

function initDetailEvents(){
  initChecklistEvents();
  initFicheEvents();
  initSuppressionEvents();
}
