var myWindowId;
const contentBox = document.querySelector("#content");


//Make the content box editable as soon as the user mouses over the sidebar.
window.addEventListener("mouseover", () => {
  contentBox.setAttribute("contenteditable", true);
});



//Writing is saved when user moves mouse away
window.addEventListener("mouseout", () => {     //Run on event "mouseout of content box"
  
  contentBox.setAttribute("contenteditable", false);  //Set attribute contenteditable false so that css (background color) changes back

  browser.tabs.query({windowId: myWindowId, active: true}).then((tabs) => {   //Gets all tabs that have the specified properties (active tab in current window)
    let contentToStore = {};  //Dictionary where key:value is url:notes. We just store one pair.
    let currentUrl = tabs[0].url;
    contentToStore[currentUrl] = contentBox.textContent;
    browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
  });
});


//Fetch textbox's content. Run when changing/reloading a tab. Steps:
//  1) Get the active tab in this sidebar's window.
//  2) Get its stored content.
//  3) Put it in the content box.
function updateContent() {
  browser.tabs.query({windowId: myWindowId, active: true})  //Gets all tabs that have the specified properties (active tab in current window)
    .then((tabs) => {
      return browser.storage.local.get(tabs[0].url);
    })
    .then((storedInfo) => {
      contentBox.textContent = storedInfo[Object.keys(storedInfo)[0]];
    });
}


//Update content when a new tab becomes active.
browser.tabs.onActivated.addListener(updateContent);


//Update content when a new page is loaded into a tab.
browser.tabs.onUpdated.addListener(updateContent);


//When the sidebar loads, get the ID of its window and update its content.
browser.windows.getCurrent({populate: true}).then((windowInfo) => {
  myWindowId = windowInfo.id;
  updateContent();
});
