
//Get array of all links in the page
var linkNodes = document.links;


for(var i=0; i<linkNodes.length; i++) {

    addIconIfNecessary(linkNodes[i]);

}




function addIconIfNecessary(linkNode){
   
    //Start an asynchronous query to retrieve any value under the 'url' key in local storage.
    url = linkNode.href;
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
    value = storedMap[Object.keys(storedMap)[0]];

    if(typeof value == 'undefined'){   //Key had no data saved in local storage
        return;
    } else {

        //Add text/icon after the link
        var addition = document.createElement("span");
        addition.innerHTML = " (X)";
        insertAfter(addition , linkNode);
        
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