function renderListe(docs){
  $("liste-vide").hidden = docs.length > 0;
  $("liste-arrivants").innerHTML = docs.map(d => {
    const a = d.data(), total = a.nbTaches||0, faites = a.nbFaites||0;
    const pct = total ? Math.round(faites/total*100) : 0;
    return `<div class="carte">
      <div class="carte-tete"><strong>${esc(a.nom)}</strong>${a.matricule?`<span class="badge">CP : ${esc(a.matricule)}</span>`:""}</div>
      <div>Arrivée : <b>${fmtLong(a.dateArrivee)}</b></div>
      <div class="jauge"><div style="width:${pct}%"></div></div>
      <div class="carte-pied"><span>${faites}/${total} prérequis faits (${pct} %)</span>
      <button class="btn" data-ouvrir="${d.id}">Ouvrir →</button></div></div>`;
  }).join("");
}

function renderEntete(){
  const a = arrivantCourant; if(!a) return;
  $("detail-titre").textContent = `Arrivée de ${a.nom} le ${fmtLong(a.dateArrivee)}`;
  $("detail-matricule").textContent = "CP : " + (a.matricule || "—");
  const total = a.nbTaches||0, faites = a.nbFaites||0, pct = total ? Math.round(faites/total*100) : 0;
  $("jauge-plein").style.width = pct+"%";
  $("jauge-texte").textContent = `${faites}/${total} prérequis faits (${pct} %)`;
  if(!semDebut){
    semDebut = lundiDe(a.dateArrivee ? parseISO(a.dateArrivee) : new Date());
    renderSemaine();
  }
}

function renderChecklist(){
  $("corps-checklist").innerHTML = docsTaches.map(d => {
    const t = d.data();
    if (d.id === editionId) return `<tr>
      <td><input type="text" id="edit-desc" value="${esc(t.description)}"></td>
      <td><input type="date" id="edit-date" value="${t.date||""}"></td>
      <td class="centre">—</td>
      <td class="centre">
        <button class="btn-icone" data-action="save" data-id="${d.id}" title="Enregistrer">💾</button>
        <button class="btn-icone" data-action="cancel" title="Annuler">✖</button></td></tr>`;
    return `<tr class="${t.fait?"fait":""}">
      <td class="desc">${esc(t.description)}</td>
      <td><input type="date" data-action="date" data-id="${d.id}" value="${t.date||""}"></td>
      <td class="centre"><input type="checkbox" data-action="fait" data-id="${d.id}" ${t.fait?"checked":""}>
        ${t.fait?'<span class="badge badge-fait">Fait</span>':""}</td>
      <td class="centre">
        <button class="btn-icone" data-action="edit" data-id="${d.id}" title="Modifier">✏️</button>
        <button class="btn-icone" data-action="del"  data-id="${d.id}" title="Supprimer">🗑</button></td></tr>`;
  }).join("") || `<tr><td colspan="4" class="vide">Aucun prérequis.</td></tr>`;
}

function renderSemaine(){
  if(!semDebut) return;
  const jours = [...Array(7)].map((_,i)=> new Date(semDebut.getFullYear(), semDebut.getMonth(), semDebut.getDate()+i));
  const auj = toISO(new Date());
  $("sem-titre").textContent = "Semaine du " + semDebut.toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"});
  $("sem-entetes").innerHTML = `<div class="sem-coin"></div>` + jours.map(d =>
    `<div class="sem-jour ${toISO(d)===auj?"auj":""}">${d.toLocaleDateString("fr-FR",{weekday:"short",day:"2-digit",month:"2-digit"})}</div>`).join("");

  const parJour = new Map();
  docsPlanning.forEach(d => { const s = {id:d.id, ...d.data()}, k = s.date || "sans";
    if(!parJour.has(k)) parJour.set(k, []); parJour.get(k).push(s); });
  parJour.forEach(l => l.sort((a,b)=> normSlot(a).deb - normSlot(b).deb));

  const H = (FIN_JOURNEE - DEBUT_JOURNEE) * HOUR_H;
  let html = `<div class="sem-gutter" style="height:${H}px">` +
    [...Array(FIN_JOURNEE-DEBUT_JOURNEE)].map((_,i)=>
      `<div class="sem-heure" style="height:${HOUR_H}px">${String(DEBUT_JOURNEE+i).padStart(2,"0")}:00</div>`).join("") +
    `</div>`;
  jours.forEach(d => {
    const iso = toISO(d);
    const slots = parJour.get(iso)||[];
    html += `<div class="sem-col ${iso===auj?"auj":""}" data-jour="${iso}" style="height:${H}px">` +
      slots.map(s => {
        const {deb, fin} = normSlot(s);
        const top = (deb - DEBUT_JOURNEE) * HOUR_H;
        const h   = Math.max(22, (fin - deb) * HOUR_H - 2);
        return `<div class="sem-slot" data-cal-edit="${s.id}" style="top:${top}px;height:${h}px"
          title="${esc(labelHeure(deb,fin))} – ${esc(s.activite)}">
          <b>${esc(labelHeure(deb,fin))}</b><span class="txt">${esc(s.activite)}</span>
          <div class="sem-grip" title="Étirer / réduire"></div></div>`;
      }).join("") + `</div>`;
  });
  $("sem-corps").innerHTML = html;

  const sans = parJour.get("sans")||[];
  $("sem-sans-date").innerHTML = sans.length
    ? "Créneaux sans date : " + sans.map(s=>{ const {deb,fin} = normSlot(s);
        return `<span class="cal-slot" data-cal-edit="${s.id}">
          <span class="cal-h">${esc(labelHeure(deb,fin))}</span> ${esc(s.activite)}</span>`; }).join("")
    : "";
}

function renderModeleTaches(docs){
  $("corps-modele-taches").innerHTML = docs.map(d => { const t = d.data();
    return `<tr>
      <td><input type="text" data-mt-desc="${d.id}" value="${esc(t.description)}"></td>
      <td><input type="number" data-mt-off="${d.id}" value="${t.off ?? 0}" style="width:90px"></td>
      <td class="centre">
        <button class="btn-icone" data-mt-save="${d.id}" title="Enregistrer">💾</button>
        <button class="btn-icone" data-mt-del="${d.id}" title="Supprimer">🗑</button></td></tr>`;
  }).join("") || `<tr><td colspan="3" class="vide">Aucun prérequis type.</td></tr>`;
}

function renderModelePlanning(docs){
  $("corps-modele-planning").innerHTML = docs.map(d => { const s = d.data();
    return `<tr>
      <td><input type="number" data-mp-off="${d.id}" value="${s.off ?? 0}" style="width:90px"></td>
      <td><input type="text" data-mp-heure="${d.id}" value="${esc(s.heure||"")}"></td>
      <td><input type="text" data-mp-act="${d.id}" value="${esc(s.activite||"")}"></td>
      <td class="centre">
        <button class="btn-icone" data-mp-save="${d.id}" title="Enregistrer">💾</button>
        <button class="btn-icone" data-mp-del="${d.id}" title="Supprimer">🗑</button></td></tr>`;
  }).join("") || `<tr><td colspan="4" class="vide">Aucun créneau type.</td></tr>`;
}

function renderUsers(docs){
  const moi = auth.currentUser ? auth.currentUser.uid : null;
  $("corps-users").innerHTML = docs.map(d => { const u = d.data();
    return `<tr>
      <td>${esc(u.email||"")} ${d.id===moi?'<span class="badge">(vous)</span>':''}</td>
      <td>${esc(u.nom||"")}</td>
      <td>${u.role==="admin"?'<span class="badge badge-fait">Admin</span>':'<span class="badge">Utilisateur</span>'}</td>
      <td>${u.actif===false?'<span class="badge badge-off">Désactivé</span>':'<span class="badge badge-fait">Actif</span>'}</td>
      <td class="centre">
        <button class="btn-secondaire" data-u-role="${d.id}" style="padding:3px 8px;font-size:12px"
          title="Changer le rôle">${u.role==="admin"?"Rétrograder en utilisateur":"Promouvoir admin"}</button>
        <button class="btn-secondaire" data-u-actif="${d.id}" style="padding:3px 8px;font-size:12px"
          title="Désactiver ou réactiver l'accès">${u.actif===false?"✅ Réactiver":"⛔ Désactiver"}</button>
      </td></tr>`;
  }).join("") || `<tr><td colspan="5" class="vide">Aucun compte référencé.</td></tr>`;
}
