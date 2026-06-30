chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getPageContent") {
        let selectedText = window.getSelection().toString().trim();
        let pageText = selectedText ? selectedText : document.body.innerText;
        let cleanText = pageText.replace(/\s+/g, ' ').substring(0, 15000); 
        sendResponse({ content: cleanText });
    }
    return true;
});
