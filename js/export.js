/* ===== Export du planning : impression + envoi par mail (capture) ===== */
(function initExport(){

  /* ---------- En-tête commun (impression + capture) ---------- */
  function remplirEnteteExport(){
    const a = arrivantCourant; if(!a) return;
    $("entete-impression").innerHTML =
      `<h2 style="margin:0 0 4px;color:#1565c0">📅 Planning d'accueil — ${esc(a.nom)}
         <span style="font-size:13px">(CP : ${esc(a.matricule||"—")})</span></h2>
       <p style="margin:0 0 10px;font-size:12px;color:#556">
         Arrivée le ${fmtLong(a.dateArrivee)} · ${esc($("sem-titre").textContent)} ·
         Édité le ${new Date().toLocaleDateString("fr-FR")} à
         ${new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</p>`;
  }

  /* ---------- Impression ---------- */
  function imprimerPlanning(){
    if(!arrivantCourant) return;
    remplirEnteteExport();
    document.body.classList.add("impression-planning");
    window.print();
  }
  window.addEventListener("afterprint", () => document.body.classList.remove("impression-planning"));

  /* ---------- Capture d'image du planning ---------- */
  let blobImage = null;
  async function genererCapture(){
    remplirEnteteExport();
    document.body.classList.add("capture-en-cours");
    try {
      const canvas = await html2canvas($("zone-capture"), { backgroundColor:"#ffffff", scale:2, logging:false });
      return await new Promise(res => canvas.toBlob(res, "image/png"));
    } finally {
      document.body.classList.remove("capture-en-cours");
    }
  }

  async function copierImage(blob){
    try {
      if(window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
        await navigator.clipboard.write([ new ClipboardItem({ "image/png": blob }) ]);
        return true;
      }
    } catch(err){ console.error("Copie image :", err); }
    return false;
  }

  function telechargerImage(blob, nom){
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const nomFichier = () => {
    const a = arrivantCourant;
    return `planning-${(a ? a.nom : "arrivant").toLowerCase().replace(/[^a-z0-9]+/g,"-")}-${semDebut ? toISO(semDebut) : ""}.png`;
  };
  const sujetDefaut = () => {
    const a = arrivantCourant;
    return `Planning d'accueil – ${a ? a.nom : ""} – ${$("sem-titre").textContent}`;
  };
  const corpsDefaut = () => {
    const a = arrivantCourant;
    return `Bonjour,

Veuillez trouver ci-dessous le planning d'accueil de ${a ? a.nom : ""} (arrivée le ${a ? fmtLong(a.dateArrivee) : ""}).

📋 L'image du planning est dans le presse-papiers : faites Ctrl+V dans le corps du message.
Elle a aussi été téléchargée en PNG si vous préférez la joindre en pièce jointe.

Cordialement,
${(auth.currentUser && auth.currentUser.email) || ""}`;
  };

  /* ---------- Fenêtre d'envoi ---------- */
  async function ouvrirDlgMail(){
    if(!arrivantCourant) return;
    blobImage = null;
    $("mail-etat").textContent = "⏳ Génération de la capture…";
    $("dlg-mail").showModal();
    $("mail-sujet").value = sujetDefaut();
    $("mail-corps").value = corpsDefaut();
    try {
      blobImage = await genererCapture();
      const ok = await copierImage(blobImage);
      $("mail-etat").textContent = ok
        ? "✅ Capture copiée dans le presse-papiers : ouvrez Outlook puis Ctrl+V dans le message."
        : "⚠️ Copie automatique impossible ici : téléchargez l'image et joignez-la au mail.";
    } catch(err){
      console.error(err);
      $("mail-etat").textContent = "⚠️ Capture impossible : utilisez 🖨️ Imprimer ou réessayez.";
    }
  }

  /* ---------- Événements ---------- */
  $("sem-print").onclick = imprimerPlanning;
  $("sem-mail").onclick  = ouvrirDlgMail;
  $("mail-annuler").onclick = () => $("dlg-mail").close();
  $("mail-copier").onclick = async () => {
    if(!blobImage) return;
    $("mail-etat").textContent = (await copierImage(blobImage))
      ? "✅ Image copiée : Ctrl+V dans Outlook."
      : "⚠️ Copie impossible sur ce navigateur.";
  };
  $("mail-telecharger").onclick = () => { if(blobImage) telechargerImage(blobImage, nomFichier()); };
  $("mail-outlook-desktop").onclick = () => {
    if(blobImage) telechargerImage(blobImage, nomFichier());
    const to      = encodeURIComponent(($("mail-dest").value||"").trim());
    const subject = encodeURIComponent($("mail-sujet").value);
    const body    = encodeURIComponent($("mail-corps").value);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };
  $("mail-outlook-web").onclick = () => {
    if(blobImage) telechargerImage(blobImage, nomFichier());
    const to      = encodeURIComponent(($("mail-dest").value||"").trim());
    const subject = encodeURIComponent($("mail-sujet").value);
    const body    = encodeURIComponent($("mail-corps").value);
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`, "_blank");
  };
})();
