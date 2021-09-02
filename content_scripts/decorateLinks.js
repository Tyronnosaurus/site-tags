
decorateAllLinksInPage();   //Since this script gets loaded as a content script, this function gets executed whenever a website is loaded


///////////////////
//  ENTRY POINT  //
///////////////////

//Fetches all links in the page and decorates them
function decorateAllLinksInPage(){
    
    //Get list of all links in the page
    var linkNodes = document.links;

    //Make list with URLs of all links in page.
    //This will let us fetch tagLists of all URLs in a single operation, rather than one by one.
    urlList = [];
    for(var i=0; i<linkNodes.length; i++)
        urlList.push( normalizeUrl(linkNodes[i].href) );

    //Fetch taglists in local storage.
    //This operation is asynchronous and any further operations must be registered with '.then()'.
    //get() will return a Map of url:tagList pairs.
    browser.storage.local.get(urlList)

    .then(
        (mapOfTaglists) => {
            //For each link in the page, extract its tagList and decorate it
            for(var i=0; i<linkNodes.length; i++){
                tagList = mapOfTaglists[ normalizeUrl(linkNodes[i].href) ];
                AddOrRemoveDecorationsToLink(linkNodes[i], tagList);
            }
        } ,
        onStorageGetError
    )

}



//Given a single html link node, fetches associated tag(s) and proceeds to decorate it
function decorateSingleLink(linkNode){
   
    const url = normalizeUrl(linkNode.href);

    //Retrive this URL's tagList from local storage.
    //This operation is asynchronous (returns a promise). We need to use .then(nextFunction) to register any operation that must be done afterwards.
    //Note: In '.then()' chains, whatever a function returns is used as the argument for the function in the next 'then()'.
    browser.storage.local.get(url)

    //Step 1: Retrieve url's tagList from local storage
    //Since we also need to pass 'linkNode' to it, we create an arrow function that just takes 'storedMap' and wrap a function that takes both params.
    .then(
        (storedInfo) => { return( GetTagListFromFetchedMap(storedInfo) ); } , //Postprocess fetched data to extract the info we want only (the tagList)
        onStorageGetError
    )

    //Step 2: Update shown icons
    .then(
        (tagList) => { AddOrRemoveDecorationsToLink(linkNode, tagList); }
    )

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
    //Create <img> element
    var myImage = new Image(20, 20);
    myImage.src = getResourcesRuntimeUrl("icons/"+tag+".png");

    //By adding classes to this HTML element, we can later easily identify which icons have already been applied (to remove them or prevent duplicates)
    myImage.classList.add("st-decoration"); //Marks element as "decoration"
    myImage.classList.add("st-"+tag);       //To identify associated tag

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