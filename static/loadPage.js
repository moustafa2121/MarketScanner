


//document.cookie = "user_id=12345; expires=Thu, 01 Jan 2025 00:00:00 UTC;";


function getCookie(name) {
    for (const cookie of document.cookie.split('; ')) {
        const [cookieName, cookieValue] = cookie.split('=');
        if (cookieName === name)
            return cookieValue;
    }
    return null;
}

const userId = getCookie('user_id');

function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    const name = cname + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1);
        if (c.indexOf(name) == 0)
            return c.substring(name.length, c.length);
    }
    return "";
}

function checkCookie() {
    let user = getCookie("username");
    if (user != "")
        alert("Welcome again " + user);
    else {
        user = prompt("Please enter your name:", "");
        if (user != "" && user != null)
            setCookie("username", user, 365);
    }
}