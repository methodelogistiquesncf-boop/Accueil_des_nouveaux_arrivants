function majPendantDrag(){
  const b = drag.el.querySelector("b");
  if(b) b.textContent = labelHeure(drag.newDeb ?? drag.deb, drag.newFin ?? drag.fin);
}

function initDragAndDrop(){
  $("sem-corps").addEventListener("pointerdown", e => {
    const slot = e.target.closest(".sem-slot"); if(!slot) return;
    const id = slot.dataset.calEdit;
    const s = docsPlanning.find(d=>d.id===id)?.data(); if(!s) return;
    const {deb, fin} = normSlot(s);
    drag = { id, el: slot, mode: e.target.closest(".sem-grip") ? "resize" : "move",
             x0:e.clientX, y0:e.clientY, deb, fin, date:s.date || "",
             moved:false, newDate:null, newDeb:null, newFin:null };
    e.preventDefault();
  });
  window.addEventListener("pointermove", e => {
    if(!drag) return;
    const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
    if(!drag.moved && Math.abs(dy) < 5 && Math.abs(dx) < 5) return;
    if(!drag.moved){
      drag.moved = true;
      drag.el.classList.add("drag");
      drag.el.style.pointerEvents = "none";
      document.body.style.userSelect = "none";
    }
    const delta = Math.round(dy / HOUR_H / SNAP) * SNAP;
    if(drag.mode === "move"){
      const dur = drag.fin - drag.deb;
      const deb = Math.min(Math.max(drag.deb + delta, DEBUT_JOURNEE), FIN_JOURNEE - dur);
      const under = document.elementFromPoint(e.clientX, e.clientY);
      const col = under && under.closest ? under.closest(".sem-col") : null;
      drag.newDate = col ? col.dataset.jour : drag.date;
      drag.newDeb = deb; drag.newFin = deb + dur;
      drag.el.style.top = ((deb - DEBUT_JOURNEE) * HOUR_H) + "px";
      if(col && col !== drag.el.parentElement) col.appendChild(drag.el);
    } else {
      const fin = Math.min(Math.max(drag.fin + delta, drag.deb + SNAP), FIN_JOURNEE);
      drag.newDeb = drag.deb; drag.newFin = fin;
      drag.el.style.height = Math.max(20, (fin - drag.deb) * HOUR_H - 2) + "px";
    }
    majPendantDrag();
  });
  window.addEventListener("pointerup", async () => {
    if(!drag) return;
    const d = drag; drag = null;
    d.el.classList.remove("drag");
    d.el.style.pointerEvents = "";
    document.body.style.userSelect = "";
    if(!d.moved){ ouvrirDlgSlot(d.id); return; }
    const date = d.newDate ?? d.date;
    const deb  = d.newDeb  ?? d.deb;
    const fin  = d.newFin  ?? d.fin;
    if(!date) return;
    await updateDoc(doc(db,"arrivants",idCourant,"planning",d.id),
      { date, debut: hhmm(deb), fin: hhmm(fin), heure: labelHeure(deb,fin) });
  });
}

function ouvrirDlgSlot(id, dateDefaut, debutDefaut){
  slotEditId = id || null;
  if(id){
    const s = docsPlanning.find(d=>d.id===id)?.data(); if(!s) return;
    const {deb, fin} = normSlot(s);
    $("dlg-slot-titre").textContent = "Modifier le créneau";
    $("sl-date").value = s.date||"";
    $("sl-debut").value = hhmm(deb);
    $("sl-fin").value = hhmm(fin);
    $("sl-act").value = s.activite||"";
    $("sl-suppr").style.display = "";
  } else {
    const deb = hmToDec(debutDefaut || "09:00");
    $("dlg-slot-titre").textContent = "Nouveau créneau";
    $("sl-date").value = dateDefaut||"";
    $("sl-debut").value = hhmm(deb);
    $("sl-fin").value = hhmm(Math.min(deb + 1, FIN_JOURNEE));
    $("sl-act").value = "";
    $("sl-suppr").style.display = "none";
  }
  $("dlg-slot").showModal();
}

function initPlanningEvents(){
  $("sem-prev").onclick = () => { semDebut.setDate(semDebut.getDate()-7); renderSemaine(); };
  $("sem-next").onclick = () => { semDebut.setDate(semDebut.getDate()+7); renderSemaine(); };
  $("sem-aujourd").onclick = () => { semDebut = lundiDe(new Date()); renderSemaine(); };
  $("sem-ajout").onclick = () => {
    const t = new Date(), lundi = lundiDe(t);
    const dansSemaine = semDebut.getTime() === lundi.getTime();
    ouvrirDlgSlot(null, dansSemaine ? toISO(t) : toISO(semDebut), "09:00");
  };
  $("sem-corps").addEventListener("click", e => {
    if(e.target.closest(".sem-slot")) return;
    const col = e.target.closest(".sem-col");
    if(col){
      const rect = col.getBoundingClientRect();
      let h = DEBUT_JOURNEE + Math.floor((e.clientY - rect.top) / HOUR_H / SNAP) * SNAP;
      h = Math.min(Math.max(h, DEBUT_JOURNEE), FIN_JOURNEE - 1);
      ouvrirDlgSlot(null, col.dataset.jour, hhmm(h));
    }
  });
  initDragAndDrop();
  $("sem-sans-date").addEventListener("click", e => {
    const ed = e.target.closest("[data-cal-edit]"); if(ed) ouvrirDlgSlot(ed.dataset.calEdit);
  });
  $("sl-annuler").onclick = () => $("dlg-slot").close();
  $("sl-suppr").onclick = async () => {
    if(slotEditId && confirm("Supprimer ce créneau ?")){
      await deleteDoc(doc(db,"arrivants",idCourant,"planning",slotEditId));
      $("dlg-slot").close();
    }
  };
  $("form-slot-edit").addEventListener("submit", async e => {
    e.preventDefault();
    const date = $("sl-date").value;
    let deb = hmToDec($("sl-debut").value), fin = hmToDec($("sl-fin").value);
    const activite = $("sl-act").value.trim();
    if(!date || !activite) return;
    if(fin <= deb) fin = deb + 1;
    if(slotEditId) await updateDoc(doc(db,"arrivants",idCourant,"planning",slotEditId),
      { date, debut: hhmm(deb), fin: hhmm(fin), heure: labelHeure(deb,fin), activite });
    else await addDoc(collection(db,"arrivants",idCourant,"planning"),
      { date, debut: hhmm(deb), fin: hhmm(fin), heure: labelHeure(deb,fin), activite, ordre: Date.now() });
    $("dlg-slot").close();
  });
}
