// script that handles initial loading of the page
//sets up the event listeners for pagination, pagination appearance
//handling pagination events, and making requests to main.js of refreshing the table
//also handles requests to refresh the table after filter was applied

/*
a closure that is used to hold the values of the 
pagination of the table, get, set, increment/decrement the page numbers
*/
paginationManager = (function () {
    //the current page number
    let pageNumber = 1;
    //the total pages available to go through
    let totalPages = parseInt(document.getElementById("totalPagesHolder").textContent);
    //used for pages that are beyond the current page to indicate
    //there are pages inbetween
    const placeHolderValue = '...'

    return {
        currentPage: () => pageNumber,
        setCurrentPage: (passedValue) => { pageNumber = passedValue; },
        totalPages: () => totalPages,
        setTotalPages: (value) => totalPages = value,
        placeHolderValue: placeHolderValue,
        pageInc: () => { return pageNumber += 1; },//increment the current page
        pageDec: () => { return pageNumber -= 1; },//decremeent the current page
    }
})();

//called when filter is applied and the table has to be refreshed
//it takes the total pages of the now filtered items, and total items
//as such it will invoke the refresh table, thus creating new paginationArray
//and re-displaying all the data
//also resets the data held in storage for the adjacent tables
async function onFilterChange(newTotalPages, newTotalItems) {
    //change the total items displayed
    const totalItems = document.getElementById("resultsElement");
    totalItems.textContent = newTotalItems.toString() + " item" + (newTotalItems > 1 ? "s" : "") + " found"

    //change the total pages (as given by the filter functions)
    paginationManager.setTotalPages(newTotalPages);

    //refresh the table data displayed, reset the data of the adjacent tables
    refreshTable(1, newTotalPages, displayTable=true, resetData=true);
}

//on page load
window.addEventListener("load", () => {
    //set the pagination values depending on the current page and total pages
    refreshTable(paginationManager.currentPage(), paginationManager.totalPages(), displayTable=false);

    //set the event listener for the previous/next page buttons
    //when the user move through the pages, refresh the new available pages
    //and the data displayed in the table
    document.getElementById("prevPage").addEventListener("click", () => {
        //decrement the current page
        paginationManager.pageDec();
        //set the pagination
        refreshTable(paginationManager.currentPage(), paginationManager.totalPages());
    });
    document.getElementById("nextPage").addEventListener("click", () => {
        paginationManager.pageInc();
        refreshTable(paginationManager.currentPage(), paginationManager.totalPages());
    });
});

//refreshes the table, displayed data based on the given page 
//used by moving to next/prev pages, clicking on page numbers
//also used on loading the page initially to set up the pagination
//but display is disabled since the table is populated by html intially
function refreshTable(pageNumber, totalPages, displayTable = true, resetData = false) {
    //the array of pages from the first to the last button
    //calculated depending ont he current page and total pages
    const paginationArray = paginationArrayFactory(pageNumber, totalPages);

    //set the pagination display
    setThePagination(pageNumber, paginationArray);

    //invoke the loading of table and the data of the 
    //previous/next tables depending on the paginationArray
    loadTheTable(pageNumber, paginationArray, displayTable = displayTable, resetData = resetData);
}

//the function that handles the changes to the pages
//it is invoked anytime a page button is clicked, or the
//nextPage/prevPage buttons are clicked
//it updates the pagination based on the new current page
function setThePagination(pageNumber, paginationArray) {
    const ulNextP = document.getElementById("nextPage").parentElement;
    const prevPage = document.getElementById("prevPage").parentElement;

    //remove the pages buttons, except for tne next and prev pages buttons
    while (prevPage.nextElementSibling.firstChild.id !== "nextPage") 
        prevPage.nextElementSibling.remove();

    //loop over the new page buttons values
    for (page of paginationArray) {
        //new li and a elements
        const liEle = document.createElement("li");
        liEle.classList.add("pageItem");
        ulNextP.parentElement.insertBefore(liEle, ulNextP);
        const liEleA = document.createElement("a");
        liEle.appendChild(liEleA);

        //set the value
        liEleA.textContent = page;
        //if the element is the default value (i.e. ...) then disable it
        if (page === paginationManager.placeHolderValue)
            liEleA.classList.add('disabled')
        else//else give it an event listener
            setPageButtonEventListener(liEleA);

        //if the current value is the current page then set it to .active
        //the reason i'm using timeout is because the .active class
        //transition effect does not work without it for some reason
        if (page == pageNumber) 
            setTimeout(() => { liEleA.classList.add('active'); },0)
    }

    //disable/enable the prevPage/nextPage buttons depending 
    //on whats the value of the new current page
    disableOnValue(document.getElementById("prevPage"), 1);
    disableOnValue(document.getElementById("nextPage"), paginationManager.totalPages());
}

//a listener for the page buttons when clicked
function setPageButtonEventListener(pageEle) {
    pageEle.addEventListener("click", () => {
        if (!pageEle.classList.contains('active')) {
            //set the new current page
            paginationManager.setCurrentPage(parseInt(pageEle.text));
            //set the pagination/display new data
            refreshTable(paginationManager.currentPage(), paginationManager.totalPages());
        }
    });
}

//returns an array that determines the values of the page buttons
//depending on the current pages and the total pages
//the total max values of shown page buttons is 7 excluding
//the prevPage/nextPage buttons
function paginationArrayFactory(pageNumber, totalPages) {
    const placeHolderValue = paginationManager.placeHolderValue;
    if (pageNumber > totalPages)//page number > total pages
        return 'bad pagination';
    if (totalPages <= 5)//total pages are 5 or less
        return [1, 2, 3, 4, 5].slice(0, totalPages);
    else {
        let theCore = [pageNumber - 1, pageNumber, pageNumber + 1]
        //for the start of the array
        if (pageNumber === 1 || pageNumber === 2)
            theCore = [1, 2, 3]
        else if (pageNumber === 3)
            theCore = [1].concat(theCore);
        else if (pageNumber === 4)
            theCore = [1, 2].concat(theCore);
        else
            theCore = [1, placeHolderValue].concat(theCore);

        //for the end of the array
        if ((pageNumber + 3) === totalPages)
            theCore = theCore.concat([totalPages - 1, totalPages]);
        else if ((pageNumber + 2) === totalPages)
            theCore = theCore.concat([totalPages]);
        else if ((pageNumber + 1) === totalPages)
            theCore = theCore.concat([]);
        else if (pageNumber === totalPages)
            theCore = [1, placeHolderValue, totalPages - 2, totalPages - 1, totalPages]
        else
            theCore = theCore.concat([placeHolderValue, totalPages]);

        return theCore;
    }
}

//toggle disable for prevPage/nextPage buttons based on value of the page
function disableOnValue(element, value) {
    if (paginationManager.currentPage() === value)
        toggleDisabled(element, true);
    else
        toggleDisabled(element, false);
}
//toggle disable for prevPage/nextPage 
function toggleDisabled(element, disable) {
    if (!element.classList.contains("disabled") && disable)
        element.classList.add("disabled");
    else if (element.classList.contains("disabled") && !disable)
        element.className = "";
}




//testing pagination array
function testPaginationArray(N) {
    const arr = generateSubarrays(N);
    for (i of arr)
        for (j of i)
            console.log(j, " : ", paginationArrayFactory(j[0], j[1]))
}

function generateSubarrays(N) {
    const result = [];
    for (let i = 1; i <= N; i++) {
        const subarray = [];
        for (let j = 1; j <= i; j++) {
            subarray.push([j, i]);
        }
        result.push(subarray);
    }
    return result;
}
function print2Darray(array) {
    for (i of array)
        for (j of i)
            console.log(j);
}