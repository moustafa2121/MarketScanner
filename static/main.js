

//this resets on refreshing the page, filter, and sort
function loadTheTable(pageNumber) {
    getTableData(pageNumber);
}

function getTableData(pageNumber) {
    console.log("fetching");
    fetch(`/moredata/${pageNumber}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        //body: JSON.stringify({ test: `this is test ${pageNumber}` })
    })
        .then(response => response.json())
        .then(data => {
            console.log("got response fetching");
            console.log(data);
        })
        .catch(error => {
            console.log("error fetching:", error);
        });
}


//loads tables
window.addEventListener('load', () => {

})