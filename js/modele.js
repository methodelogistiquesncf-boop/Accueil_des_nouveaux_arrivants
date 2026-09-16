async function assurerModele(){
  try {
    const metaRef = doc(db,"modele","standard");
    const metaSnap = await getDoc(metaRef);
    if(metaSnap.exists()) return;
    const batch = writeBatch(db);
    DEFAUT_MODELE.taches.forEach((t,i)   => batch.set(doc(COL_MODELE_TACHES()),   { ...t, ordre:i }));
    DEFAUT_MODELE.planning.forEach((s,i) => batch.set(doc(COL_MODELE_PLANNING()), { ...s, ordre:i }));
    batch.set(metaRef, { initialise:true, date: serverTimestamp() });
    await batch.commit();
  } catch(err){ console.error("Initialisation du modèle :", err); }
}

async function reinitialiserModele(){
  const [mt, mp] = await Promise.all([ getDocs(COL_MODELE_TACHES()), getDocs(COL_MODELE_PLANNING()) ]);
  const batch = writeBatch(db);
  mt.docs.forEach(d => batch.delete(d.ref));
  mp.docs.forEach(d => batch.delete(d.ref));
  batch.delete(doc(db,"modele","standard"));
  await batch.commit();
  await assurerModele();
}

async function regenererDepuisModele(){
  const a = arrivantCourant; if(!a) return;
  if(!confirm("Remplacer TOUS les prérequis et le planning de cet arrivant par le modèle type actuel,\navec dates recalculées sur la date d'arrivée ?\nLes cochages et modifications actuels seront perdus.")) return;
  const [mt, mp] = await Promise.all([
    getDocs(query(COL_MODELE_TACHES(),   orderBy("ordre"))),
    getDocs(query(COL_MODELE_PLANNING(), orderBy("ordre")))
  ]);
  const old = await Promise.all([
    getDocs(collection(db,"arrivants",idCourant,"taches")),
    getDocs(collection(db,"arrivants",idCourant,"planning"))
  ]);
  const batch = writeBatch(db);
  old.forEach(s => s.docs.forEach(d => batch.delete(d.ref)));
  mt.docs.forEach((d,i)=>{ const t = d.data();
    batch.set(doc(collection(db,"arrivants",idCourant,"taches")),
      { description:t.description, date:addDays(a.dateArrivee, t.off||0), fait:false, ordre:i }); });
  mp.docs.forEach((d,i)=>{ const s = d.data();
    const {deb, fin} = parseHeure(s.heure);
    batch.set(doc(collection(db,"arrivants",idCourant,"planning")),
      { date:addDays(a.dateArrivee, s.off||0), debut:hhmm(deb), fin:hhmm(fin),
        heure:labelHeure(deb,fin), activite:s.activite||"", ordre:i }); });
  batch.update(doc(db,"arrivants",idCourant), { nbTaches: mt.docs.length, nbFaites: 0 });
  await batch.commit();
}

function initModeleEvents(){
  $("btn-regenere").onclick = regenererDepuisModele;
  $("btn-reset-modele").onclick = async () => {
    if(!confirm("Réinitialiser le modèle type aux valeurs d'origine (celles de votre Excel) ?\nLes personnalisations actuelles du modèle seront perdues.")) return;
    await reinitialiserModele();
  };
  $("corps-modele-taches").addEventListener("click", async e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.dataset.mtSave){
      const id = b.dataset.mtSave;
      const desc = document.querySelector(`[data-mt-desc="${id}"]`).value.trim();
      const off  = parseInt(document.querySelector(`[data-mt-off="${id}"]`).value, 10) || 0;
      if(desc) await updateDoc(doc(db,"modele","standard","taches",id), { description: desc, off });
    }
    if(b.dataset.mtDel){
      if(confirm("Supprimer ce prérequis type ?")) await deleteDoc(doc(db,"modele","standard","taches",b.dataset.mtDel));
    }
  });
  $("form-modele-tache").addEventListener("submit", async e => {
    e.preventDefault();
    const desc = $("mt-desc").value.trim(); if(!desc) return;
    await addDoc(COL_MODELE_TACHES(),
      { description: desc, off: parseInt($("mt-off").value,10)||0, ordre: Date.now() });
    e.target.reset(); $("mt-off").value = 0;
  });
  $("corps-modele-planning").addEventListener("click", async e => {
    const b = e.target.closest("button"); if(!b) return;
    if(b.dataset.mpSave){
      const id = b.dataset.mpSave;
      const off   = parseInt(document.querySelector(`[data-mp-off="${id}"]`).value, 10) || 0;
      const heure = document.querySelector(`[data-mp-heure="${id}"]`).value.trim();
      const act   = document.querySelector(`[data-mp-act="${id}"]`).value.trim();
      if(act) await updateDoc(doc(db,"modele","standard","planning",id), { off, heure, activite: act });
    }
    if(b.dataset.mpDel){
      if(confirm("Supprimer ce créneau type ?")) await deleteDoc(doc(db,"modele","standard","planning",b.dataset.mpDel));
    }
  });
  $("form-modele-slot").addEventListener("submit", async e => {
    e.preventDefault();
    const act = $("ms-activite").value.trim(); if(!act) return;
    await addDoc(COL_MODELE_PLANNING(),
      { off: parseInt($("ms-off").value,10)||0, heure: $("ms-heure").value.trim(), activite: act, ordre: Date.now() });
    e.target.reset(); $("ms-off").value = 0;
  });
}
