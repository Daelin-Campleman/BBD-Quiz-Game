async function fetchName() {
    let response = await fetch("/auth/user");
    let data = await response.json();
    return data.user.name;
}

if (window.location.host.includes("-qa")) {
    console.log("This is QA environment");
}

if(localStorage.getItem("alreadyRegistered") && localStorage.getItem("alreadyRegistered") == "true"){
    window.location = "/home";
}