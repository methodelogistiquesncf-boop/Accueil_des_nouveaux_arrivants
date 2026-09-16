function initUsersEvents(){
  $("form-user").addEventListener("submit", async e => {
    e.preventDefault();
    const email = $("us-email").value.trim().toLowerCase();
    const mdp   = $("us-mdp").value;
    const role  = $("us-role").value;
    const nom   = $("us-nom").value.trim();
    const msg   = $("user-msg");
    msg.className = "message";
    try {
      const cred = await createUserWithEmailAndPassword(authSecondaire, email, mdp);
      await signOut(authSecondaire);
      await setDoc(doc(db,"utilisateurs",cred.user.uid),
        { uid: cred.user.uid, email, nom, role, actif:true, creeLe: serverTimestamp() });
      msg.className = "message ok";
      msg.textContent = `✅ Compte créé pour ${email}. Communiquez-lui son mot de passe temporaire (il pourra le changer via « Mot de passe oublié »).`;
      e.target.reset();
    } catch(err){
      msg.className = "message erreur";
      msg.textContent = traduireErreur(err.code, err.message);
    }
  });

  $("corps-users").addEventListener("click", async e => {
    const b = e.target.closest("button"); if(!b) return;
    const moi = auth.currentUser ? auth.currentUser.uid : null;
    if(b.dataset.uRole){
      const id = b.dataset.uRole;
      const u = docsUsers.find(d=>d.id===id)?.data(); if(!u) return;
      const nouveau = u.role === "admin" ? "user" : "admin";
      if(id === moi && nouveau === "user" &&
         !confirm("Vous allez perdre vos droits admin (donc l'accès à cette page). Continuer ?")) return;
      await updateDoc(doc(db,"utilisateurs",id), { role: nouveau });
    }
    if(b.dataset.uActif){
      const id = b.dataset.uActif;
      const u = docsUsers.find(d=>d.id===id)?.data(); if(!u) return;
      if(id === moi){ alert("Vous ne pouvez pas désactiver votre propre compte."); return; }
      await updateDoc(doc(db,"utilisateurs",id), { actif: u.actif === false });
    }
  });
}
