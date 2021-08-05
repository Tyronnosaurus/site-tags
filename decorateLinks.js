
decorateAllLinksInPage();   //Since this script gets loaded as a content script, this function gets executed whenever a website is loaded



function decorateAllLinksInPage(){
    
    var linkNodes = document.links; //Get list of all links in the page

    for(var i=0; i<linkNodes.length; i++)
        decorateLink(linkNodes[i]);
}



function decorateLink(linkNode){
   
    //Start an asynchronous query to retrieve any value under the 'url' key in local storage.
    url = linkNode.href;
    url = normalizeUrl(url);

    fetchQuery = browser.storage.local.get(url);

    //fetchQuery is a promise. Using 'then()', we can pass 2 functions (success & fail) that will be executed when the query finishes.
    //When the success function is executed, it will get passed as a parameter whatever was returned by browser.storage.local.get(url).
    fetchQuery.then(

        function(storedMap){            //When data is successfully fetched from storage, run this function.
            onGot(storedMap, linkNode); //The anonymous function wraps another function. We need to do this to pass any extra argument not returned by browser.storage.local.get()
        },

        onError);                       //If fetching fails, run this function

}



function onGot(storedMap, linkNode) {
    //Succeded fetching local storage
    //Returns a Map (aka Dictionary) with key:value pairs. Since we provided only one key, we get a Map with one pair.
    //If the specified key didn't exist in local storage, value 'undefined' will be returned

    //Get the value in the first pair of the Map
    tagList = storedMap[Object.keys(storedMap)[0]];

    if (typeof tagList == 'undefined')  return;   //No info for this url found in local storage

    else if (tagList.includes("seen"))
    {
        ////Add icon after the link

        //Create <img> node
        var myImage = new Image(25, 20);

        //Get icon's url
        //Returns something like:  moz-extension://2c127fa4-62c7-7e4f-90e5-472b45eecfdc/icons/file.ext
        //The long number is a randomly generated ID for every browser instance. This prevents fingerprinting
        myImage.src = browser.runtime.getURL("icons/seen_20px.png");

        //In the html, insert the image after the link (not inside) 
        insertAfter(myImage , linkNode);
    }

}


function onError(error) {
    //Failed to retrieve value from local storage
    //Note that not finding a value for a specified key is not an error. It just returns 'undefined'
    console.log(`Error: ${error}`);
}


//Inserts a new node after another existing node
function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}


