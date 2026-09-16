/* ----- PWA : service worker + bouton d'installation ----- */
(function initPWA(){
  if("serviceWorker" in navigator){
    window.addEventListener("load", () =>
      navigator.serviceWorker.register("sw.js")
        .catch(err => console.error("Service worker :", err)));
  }

  let evenementInstall = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    evenementInstall = e;
    $("btn-install").style.display = "";
  });
  $("btn-install").onclick = async () => {
    if(!evenementInstall) return;
    evenementInstall.prompt();
    await evenementInstall.userChoice;
    evenementInstall = null;
    $("btn-install").style.display = "none";
  };
  window.addEventListener("appinstalled", () => { $("btn-install").style.display = "none"; });
})();
