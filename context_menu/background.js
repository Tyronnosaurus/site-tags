
//Create a context menu item for when right-clicking links
browser.contextMenus.create(
    {
        id: "tag-untag-link",
        title: "Tag/untag link",
        contexts: ["link"],
    }
);






//Define what to do when context menu item is clicked
//Gets called for any context menu item, but we later check if it's ours specifically
browser.contextMenus.onClicked.addListener(ContextMenuAction);



//Executed when (any) context menu item is clicked.
//If it's this webextension's item, we check the corresponding page's url and execute the command.
function ContextMenuAction(info, tab){
    
    if (info.menuItemId === "tag-untag-link") { //Our context menu item has been clicked

        var url = info.linkUrl;
        url = normalizeUrl(url);

        AppendTag(url, "seen");

    }
}




function AppendTag(url, tag){

    //Step 1: Grab currently saved list of tags for this url
    browser.storage.local.get(url)


    //Step 2: Append new tag if necessary
    .then( BuildFunction_AppendRemoveTag(tag) , onStorageGetError )


    //Step 3: Save updated list
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
                taglist = taglist.filter(item => item !== value);
        }

        return(tagList);
    }

    return(AppendTag);  //Return the whole function
}




//In the 3rd step, the then() receives a function as a parameter. This function receives the tagList returned by the promis in the 2nd step.
//We also need to pass url as a parameter, but javascript limitations make it impossible when working with promises.
//Therefore, we wrap the function in a bigger function that returns a function with the url 'hardcoded'.
function BuildFunction_SaveTagList(url){

    function SaveList(tagList){
        let contentToStore = {};                    //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair
        contentToStore[url] = tagList;
        browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
        console.log(contentToStore);
    }

    return(SaveList);   //Return the whole function
}




function onStorageGetError(error) {
    //Failed to retrieve value from local storage
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}