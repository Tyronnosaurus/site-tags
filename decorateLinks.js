
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
            if (tagList === undefined) tagList = [];

            DecideIfDecorationNeeded(tagList, linkNode)
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
function DecideIfDecorationNeeded(tagList, linkNode){

    if (tagListIsEmpty(tagList)) return;

    else if (tagList.includes("seen"))              //Url had tag --> Decorate link
        decorateLinkNode(linkNode, tagList);

}




//Returns true if a tagList is empty (because it was never created or it has been emptied)
function tagListIsEmpty(tagList){
    if (typeof tagList == 'undefined') return(true);     //No info for this url found in local storage -> Returns 'undefined' tagList.
                                                         // (should never happen since getTagsAndProcessLink() already deals with it).
    else if (tagList.length === 0)     return(true);     //Taglist exists but it's empty
    return(false);                                       //Taglist exists and it's not empty
}



/////////////////////////
//  ACTUAL DECORATION  //
/////////////////////////

//Decorate a link (append icon)
function decorateLinkNode(linkNode, tagList){
    appendIcon(linkNode);
}



function appendIcon(linkNode){
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




//A decorated link has one or more icons appended at the end. They have this format:
//    <img class="st-decoration st-{tagName}" src="path/to/image">

//To check if a link has any decoration, we can just check if the last child has the st-decoration class.
function isAlreadyDecorated(linkNode){
    if(linkNode.lastChild == null) return(false);                   //Make sure there's actually a last child (could be empty)
    if(linkNode.lastChild.classList === undefined) return(false);   //Make sure it has a classList
    return(linkNode.lastChild.classList.contains("st-decoration")); //Check if it has the st-decoration class
}


//To check if a link has a specific tag decoration, we check every child looking for the class st-{tagName}
function isAlreadyDecoratedWithTag(linkNode, tag){
    children = linkNode.children;
    classToLookFor = "st-" + tag;

    for (var i=children.length-1; i>=0; i--) {  //Loop through children nodes (backwards, since the decoration is likely one of the last)
        if(linkNode.lastChild.classList === undefined) return(false);   //Make sure node has a classList
        if (children[i].classList.contains(classToLookFor)) return(true);
    }

    return(false);  //Class wasn't found -> Link does not have specified decoration
}


//Given a link element, removes icon for a specific tag
function removeDecorationSingleTag(linkNode, tag){
    el_list = linkNode.getElementsByClassName("st-"+tag)    //Get all children with st-tagname class
    if (el_list.length == 0)   return;                      //Return if list is empty
    el_list[0].remove();                                    //Remove first element from page (in a given link, there should only be one icon per tag)
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