async function fetchName() {
    let response = await fetch("/auth/user");
    let data = await response.json();
    return data.user.name;
}

if (localStorage.getItem("alreadyRegistered") && localStorage.getItem("alreadyRegistered") == "true" && localStorage.getItem("id")) {
    let id = localStorage.getItem("id");
    let email = localStorage.getItem("email");

    fetch(`/game/user/check?user_id=${id}&email=${email}`)
    .then((response) => {
        return response.json();
    }).then((result) => {
        if (result.result == "success") {
            window.location = "/home";
        }
    })
}

function createDegreeDropdown(){
    let programs = [
        "Advanced Business Analysis Programm",
        "Advanced Diploma: Business Information Technology",
        "B Tech Information Technology",
        "B. IT (Bachelor of Information Technology)",
        "B.Bus.Sci",
        "BA",
        "BA Digital Arts Hons",
        "BA Honours (Digital Arts)",
        "Bachelor of Computing",
        "BCA",
        "BCom",
        "BCom (Hons)",
        "BCom Informatics",
        "BCom IT Management",
        "BEng",
        "BEng Computer Engineering",
        "BEng Hons",
        "BEngSc (Digital Art)",
        "BIS Hons Multimedia",
        "BIS Multimedia",
        "BSC",
        "BSc Computer Science",
        "BSc Generic",
        "BSc Hons",
        "BSc Hons Comp Sci",
        "BSc Informatics",
        "BSc Information and Knowledge Systems",
        "BSc Information Systems",
        "BSc Information Technology",
        "BSc IT majoring in data science",
        "BSc Mathematics",
        "Degree",
        "MBA",
        "MCA",
        "MEng",
        "MIT",
        "MSc",
        "MSc (Eng)",
        "MSc Computer Science",
        "National Diploma Electronic Engineering",
        "PDBA",
        "PgDip Eng",
        "PhD",
        "Other"
    ];

    const programSelect = document.getElementById("degree");

    // loop through programs
    programs.forEach(program => {
        // append each option
        let option = document.createElement("option");
        option.value = program;
        option.textContent = program;
        programSelect.appendChild(option);
    });
}

function createYearDropdown(){
    let yearsOfStudy = [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "Honours",
        "Masters",
        "PHD",
        "Not currently studying"
    ]

    const yearSelect = document.getElementById("year");

    // loop through years
    yearsOfStudy.forEach(year => {
        // append each option
        let option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });
}

createDegreeDropdown();
createYearDropdown();

// if browser is safari
if (navigator.userAgent.indexOf("Safari") != -1 && navigator.userAgent.indexOf("Chrome") == -1) {
    document.body.classList.add("safari");
}