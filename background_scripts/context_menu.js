
existingTags = ["seen" , "reached"];


//////////////////////////////////
//  CREATE CONTEXT MENU ITEMS   //
//////////////////////////////////

//For each existing tag, create a right-click context menu item to toggle it.
//Note: there can only be one context menu item per extension. If we have more than one tag, they appear in a submenu.
for (i=0; i<existingTags.length; i++){

    browser.contextMenus.create(
        {
            id: "id-" + existingTags[i],
            title: existingTags[i],
            contexts: ["link","page"],
            type: "checkbox",           //It's a checkbox, which makes it easy to tag/untag with a single context menu entry
            checked: false              //Regardles of initial state, it will change automatically whenever we open context menu
        }
    );

}






///////////////////////
//  UPDATE CHECKBOX  //
///////////////////////

//Update checkbox's tick (checked/unchecked) when opening context menu.
//  Context menu is opened -> Check url of right-clicked item -> Fetch taglist on local storage -> 
//  -> Decide whether to show/hide tick -> Actually show/hide tick -> Refresh context menu

browser.contextMenus.onShown.addListener(UpdateCheckboxsCheck);

function UpdateCheckboxsCheck(info, tab){

    //Get url of right-clicked item.
    //Note: to read info, you need permission "<all_urls>" in manifest.json
    if (info.contexts.includes("link"))      url = info.linkUrl;   //Clicked on a link
    else if (info.contexts.includes("page")) url = info.pageUrl;   //Clicked on current page (anywhere on its background)
    else return;                                                   //Clicked something else -> We have no url to check, stop here

    url = normalizeUrl(url);

    //Step 1: Retrieve url's tagList from local storage
    browser.storage.local.get(url)

    .then(
        (storedInfo) => { return( GetTagListFromFetchedMap(storedInfo) ); } , //Postprocess fetched data to extract the info we want only (the tagList)
        onStorageGetError   //get().then() also requires a callback function for when fetching from local storage fails
    )

    //Step 2: Decide whether checkbox's check should be shown or hidden
    .then(
        (tagList) => { showOrHideTick(tagList, existingTags); }
    )

}






function showOrHideTick(tagList){

    //We loop through all existing tags. For each one, check if this link has it or not, and show/hide the tick accordingly
    for (i=0; i<existingTags.length; i++){

        urlHasTag = (tagList.includes(existingTags[i]));

        browser.contextMenus.update( "id-" + existingTags[i] , {checked:urlHasTag}  )
        browser.contextMenus.refresh();

    }
}





///////////////////////////////
//  CLICK CONTEXT MENU ITEM  //
///////////////////////////////

//Define what to do when context menu item is clicked
//Gets called for any context menu item, but we later check if it's ours specifically
browser.contextMenus.onClicked.addListener(ContextMenuAction);


//Executed when (any) context menu item is clicked.
//If it's this webextension's item, we check the corresponding page's url and execute the command.
function ContextMenuAction(info, tab){

    //We loop through all existing tags. For each one, check if this link has it or not, and show/hide the tick accordingly
    for (i=0; i<existingTags.length; i++){
        
        ctxtmenuID = ("id-" + existingTags[i]); //e.g. "id-seen" is the id of the context menu that toggles tag "seen"
        
        if (info.menuItemId === ctxtmenuID) {   //Was this the clicked context menu item?

            //Get url of right-clicked item
            if (info.linkUrl)      url = info.linkUrl;   //Context menu opened on a link
            else if (info.pageUrl) url = info.pageUrl;   //Context menu opened on current page (anywhere on its background)
            else return;                                 //Clicked something else -> We have no url to check, stop here. Just in case, shouldn't happen.

            url = normalizeUrl(url);
            ToggleTagInLocalStorage(url, existingTags[i], tab);
        }
    }

}



//Given an URL and a tag, adds the tag to said URL in local storage (or removes it if tag was already applied).
//Accessing local storage is an asynchronous operation, so we need to do a sequence of .then().
function ToggleTagInLocalStorage(url, tag, tab){

    //Step 1: Fetch tagList for this url from local storage
    browser.storage.local.get(url)

    .then(
        (storedInfo) => { return( GetTagListFromFetchedMap(storedInfo) ); } , //Postprocess fetched data to extract the info we want only (the tagList)
        onStorageGetError
    )


    //Step 2: Append/remove tag in list
    //Note: We need to return() whatever is returned by the wrapped function ToggleTagInTagList(). This way it is passed to step 3 as an input argument.
    .then(
        (tagList) => { return( ToggleTagInTagList(tagList, tag) ); }        
    )


    //Step 3: Save updated list back to local storage
    .then(
        (newTagList) => { SaveTagList(url, newTagList); }
    )


    //Step 4: Send command to tab to run code to redecorate links
    .then(
        () => { browser.tabs.sendMessage(tab.id , "cmd: update icons"); }
    );
 
}





//Given a tag and a list of tags, adds the tag if it wasn't in the list, or removes it if did. 
function ToggleTagInTagList(tagList, tag){

    if (!tagList.includes(tag))     tagList.push(tag);                                  //If it's not there, add it
    else                            tagList = tagList.filter(item => item !== tag);     //If it's there already, remove it
    
    return(tagList);
}



//Save updated tagList back to local storage
function SaveTagList(url, tagList){
    let contentToStore = {};                    //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair
    contentToStore[url] = tagList;
    browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
}




