

function saveOptions(e) {
  browser.storage.local.set({
    colour: document.querySelector("#colour").value
  });
  e.preventDefault();
}



function restoreOptions() {

  browser.storage.local.get('colour')
  .then( (res) => {document.querySelector("#managed-colour").innerText = res.colour;} );


  browser.storage.local.get('colour')
  .then( (res) => {document.querySelector("#colour").value = res.colour || 'Firefox red';} );

}



document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
