/////////////////////////////////
//  CREATE CONTEXT MENU ITEM   //
/////////////////////////////////

//Create a context menu item for when right-clicking links
browser.contextMenus.create(
    {
        id: "tag-seen",
        title: "Seen",
        contexts: ["link","page"],
        type: "checkbox",           //It's a checkbox, which makes it easy to tag/untag with a single context menu entry
        checked: false              //Regardles of initial state, it will change automatically whenever we open context menu
    }
);

browser.contextMenus.create(
    {
        id: "tag-reached",
        title: "Reached",
        contexts: ["link","page"],
        type: "checkbox",           //It's a checkbox, which makes it easy to tag/untag with a single context menu entry
        checked: false              //Regardles of initial state, it will change automatically whenever we open context menu
    }
);


availableTags = ["seen" , "reached"];



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

    //Step 2: Decide whether checkbox's check should be shown or hidden
    .then( 
        (storedInfo) => { showOrHideTick(storedInfo); } , 
        onStorageGetError
    )
}


function showOrHideTick(storedInfo){
    tagList = storedInfo[Object.keys(storedInfo)[0]];   //local.get() returns a map (with just 1 key:value pair), from which we extract the value of the first pair
    
    if (tagList === undefined)  //No info for this url found in local storage
        urlHasTag = false;   
    else
        urlHasTag = (tagList.includes("seen"));

    browser.contextMenus.update( "tag-seen" , {checked:urlHasTag}  )
    browser.contextMenus.refresh();
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

    if (info.menuItemId === "tag-seen") { //Our context menu item has been clicked

        //Get url of right-clicked item.
        if (info.linkUrl)      url = info.linkUrl;   //Clicked on a link
        else if (info.pageUrl) url = info.pageUrl;   //Clicked on current page (its background)
        else return;                                 //Clicked something else -> We have no url to check, stop here

        url = normalizeUrl(url);
        ToggleTagInLocalStorage(url, "seen", tab);
    }
}



//Given an URL and a tag, adds the tag to said URL in local storage (or removes it if tag was already applied).
//Accessing local storage is an asynchronous operation, so we need to do a sequence of .then().
function ToggleTagInLocalStorage(url, tag, tab){

    //Step 1: Fetch tagList for this url from local storage
    browser.storage.local.get(url)

    .then(
        (storedInfo) => { return( GetTagListFromFetchedMap(storedInfo) ); } , //Postprocess fetched data to extract the info we want only (the tagList)
        onStorageGetError   //get().then() 
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




//When we fetch data from local storage, we get a Map of key:value pairs. We just gave 1 key (the URL), so we get 1 pair.
//We only need the value (the URL's tagList), not the entire Map. This function extracts the value.
function GetTagListFromFetchedMap(storedInfo){
    tagList = storedInfo[Object.keys(storedInfo)[0]];   //local.get() returns a map (with just 1 key:value pair), from which we extract the value of the first pair

    if(tagList === undefined)   //This url had no data in local storage -> The returned value is undefined
        tagList = [];           //We create an empty list, which is easier to work with
    
    return(tagList);
}



//Given a tag and a list of tags, adds the tag if it wasn't in the list, or removes it if did. 
function ToggleTagInTagList(tagList, tag){

    if (!tagList.includes(tag))     tagList.push(tag);     //If it's not there, add it
    else                            tagList.pop(tag);      //If it's there already, remove it
        
    return(tagList);
}



//Save updated tagList back to local storage
function SaveTagList(url, tagList){
    let contentToStore = {};                    //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair
    contentToStore[url] = tagList;
    browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
}




function onStorageGetError(error) {
    //Failed to retrieve value from local storage
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}