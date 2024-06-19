$(document).ready(function() {
    const apiKey = localStorage.getItem('apiKey');
    const name = localStorage.getItem('name');
    const conversationHistory = JSON.parse(localStorage.getItem('conversationHistory')) || [];

    if (apiKey && name) {
        $('#loginContainer').addClass('d-none');
        $('#chatContainer').removeClass('d-none');
        loadChatHistory();
    }

    $('#loginButton').on('click', function() {
        const nameInput = $('#nameInput').val().trim();
        const apiKeyInput = $('#apiKeyInput').val().trim();

        if (nameInput && apiKeyInput) {
            localStorage.setItem('name', nameInput);
            localStorage.setItem('apiKey', apiKeyInput);
            $('#loginContainer').addClass('d-none');
            $('#chatContainer').removeClass('d-none');
        } else {
            alert('Please enter both name and API key.');
        }
    });

    $('#logoutButton').on('click', function() {
        localStorage.removeItem('name');
        localStorage.removeItem('apiKey');
        localStorage.removeItem('conversationHistory');
        location.reload();
    });

    $('#clearChatButton').on('click', function() {
        localStorage.removeItem('conversationHistory');
        $('.chat-container').empty();
    });

    function loadChatHistory() {
        conversationHistory.forEach(msg => {
            appendMessage(msg.role, msg.parts[0].text, msg.isCode, msg.timestamp);
        });
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function formatOutput(text) {
        text = escapeHtml(text);
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        text = text.replace(/\n/g, '<br>');
        text = text.replace(/```(.*?)```/gs, '<i>double click to copy</i><pre><code>$1</code></pre>');
        text = text.replace(/## (.*?)(<br>|$)/g, '<h2>$1</h2>');
        return text;
    }

    function appendMessage(role, text, isCode = false, timestamp = new Date()) {
        const chatContainer = $('.chat-container');
        const messageClass = role === 'user' ? 'chat-bubble user' : 'chat-bubble model';
        const profileImage = role === 'user' ? 'user.jpg' : 'bot.jpg';
        const formattedText = isCode ? text : formatOutput(text);
        const formattedTimestamp = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let messageElement = `<div class="${messageClass}">
            <img src="${profileImage}" alt="${role}" style="width:30px; height:30px; border-radius:50%;">
            ${isCode ? `<pre><code>${formattedText}</code></pre>` : `<span>${formattedText}</span>`}
            <div class="timestamp">${formattedTimestamp}<span class="tick ${role === 'model' ? 'read' : ''}"></span></div>
        </div>`;
        chatContainer.append(messageElement);
        chatContainer.scrollTop(chatContainer[0].scrollHeight);
    }

    function showTypingIndicator() {
        const chatContainer = $('.chat-container');
        const typingIndicator = `<div class="chat-bubble typing-indicator">
        <span>Typing...</span>
        </div>`;
        chatContainer.append(typingIndicator);
        chatContainer.scrollTop(chatContainer[0].scrollHeight);
    }

    function hideTypingIndicator() {
        $('.chat-bubble.typing-indicator').remove();
    }

    function sendMessage() {
        const userInput = $('#chatInput').val().trim();
        if (userInput === '') return;

        const timestamp = new Date();
        appendMessage('user', escapeHtml(userInput), false, timestamp);
        $('#chatInput').val('');

        const currentApiKey = localStorage.getItem('apiKey');
        conversationHistory.push({ role: 'user', parts: [{ text: userInput }], timestamp });
        localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));

        showTypingIndicator();

        const payload = JSON.stringify({
            contents: conversationHistory.map(msg => ({
                role: msg.role,
                parts: [{ text: msg.parts[0].text }]
            }))
        });

        $.ajax({
            url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentApiKey}`,
            type: 'POST',
            contentType: 'application/json',
            data: payload,
            success: function(response) {
                hideTypingIndicator(); 
                const modelResponse = response.candidates[0].content.parts[0].text;
                const isCode = modelResponse.startsWith('```') && modelResponse.endsWith('```');

                appendMessage('model', modelResponse, isCode);

                conversationHistory.push({ role: 'model', parts: [{ text: modelResponse }], timestamp });
                localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
            },
            error: function(err) {
                hideTypingIndicator();
                console.error('Error fetching response:', err);
                appendMessage('model', 'Something went wrong while fetching the response, Please logout and check API again.');
            }
        });
    }

    $('#sendButton').on('click', sendMessage);
    $('#chatInput').on('keypress', function(e) {
        if (e.which === 13) {
            sendMessage();
        }
    });

    $(document).on('dblclick', 'pre', function() {
        const codeElement = $(this);
        const codeContainer = codeElement.closest('.chat-bubble');
        let code = codeElement.text().trim();

        const infoText = 'double click to copy';
        if (code.startsWith(infoText)) {
            code = code.slice(infoText.length).trim();
        }

        const languages = [
            'javascript', 'python', 'java', 'php', 'ruby', 'swift', 'kotlin', 'typescript', 'go', 'c',
            'c++', 'c#', 'scala', 'rust', 'r', 'perl', 'lua', 'dart', 'elixir', 'haskell', 'clojure',
            'bash', 'powershell', 'sql', 'html', 'css', 'sass', 'less', 'graphql', 'rust', 'nim',
            'julia', 'groovy', 'erlang', 'fortran', 'matlab', 'vb.net', 'cobol', 'ada', 'd', 'racket',
            'scheme', 'f#', 'smalltalk', 'ocaml', 'verilog', 'vhdl', 'labview', 'assembly', 'delphi',
            'perl6', 'scratch', 'processing', 'alice', 'eiffel', 'forth', 'icon', 'pl/i', 'prolog',
            'tcl', 'abap', 'apl', 'awka', 'bc', 'bcpl', 'boo', 'cilk', 'clean', 'crystal', 'cython',
            'ecl', 'ecstasy', 'euphoria', 'falcon', 'fantom', 'felix', 'frink', 'genie', 'glyph',
            'hack', 'haxe', 'icon', 'idris', 'inform', 'io', 'j', 'jade', 'jcl', 'joy', 'korn', 'ksh',
            'labview', 'limbo', 'lotusscript', 'lpc', 'max', 'minid', 'm4', 'magik', 'modula-2', 'ncl',
            'nesc', 'npl', 'oberon', 'pan', 'pawn', 'pcastl', 'pcastl', 'per', 'phps', 'pike', 'pilot',
            'postscript', 'purebasic', 'raku', 'realbasic', 'rexx', 'ring', 'roff', 'rpgle', 'sas', 's',
            'scratch', 'shell', 'si', 'simula', 'sml', 'spitbol', 'ss', 'stata', 'sybase', 'thinbasic',
            'typhon', 'vala', 'vbscript', 'visual', 'voxel', 'wolfram', 'x++', 'x10', 'xl', 'xtend',
            'zpl'
        ];
        
        for (const lang of languages) {
            if (code.toLowerCase().startsWith(lang)) {
                code = code.slice(lang.length).trim();
                break;
            }
        }

        const tempInput = $('<textarea>');
        $('body').append(tempInput);
        tempInput.val(code).select();
        document.execCommand('copy');
        tempInput.remove();
        alert('Code copied to clipboard');
    });
});

let typingTimeout;

function showTypingStatus() {
    $('#typingStatus').show();
    $('#lastSeenStatus').hide();
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        $('#typingStatus').hide();
        $('#lastSeenStatus').show();
    }, 2000);
}

$('#chatInput').on('input', function() {
    showTypingStatus();
});


let lastSeen = new Date();

function updateLastSeenStatus() {
    const now = new Date();
    const diffInSeconds = Math.round((now - lastSeen) / 1000);

    let statusText;
    if (diffInSeconds < 60) {
        statusText = `Last seen: Just now`;
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        statusText = `Last seen: ${minutes} minute(s) ago`;
    } else {
        const hours = Math.floor(diffInSeconds / 3600);
        statusText = `Last seen: ${hours} hour(s) ago`;
    }

    $('#lastSeenStatus').text(statusText);
}

setInterval(updateLastSeenStatus, 10000);
updateLastSeenStatus();
