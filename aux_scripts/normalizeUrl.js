
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