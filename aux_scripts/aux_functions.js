
//This file contains a function used by other parts of the program.
//It must be loaded before any file that uses it:
//  It is used in panel.js, which is part of the sidepanel which loads once on startup. We insert it as a script directly in the panel.html
//  It is used in decorateLinks.js, which is in content_scripts and loads every time we load a website. We add it with manifest.js, before decorateLinks.js.


function normalizeUrl(url){
    //Remove parts of the url such as "http//:", "www."... and make it lowercase
    //This ensures local stored info can be retrieved even if the url is slightly different than when data was saved.

    result = url.toLowerCase();
  
    result = deleteSubstringAtStart(result, "http://");
    result = deleteSubstringAtStart(result, "https://");
    result = deleteSubstringAtStart(result, "www.");    //This one must go AFTER http and https
    
    return(result);
}
  

function deleteSubstringAtStart(mainstring, substring){
    //Remove a substring from a bigger string, but only if it's at the beginning
    //(since that's all we need, and searching the whole string would be unnecesarily inneficient)
  
    if( mainstring.startsWith(substring) ){
        return(mainstring.slice(substring.length))    //Remove the substring from the beginning of mainstring, and return the remaining part
    }else{
        return(mainstring);
    }
}



///////////////////
// LOCAL STORAGE //
///////////////////

//When we fetch data from local storage, we get a Map of key:value pairs. When we give just 1 key (the URL), we get 1 pair.
//We only need the value (the URL's tagList), not the entire Map. This function extracts the value.
function GetTagListFromFetchedMap(storedInfo){
    tagList = storedInfo[Object.keys(storedInfo)[0]];   //Extract value of the first (and only) key:value pair (the actual tagList)

    if(tagList === undefined)   //If this url had no data in local storage -> The returned value is undefined
        tagList = [];           //We create an empty list, which is easier to work with
    
    return(tagList);
}


//Run when there's a failure to retrieve a value from local storage
//Note that not finding a value for a specified key is not an error (it just returns 'undefined')
function onStorageGetError(error) {
    console.log(`Error: ${error}`);
}