document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const chatBox = document.getElementById('chat-box');

    const WORKER_URL = "https://geminiapikey.yousefgamed22.workers.dev";
    let chatHistory = [];

    function appendMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user' 
            ? 'bg-blue-600 text-white p-3 rounded-xl ml-4 mr-1 text-right self-end max-w-[85%]' 
            : 'bg-white/5 border border-white/10 text-gray-200 p-3 rounded-xl mr-4 ml-1 text-right self-start max-w-[85%]';
        msgDiv.innerText = text;
        chatBox.appendChild(msgDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function sendToQuark(message, context = "") {
        appendMessage(message, 'user');
        userInput.value = '';
        
        appendMessage("جاري التفكير...", 'ai');
        const loadingMsg = chatBox.lastChild;

        try {
            const systemContext = context ? `أنت مساعد ذكي مدمج في المتصفح. أنت الآن تقرأ صفحة ويب وهذا هو محتواها: \n\n${context}\n\nأجب على سؤال المستخدم بناءً على هذا المحتوى واشرح له ما يحتاجه بأسلوبك الجدع والمباشر.` : "أنت مساعد ذكي مدمج في المتصفح، أجب بأسلوبك الجدع والمباشر.";
            
            const payload = {
                message: message,
                systemInstruction: systemContext,
                model: "gemini-2.5-flash",
                history: chatHistory
            };

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("السيرفر ماردش");
            
            const data = await response.json();
            
            if (data.type === "text" || data.content) {
                loadingMsg.innerText = data.content;
                chatHistory.push({ role: "user", content: message });
                chatHistory.push({ role: "ai", content: data.content });
            } else {
                loadingMsg.innerText = "🚨 مفيش رد مفهوم رجع من السيرفر.";
            }
            
        } catch (error) {
            loadingMsg.innerText = "🚨 حصلت مشكلة في الاتصال بكوارك.";
            loadingMsg.classList.add('text-red-400');
        }
    }

    sendBtn.addEventListener('click', () => {
        const text = userInput.value.trim();
        if (text) sendToQuark(text);
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const text = userInput.value.trim();
            if (text) sendToQuark(text);
        }
    });

    analyzeBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            chrome.tabs.sendMessage(tab.id, { action: "getPageContent" }, (response) => {
                if (chrome.runtime.lastError) {
                    appendMessage("🚨 مش قادر أقرأ الصفحة دي، جرب تعملها Refresh الأول.", 'ai');
                } else if (response && response.content) {
                    sendToQuark("لخصلي الصفحة دي أو اشرحلي الكود والمحتوى اللي فيها.", response.content);
                } else {
                    appendMessage("الصفحة دي مفيهاش كلام واضح أقدر أقراه.", 'ai');
                }
            });
        } catch (e) {
            appendMessage("🚨 حصلت مشكلة في الوصول للصفحة.", 'ai');
        }
    });
});
