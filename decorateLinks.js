
decorateAllLinksInPage();   //Since this script gets loaded as a content script, this function gets executed whenever a website is loaded


///////////////////
//  ENTRY POINT  //
///////////////////

//Fetches all links in the page and processes them
function decorateAllLinksInPage(){
    
    var linkNodes = document.links; //Get list of all links in the page

    for(var i=0; i<linkNodes.length; i++)
        decorateLinkIfNecessary(linkNodes[i]);
}



//Given a single html link node, fetches associated tag(s) and proceeds to decorate it
function decorateLinkIfNecessary(linkNode){
   
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

function DecideIfDecorationNeeded(tagList, linkNode){

    //browser.storage.local.get() -> Returns a Map with key:value pairs (just one pair, actually) ->  Get the value in the first pair
    tagList = storedMap[Object.keys(storedMap)[0]];

    if (typeof tagList == 'undefined')  return;     //No info for this url found in local storage
    else if (tagList.includes("seen"))              //Url had tag --> Append icon to link
        decorateLinkNode(linkNode);
}



//Run when failed to retrieve value from local storage 
function onFetchError(error) {
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}




/////////////////////////
//  ACTUAL DECORATION  //
/////////////////////////

//At this point we have retrieved the tagList from local memory

//Decorate a link (append icon)
function decorateLinkNode(linkNode){
    //Create <img> node
    var myImage = new Image(25, 20);
    myImage.src = getResourcesRuntimeUrl("icons/seen_20px.png");
    myImage.classList.add("st-decoration"); //Marks element as "decoration". Useful to find it later when updating decorations
    myImage.classList.add("st-icon");       //Type of decoration
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



//Inserts a new html node after another existing node (as a sibling, not a child)
function insertAfter(existingNode, newNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
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