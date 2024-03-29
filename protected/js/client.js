if(!localStorage.getItem("alreadyRegistered") || localStorage.getItem("alreadyRegistered") != "true"){
    if(localStorage.getItem("admin")){
        fetch("/game/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: localStorage.getItem("admin")
            })
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if(!data.success){
                window.location = "/";
            }
        })
    } else {
        // get url param "join"
        let urlParams = new URLSearchParams(window.location.search);
        let join = urlParams.get('join');

        // check if it exists
        if (join != null) {
            window.location = "/?join=" + join;
        } else {
            window.location = "/";
        }
    }
} else {
    if (localStorage.getItem("alreadyRegistered") && localStorage.getItem("alreadyRegistered") == "true" && localStorage.getItem("id")) {
        let id = localStorage.getItem("id");
        let email = localStorage.getItem("email");
    
        let result = await fetch(`/game/user/check?user_id=${id}&email=${email}`);

        if (result.result != "success") {
            window.location = "/";
        }
    }
}

const wsURL = window.location.host.includes("localhost") ? `ws://${window.location.host}/` : `wss://${window.location.host}/`;
const socket = new WebSocket(wsURL);

let timer;
let joinCode = "";
let startQuestionTime;
let endQuestionTime;

async function fetchName() {
    return localStorage.getItem("firstName") + " " + localStorage.getItem("lastName");
}

async function fetchPlayer() {
    const data = {
        name: localStorage.getItem("firstName") + " " + localStorage.getItem("lastName"),
        id: localStorage.getItem("id")
    }
    return data;
}

// on socket connection
socket.onopen = () => {
    // check if url containers the parameter create or join
    let urlParams = new URLSearchParams(window.location.search);
    let create = urlParams.get('create');
    let join = urlParams.get('join');

    if (create != null && join == null && localStorage.getItem("admin")) {
        fetch("/game/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: localStorage.getItem("admin")
            })
        }).then((response) => {
            return response.json();
        }).then((data) => {
            if(data.success){
                showGameOptions();
            } else {
                window.location = "/";
            }
        })
        
    } else if (create == null && join != null) {
        document.getElementById('join-code-header').textContent = "Enter the game pin to join";

        createJoinCodeForm(join);
    } else if (create == null && join == null) {
        window.location = "/home";
    }

    document.getElementById("create-game").addEventListener("click", createGame);

    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById(`answer-${i + 1}`);
        btn.addEventListener("click", (event) => {
            let allBtns = document.getElementsByClassName("answer-btn");
            Array.from(allBtns).forEach(btn2 => {
                if (btn != btn2) {
                    btn2.classList.add("disabled");
                    btn2.classList.remove("selected");
                } else {
                    btn2.classList.remove("disabled");
                    btn2.classList.add("selected");
                }
            });
            sendAnswer(event.currentTarget.textContent);
        });
    }
}

socket.onmessage = async (event) => {
    let response = JSON.parse(event.data);

    switch (response['requestType']) {
        case "JOIN":
            handleJoin(response);
            break;
        case "QUESTION":
            handleQuestion(response);
            break;
        case "ROUND OVER":
            handleRoundOver(response);
            break;
        case "GAME OVER":
            handleGameOver(response);
            break;
        default:
            return;
    }
};

function handleJoin(msg) {
    if (msg['isHost']) {
        showCreatorWaitingScreen(msg);
        if (msg['newPlayer']) {
            addPlayerToList(msg);
        }
    } else {
        if (msg['success']) {
            showWaitingScreen();
        } else {
            document.getElementById("join-code-header").textContent = msg['message'];
            document.getElementById("join-code-header").classList.add("error")
        }
    }
}

function handleQuestion(msg) {
    document.getElementById("join-code-header").textContent = "";
    let question = msg['questionText'];
    let answers = msg['questionOptions'];
    let questionNumber = msg['questionNumber'];
    let roundNumber = msg['roundNumber'];
    let questionTime = msg['roundTime'];

    document.getElementById("question").classList.remove("hidden");
    document.getElementById("answers").classList.remove("hidden");
    document.getElementById("join-code-header").classList.add("hidden");
    document.getElementById("join-code").classList.add("hidden");
    document.getElementById("actions").classList.add("hidden");
    document.getElementById("player-list").classList.add("hidden");
    document.getElementById("start-btn").classList.add("hidden");
    document.getElementById("logo-img").classList.add("hidden");
    document.getElementById("loader").classList.add("hidden");


    document.getElementById("questionRound").textContent = `Question ${questionNumber} - Round ${roundNumber}`;

    let questionElem = document.getElementById("question-text");
    questionElem.textContent = question;

    for (let i = 0; i < 4; i++) {
        if(answers[i] == undefined){
            let answerElem = document.getElementById("answer-" + (i + 1));
            answerElem.textContent = "";
            answerElem.classList.add("hidden");
        } else {
            let answer = answers[i];
            let answerElem = document.getElementById("answer-" + (i + 1));
            answerElem.textContent = answer;
            answerElem.classList.remove("disabled");
            answerElem.classList.remove("selected");
            answerElem.classList.remove("hidden");
            answerElem.blur();
        }
    }

    startTimer(questionTime);
}

function handleRoundOver(msg) {
    let isHost = msg['isHost'];

    if (isHost) {
        document.getElementById("question").classList.add("hidden");
        document.getElementById("answers").classList.add("hidden");
        document.getElementById("join-code-header").classList.remove("hidden");
        document.getElementById("actions").classList.remove("hidden");
        document.getElementById("questionRound").textContent = "";

        document.getElementById("join-code-header").textContent = "Waiting for next round to start...";
        document.getElementById("actions").innerHTML = "";


        document.getElementById("logo-img").classList.remove("hidden");

        // create start round button and append to #actions
        let startRound = document.createElement('button');
        startRound.textContent = "Start Round";
        startRound.classList.add("btn");
        document.getElementById('actions').appendChild(startRound);
        startRound.onclick = () => {
            nextRound(msg["joinCode"]);
        };

        // show playerlist with current scores
        let playerList = document.getElementById("player-list");
        playerList.classList.remove("hidden");
        playerList.innerHTML = "";

        let liHeader = document.createElement('li');
        liHeader.textContent = "Current Scores";
        playerList.appendChild(liHeader);

        let currentScores = msg["currentScores"];
        currentScores.shift();
        currentScores = currentScores.sort((a, b) => {
            return b.calculatedScore - a.calculatedScore
        })
        
        for(let i = 0; i < currentScores.length; i++){
            let li = document.createElement('li');
            let badge = document.createElement('span');
            badge.classList.add("badge");
            badge.textContent = currentScores[i]["calculatedScore"];
            li.appendChild(badge);
            let name = document.createElement('span');
            name.textContent = currentScores[i]["name"];
            li.appendChild(name);
            playerList.appendChild(li);
        }

    } else {
        document.getElementById("question").classList.add("hidden");
        document.getElementById("answers").classList.add("hidden");
        document.getElementById("join-code-header").classList.remove("hidden");
        document.getElementById("actions").classList.remove("hidden");
        document.getElementById("questionRound").textContent = "";
        document.getElementById("loader").classList.remove("hidden");

        document.getElementById("join-code-header").textContent = "Waiting for next round to start...";
    }
}

function handleGameOver(msg) {
    let playerDetails = msg['playerDetails'];
    
    localStorage.setItem("playerDetails", playerDetails);
    window.location = "/home/leaderboard?gameId=" + msg['gameId'];
}

async function showCreatorWaitingScreen(response) {
    joinCode = response['joinCode'];

    document.getElementById('join-code').innerHTML = "";
    document.getElementById("join-code").classList.remove("hidden");

    let joinCodeEl = document.createElement('h3');
    joinCodeEl.textContent = joinCode;
    let qrCode = document.createElement('img');
    let link = `${location.protocol}//${location.host}/home/game?join=${joinCode}`;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?data=${link}&size=200x200&bgcolor=ffffff&color=380036&margin=5`;
    document.getElementById('join-code').appendChild(joinCodeEl);
    document.getElementById('join-code').appendChild(qrCode);
    document.getElementById('join-code-header').textContent = "Use this code to join this game or scan the QR code";

    createPlayerList();

    let startBtn = document.getElementById("start-btn");
    startBtn.onclick = startGame;
    startBtn.classList.remove("hidden");
}

function addPlayerToList(response) {
    document.getElementById('player-list').innerHTML = "";

    let liHeader = document.createElement('li');
    liHeader.textContent = "Players";
    document.getElementById('player-list').appendChild(liHeader);

    for (let i = 1; i < response['players'].length; i++) {
        // create li and append to ul
        let li = document.createElement('li');
        li.textContent = response['players'][i]['name'];
        document.getElementById('player-list').appendChild(li);
    }
}

async function createGame() {
    document.getElementById('join-code-header').textContent = "Loading...";

    let numQuestions = Number(document.getElementById("number-of-questions").value);
    let numRounds = Number(document.getElementById("number-of-rounds").value);
    let time = Number(document.getElementById("time-per-questions").value);

    let user = await fetchPlayer();

    socket.send(JSON.stringify({
        questionsPerRound: numQuestions,
        numberOfRounds: numRounds,
        roundLength: time * 1000,
        player: user,
        requestType: "CREATE"
    }));

    document.getElementById("game-options").classList.add("hidden");
}

function nextRound(joinCode) {
    socket.send(JSON.stringify({
        requestType: "NEXT ROUND",
        joinCode: joinCode,
    }));
}

function showWaitingScreen() {
    document.getElementById('join-code-header').textContent = "Waiting for game to start...";
    document.getElementById('join-code').innerHTML = "";
    document.getElementById('actions').innerHTML = "";
    document.getElementById("loader").classList.remove("hidden");
    document.getElementById("logo-img").classList.remove("hidden");
}

function startGame() {
    socket.send(
        JSON.stringify({
            requestType: "START",
            joinCode: joinCode
        })
    );
}

async function joinGame() {
    joinCode = getjoinCodeFromInputs();
    let user = await fetchPlayer();
    socket.send(JSON.stringify({
        joinCode: joinCode,
        player: user,
        requestType: "JOIN"
    }));
}

async function sendAnswer(answer) {
    let user = await fetchPlayer();
    let answeredIn = endQuestionTime - new Date();
    let total = endQuestionTime - startQuestionTime;
    let multiplier = Math.round(answeredIn / total * 1000);
    
    socket.send(JSON.stringify({
        answer: answer,
        requestType: "ANSWER",
        joinCode: joinCode,
        player: user,
        multiplier: multiplier
    }));
}

function createJoinCodeForm(givenCode) {
    let form = document.createElement('form');
    form.method = "get";
    form.id = "digit-group";
    form.setAttribute('data-group-name', 'digits');
    form.setAttribute('data-autosubmit', 'true');
    form.setAttribute('autocomplete', 'off');

    for (let i = 1; i <= 5; i++) {
        let input = document.createElement('input');
        input.type = "text";
        input.id = `digit-${i}`;
        input.name = `digit-${i}`;
        input.className = "singleInput";
        input.maxLength = 1;

        if (givenCode != null && givenCode.length == 5) {
            input.value = givenCode.charAt(i - 1);
        }

        form.appendChild(input);
    }

    document.getElementById('join-code').appendChild(form);

    document.getElementById('join-code').classList.add("join");

    // add join button below the form
    let joinButton = document.createElement('button');
    joinButton.type = "submit";
    joinButton.id = "join-btn";
    joinButton.textContent = "Join";
    joinButton.classList.add('btn');

    if (givenCode != null && givenCode.length == 5) {
        joinButton.classList.remove('disabled');
        joinButton.disabled = false;
    } else {
        joinButton.classList.add('disabled');
        joinButton.disabled = true;
    }

    document.getElementById('actions').appendChild(joinButton);

    joinButton.addEventListener('click', joinGame);

    const inputElements = [...document.querySelectorAll('#digit-group input')]

    inputElements.forEach((ele, index) => {
        ele.addEventListener('keydown', (e) => {
            if (e.keyCode === 8 && e.target.value === '') inputElements[Math.max(0, index - 1)].focus()
        })
        ele.addEventListener('input', (e) => {
            const [first, ...rest] = e.target.value
            e.target.value = first ?? ''
            const lastInputBox = index === inputElements.length - 1
            const didInsertContent = first !== undefined
            if (didInsertContent && !lastInputBox) {
                inputElements[index + 1].focus()
                inputElements[index + 1].value = rest.join('')
                inputElements[index + 1].dispatchEvent(new Event('input'))
            }

            let isValid = inputElements.every(input => { return input.value != ""; });

            if (isValid) {
                document.getElementById('digit-group').classList.add('valid');
                document.getElementById("join-btn").disabled = false;
                document.getElementById("join-btn").classList.remove('disabled');
            } else {
                document.getElementById('digit-group').classList.remove('valid');
                document.getElementById("join-btn").disabled = true;
                document.getElementById("join-btn").classList.add('disabled');
            }
        })
    })
}

function getjoinCodeFromInputs() {
    let digitGroup = document.getElementById('digit-group');

    let inputs = digitGroup.getElementsByTagName('input');

    let tmpjoinCode = "";

    Array.from(inputs).forEach(input => {
        tmpjoinCode += input.value;
    });

    return tmpjoinCode.toUpperCase();
}

function createPlayerList() {
    let playerList = document.getElementById("player-list");

    playerList.classList.remove("hidden");

    let liHeader = document.createElement('li');
    liHeader.textContent = "Players";
    playerList.appendChild(liHeader);

    document.body.appendChild(playerList);
}

function startTimer(time) {
    try {
        clearInterval(timer);
    } catch (error) {
        console.log("No timer");
    }

    document.getElementById("timer").classList.remove("hidden");

    let deadline = new Date();
    startQuestionTime = new Date();
    deadline.setSeconds(deadline.getSeconds() + time / 1000);
    endQuestionTime = deadline;

    timer = setInterval(() => {
        let now = new Date();
        let t = deadline.getTime() - now.getTime();

        let seconds = Math.floor((t % (1000 * 60)) / 1000);

        document.getElementById("time-remaining").textContent = seconds;
        document.getElementsByClassName("timer-remaining")[0].style.width = (seconds * 1000 / time) * 100 + "%";

        if (t < 0) {
            clearInterval(timer);
            document.getElementById("time-remaining").textContent = "Time's up!";
            document.getElementsByClassName("timer-remaining")[0].style.width = "100%";
            document.getElementById("timer").classList.add("hidden");
        }
    }, 100);
}

function showGameOptions() {
    let place = document.getElementById("game-options");
    place.classList.remove("hidden");

    document.getElementById("join-code").classList.add("hidden");
}
