async function gestionLogin(e){
  e.preventDefault();
  const email = $("login-email").value.trim().toLowerCase();
  const password = $("login-password").value;
  const btn = $("btn-login");
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>Connexion…';
  effacerMessageAuth();
  try { await signInWithEmailAndPassword(auth, email, password); }
  catch(err){ afficherMessageAuth(traduireErreur(err.code, err.message) + "  [" + err.code + "]", "erreur"); }
  finally { btn.disabled = false; btn.textContent = "Se connecter"; }
}

async function gestionForgot(){
  const email = $("login-email").value.trim().toLowerCase();
  if(!email){ afficherMessageAuth("Saisissez d'abord votre email dans le champ ci-dessus, puis cliquez sur ce lien.", "erreur"); return; }
  effacerMessageAuth();
  try { await sendPasswordResetEmail(auth, email);
        afficherMessageAuth("✅ Un email de réinitialisation a été envoyé à " + email + ". Vérifiez votre boîte (et les spams).", "ok"); }
  catch(err){ afficherMessageAuth(traduireErreur(err.code, err.message) + "  [" + err.code + "]", "erreur"); }
}

const gestionDeconnexion = () => signOut(auth);

/* Appelé à chaque changement de session (connexion / déconnexion) */
async function gererChangementAuth(user){
  if(user){
    /* Profil Firestore : créé à la 1re connexion (le 1er compte devient admin) */
    try {
      const ref = doc(db,"utilisateurs",user.uid);
      const snap = await getDoc(ref);
      if(!snap.exists()){
        const cnt = await getCountFromServer(query(collection(db,"utilisateurs")));
        const role = (cnt.data().count === 0) ? "admin" : "user";
        await setDoc(ref, { uid:user.uid, email:user.email||"", nom:"", role, actif:true, creeLe:serverTimestamp() });
      }
    } catch(err){ console.error("Profil utilisateur :", err); }

    /* Surveillance de mon profil (rôle + désactivation) */
    if(unsubProfil) unsubProfil();
    unsubProfil = onSnapshot(doc(db,"utilisateurs",user.uid), s => {
      const p = s.data();
      if(p && p.actif === false){
        msgApresDeconnexion = "Compte désactivé. Contactez votre administrateur.";
        signOut(auth);
        return;
      }
      monRole = p ? p.role : "user";
      majBtnUsers();
    });

    $("vue-auth").style.display = "none";
    $("app").hidden = false;
    $("user-email").textContent = user.email;
    demarrer();
  } else {
    if(unsubProfil){ unsubProfil(); unsubProfil = null; }
    monRole = null; majBtnUsers();
    $("app").hidden = true;
    $("vue-auth").style.display = "flex";
    if(msgApresDeconnexion){ afficherMessageAuth(msgApresDeconnexion, "erreur"); msgApresDeconnexion = null; }
    else effacerMessageAuth();
    fermerDetail();
    cacherSections(); $("vue-liste").hidden = false;
    appDemarree = false;
  }
}
