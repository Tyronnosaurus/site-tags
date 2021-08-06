
decorateAllLinksInPage();   //Since this script gets loaded as a content script, this function gets executed whenever a website is loaded


//Fetches all links in the page and decorates those that have a tag
function decorateAllLinksInPage(){
    
    var linkNodes = document.links; //Get list of all links in the page

    for(var i=0; i<linkNodes.length; i++)
        decorateLinkIfNecessary(linkNodes[i]);
}



//Given a single html link node, decorates it if it has a tag
function decorateLinkIfNecessary(linkNode){
   
    const url = normalizeUrl(linkNode.href);

    //Start an asynchronous query to retrieve any value under the 'url' key in local storage.
    browser.storage.local.get(url)

    //The function above is a promise. Using 'then()', we can pass 2 functions (success & fail) that will be executed when it finishes.
    //When the success function is executed, it will get passed as a parameter whatever was returned by browser.storage.local.get(url).
    .then(BuildFunction_DecideIfDecorationNeeded(linkNode) , onFetchError);

}




//Due to the way javascript's promises work, the function inside then() only gets passed whatever is returned by the local.get() (storedMap).
//In order to pass extra parameters, we do this wrapping: a function that accepts any parameters and hardcodes them into another function that we return.
function BuildFunction_DecideIfDecorationNeeded(linkNode){

    function DecideIfDecorationNeeded(storedMap){
        //Succeded fetching local storage --> Returns a Map with key:value pairs.
        //Since we provided only one key, we get a Map with one pair.
        //If the specified key didn't exist in local storage, value 'undefined' will be returned

        //Get the value in the first pair of the Map
        tagList = storedMap[Object.keys(storedMap)[0]];

        if (typeof tagList == 'undefined')  return;     //No info for this url found in local storage
        else if (tagList.includes("seen"))              //Url had tag --> Append icon to link
            decorateLinkNode(linkNode);
    }

    return(DecideIfDecorationNeeded);   //Return the whole function

}


//Run when failed to retrieve value from local storage 
function onFetchError(error) {
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}






//Decorate a link (append icon)
function decorateLinkNode(linkNode){
    //Create <img> node
    var myImage = new Image(25, 20);
    myImage.src = getResourcesRuntimeUrl("icons/seen_20px.png");
    myImage.classList.add("st-decoration"); //Marks element as "decoration". Useful to find it later when updating decorations
    myImage.classList.add("st-icon");       //Type of decoration
    myImage.classList.add("st-seen");       //Associated tag

    //In the html, insert the image after the link (not inside) 
    insertAfter(linkNode, myImage);
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



//Inserts a new html node after another existing node
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