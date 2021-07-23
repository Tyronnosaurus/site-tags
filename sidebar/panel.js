var myWindowId;
const contentBox = document.querySelector("#content");


//Make the content box editable as soon as the user mouses over the sidebar.
window.addEventListener("mouseover", () => {
  contentBox.setAttribute("contenteditable", true);
});



////////////////
//   SAVING   //
////////////////

//Writing is saved when user moves mouse away
window.addEventListener("mouseout", saveOnMouseout);


//Disable textbox and save contents 
function saveOnMouseout(){
  contentBox.setAttribute("contenteditable", false);  //Set attribute contenteditable false so that css (background color) changes back

  let querying = browser.tabs.query({windowId:myWindowId, active: true});  //Fetch active tab in current window
  querying.then(saveContents, onError); //saveContents() will be run asynchronously when tab is fetched
}


function saveContents(tabs){

  notes = contentBox.textContent;

  if (!(!notes || notes.length === 0)) { //Make sure it's not empty. Otherwise we'll save an empty string every time we move the mouse over the textbox

    let contentToStore = {};        //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair.
    let currentUrl = tabs[0].url;
    contentToStore[currentUrl] = contentBox.textContent;

    browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
  }

}

function onError(error){
  console.log("Could not fetch active tab");
}



/////////////////
//   LOADING   //
/////////////////

//When the sidebar loads, get the ID of its window and update its content.
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});

//Update content when a new tab becomes active.
browser.tabs.onActivated.addListener(updateContent);


//Update content when a new page is loaded into a tab.
browser.tabs.onUpdated.addListener(updateContent);



//Fetch textbox's content. Run when changing/reloading a tab. Steps:
//  1) Get the active tab in this sidebar's window.
//  2) Get its stored content.
//  3) Put it in the content box.
function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})  //Asynchronously get active tab
  .then(getUrlNotes)                                        //When done, asynchronously fetch its notes
  .then(putNotesInContentBox);                              //When done, asynchronously load them in the textbox
}

function getUrlNotes(tabs){
  return( browser.storage.local.get(tabs[0].url) );
}

function putNotesInContentBox(storedInfo){
  contentBox.textContent = storedInfo[Object.keys(storedInfo)[0]];
}