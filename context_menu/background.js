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




///////////////////////
//  UPDATE CHECKBOX  //
///////////////////////

//Update checkbox's tick when opening context menu.
//  Context menu is opened -> Check url of right-clicked item -> Fetch taglist on local storage -> 
//  Decide wether to show/hide tick -> Actually show/hide tick -> Refresh context menu

browser.contextMenus.onShown.addListener(UpdateCheckboxsCheck);

function UpdateCheckboxsCheck(info, tab){

    //Get url of right-clicked item.
    //Note: to read info, you need permission "<all_urls>" in manifest.json
    if (info.contexts.includes("link"))      url = info.linkUrl;   //Clicked on a link
    else if (info.contexts.includes("page")) url = info.pageUrl;   //Clicked on current page (it's background)
    url = normalizeUrl(url);


    //Step 1: Retrieve url's tagList from local storage
    browser.storage.local.get(url)

    //Step 2: Decide whether checkbox's check should be shown or hidden
    .then( 
        (storedInfo) => {
            tagList = storedInfo[Object.keys(storedInfo)[0]];   //local.get() returns a map (with just 1 key:value pair), from which we extract the value of the first pair
            
            if (typeof tagList == 'undefined')  return(false);   //No info for this url found in local storage
            else if (!tagList.includes("seen")) return(false);   //Url doesn't have this tag
            else if (tagList.includes("seen"))  return(true);    //Url does have this tag
            else                                return(false);   //Just in case. Shouldn't reach this.
        }   
    , onStorageGetError )

    //Step 3: Show/hide check
    .then(
        (urlHasTag) => {
            browser.contextMenus.update( "tag-seen" , {checked:urlHasTag}  )
            browser.contextMenus.refresh();
        }
    )

}







//Define what to do when context menu item is clicked
//Gets called for any context menu item, but we later check if it's ours specifically
browser.contextMenus.onClicked.addListener(ContextMenuAction);



//Executed when (any) context menu item is clicked.
//If it's this webextension's item, we check the corresponding page's url and execute the command.
function ContextMenuAction(info, tab){
    
    if (info.menuItemId === "tag-seen") { //Our context menu item has been clicked

        const url = normalizeUrl(info.linkUrl);

        ToggleTagInLocalStorage(url, "seen");

    }
}




function ToggleTagInLocalStorage(url, tag){

    //Step 1: Fetch tagList for this url from local storage
    browser.storage.local.get(url)


    //Step 2: Append/remove tag in list
    .then( BuildFunction_AppendRemoveTag(tag) , onStorageGetError )


    //Step 3: Save updated list back to local storage
    .then( BuildFunction_SaveTagList(url) )
 
}




//Returns an AppendTag function where 'tag' is hardcoded.
//We do this "wrapping" because javascript's promises won't let us use 'tag' as an argument in step 2.
function BuildFunction_AppendRemoveTag(tag){

    function AppendRemoveTag(storedInfo){
        tagList = storedInfo[Object.keys(storedInfo)[0]];   //local.get() returns a map (with just 1 key:value pair), from which we extract the value of the first pair

        if(typeof tagList == 'undefined'){  //This url had no data in local storage -> The returned value is "undefined"
            tagList = [tag];                //We create a new list with just the tag we want to save
        } else {                             
            if (!tagList.includes(tag))     //Otherwise, get the existing tagList and append the new tag if it isn't there already 
                tagList.push(tag);
            else  
                tagList = tagList.filter(item => item !== tag);   //If it's there already, remove it
        }

        return(tagList);
    }

    return(AppendRemoveTag);  //Return the whole function
}




//In the 3rd step, the then() receives a function as a parameter. This function receives the tagList returned by the promis in the 2nd step.
//We also need to pass url as a parameter, but javascript limitations make it impossible when working with promises.
//Therefore, we wrap the function in a bigger function that returns a function with the url 'hardcoded'.
function BuildFunction_SaveTagList(url){

    function SaveList(tagList){
        let contentToStore = {};                    //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair
        contentToStore[url] = tagList;
        browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
    }

    return(SaveList);   //Return the whole function
}




function onStorageGetError(error) {
    //Failed to retrieve value from local storage
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}