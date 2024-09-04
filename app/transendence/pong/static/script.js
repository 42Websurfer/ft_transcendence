const loginForm = document.querySelector("#loginData");

async function sendData() {

    const formData = new FormData(loginForm)

    try {
        const response = await fetch("http://localhost:8090/login", {
            method: "POST",
            body: formData,
    });
    console.log(await response.json())
    } catch (e) {
        console.error(e);
    }
}

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendData();
})