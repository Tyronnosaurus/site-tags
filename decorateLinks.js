
decorateAllLinksInPage();   //Since this script gets loaded as a content script, this function gets executed whenever a website is loaded


///////////////////
//  ENTRY POINT  //
///////////////////

//Fetches all links in the page and processes them
function decorateAllLinksInPage(){
    
    var linkNodes = document.links; //Get list of all links in the page

    for(var i=0; i<linkNodes.length; i++)
        getTagsAndProcessLink(linkNodes[i]);
}



//Given a single html link node, fetches associated tag(s) and proceeds to decorate it
function getTagsAndProcessLink(linkNode){
   
    const url = normalizeUrl(linkNode.href);

    //Start an asynchronous query to retrieve any value under the 'url' key in local storage.
    browser.storage.local.get(url)

    //The function above is an asynchronous promise. Using 'then()', we can pass 2 functions (success & fail) that will be executed when it finishes.
    //The 'success' function is given, as a parameter, whatever is returned by browser.storage.local.get(url).
    //Since we also need to pass 'linkNode' to it, we create an arrow function that just takes 'storedMap' and wrap a function that takes both params.
    .then( 
        (storedMap) => { 
            //Parse return value of browser.storage.local.get()
            // It returns a Map of key:value pairs (url:tagList) -> We queried for 1 key, so the Map just has 1 pair -> Get the value in the first pair (a list of 0 or more tags).
            tagList = storedMap[Object.keys(storedMap)[0]];

            //If we had never tagged this url, it will find nothing in local storage -> Returns {key:'undefined'} ->
            // -> We convert it to an empty list, which is easier to work with
            if (tagList == undefined) tagList = [];

            AddOrRemoveDecorationsToLink(linkNode, tagList)
        },
        onFetchError
    );

}


//Run when failed to retrieve value from local storage 
function onFetchError(error) {
    //Note: not finding data for a specific key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}





////////////////////////////////////////
// DECIDE TO APPEND/REMOVE DECORATION //
////////////////////////////////////////

//Now that we know the URL's tag(s), decide whether to add or remove decoration
function AddOrRemoveDecorationsToLink(linkNode, tagList){

    appliedTags = getCurrentlyAppliedTags(linkNode);

    //We've now got two lists:
    //  tagList: tags that are associated to the URL, so the corresponding icon needs to be appended
    //  appliedTags: tags that are appended to the link in the live page

    //If a tag is in tagList but not in appliedTags, apply the decoration. This ensures no decoration is applied twice.
    for (i=0; i<tagList.length; i++)
        if ( !appliedTags.includes(tagList[i]) )
            addDecorationForSingleTag(linkNode, tagList[i]);

    //If a tag is in appliedTags but not in tagList, we have to delete it from the page. The user likely just unchecked it.
    for (i=0; i<appliedTags.length; i++)
        if ( !tagList.includes(appliedTags[i]) )
            removeDecorationForSingleTag(linkNode,appliedTags[i]);

}







/////////////////////////
//  ACTUAL DECORATION  //
/////////////////////////

//Decorate a link (append icon)
function addDecorationForSingleTag(linkNode, tag){
    appendIcon(linkNode, tag);
}



function appendIcon(linkNode, tag){
    //Create <img> node
    var myImage = new Image(25, 20);
    myImage.src = getResourcesRuntimeUrl("icons/seen_20px.png");
    myImage.classList.add("st-decoration"); //Marks element as "decoration". Useful to find it later when updating decorations
    myImage.classList.add("st-seen");       //Associated tag

    //In the HTML, insert icon inside the link node
    linkNode.appendChild(myImage);
}



//Get runtime url of a resource (a file included with the extension)
function getResourcesRuntimeUrl(relativePath){
    //relativePath is the file's relative path to manifest.json in the extension's folder structure.
    //This is not really accessible by the browser during runtime.

    //Instead, we need something like:  moz-extension://2c127fa4-62c7-7e4f-90e5-472b45eecfdc/icons/file.ext
    //The long number is a randomly generated ID for every browser instance. This prevents fingerprinting.
    
    //The file must have been made accessible in manifest.json -> web_accessible_resources.
    return( browser.runtime.getURL(relativePath) );
}



//Given a link element, removes icon for a specific tag
function removeDecorationForSingleTag(linkNode, tag){
    el_list = linkNode.getElementsByClassName("st-"+tag)    //Get all children with st-tagname class
    if (el_list.length == 0)   return;                      //Return if list is empty
    el_list[0].remove();                                    //Remove first element from page (in a given link, there should only be one icon per tag)
}


//Looks up which tags have already been applied to the link (as in, which icons it has already)
//Returns list of tags, i.e. [seen, have, want]
function getCurrentlyAppliedTags(linkNode){
    appliedTagList = [];
    el_list = linkNode.getElementsByClassName("st-decoration");
    //if (el_list.length == 0) return([]);    //None found -> return empty list

    for(i=0; i<el_list.length; i++){
        tagClass = el_list[i].classList[1];  //Get class that defines corresponding tag (i.e. st-seen)
        tagName = tagClass.substring(3);     //Get everything after "st-"
        appliedTagList.push(tagName);
    }

    return(appliedTagList);
}




///////////////////////////////
//  REDECORATE ON TAG CHANGE //
///////////////////////////////

//When a tag is toggled, the link decoration only changes when reloading the page.
//However, with this code it also redecorates when user toggles a tag using the context menu.

browser.runtime.onMessage.addListener(
    (message) => {
        if (message == "cmd: update icons")
            decorateAllLinksInPage();
    }
);