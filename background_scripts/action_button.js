
//When user clicks on the extension's Action button (the one on the browser's top left), open the options page
//Must fill browser_action in manifest.json for the button to appear

function handleClick() {
  browser.runtime.openOptionsPage();
}

browser.browserAction.onClicked.addListener(handleClick);
