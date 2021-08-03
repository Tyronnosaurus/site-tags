
//Create a context menu item for when right clicking links
browser.contextMenus.create(
    {
        id: "tag-website",
        title: "Tag website",
        contexts: ["link"],
    }
);


//Define what to do when context menu item is clicked
//Gets called for any context menu item, but we later check if it's ours specifically
browser.contextMenus.onClicked.addListener(ContextMenuAction);




function ContextMenuAction(info, tab){
    
    if (info.menuItemId === "tag-website") { //Our context menu item has been clicked

        var url = info.linkUrl;
        url = normalizeUrl(url);

        AppendTag(url, "seen");

    }
}




function AppendTag(url, tag){

    //Step 1: Grab currently saved list of tags for this url
    browser.storage.local.get(url)


    //Step 2: Append new tag if necessary
    .then(
        (storedInfo) => {

            tagList = storedInfo[Object.keys(storedInfo)[0]];   //local.get() returns a map (with just 1 pair), from which we extract the value of the first pair

            if(typeof tagList == 'undefined'){  //This url had no data in local storage -> The returned value is "undefined"
                tagList = [tag];                //We create a new list with the tag we want to save
            } else {                             
                if (!tagList.includes(tag))     //Otherwise, get the existing tagList and append the new tag if it isn't there already 
                    tagList.push(tag);            
            }
            
            return(tagList);
        }
    
        , onStorageGetError
    )


    //Step 3: Save updated list
    .then(
        (tagList) => {
            let contentToStore = {};                    //Map (aka Dictionary) where keys are URLs and values are their notes. We just store one pair
            contentToStore[url] = tagList;
            console.log(contentToStore);
            browser.storage.local.set(contentToStore);  //Save the dictionary's pair in local storage
        }
    )
 
}



function onStorageGetError(error) {
    //Failed to retrieve value from local storage
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}