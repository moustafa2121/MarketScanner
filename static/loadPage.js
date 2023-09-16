/*
a closure that is used to hold the values of the 
pagination of the table
*/
paginationManager = (function () {
    //the current page number
    let pageNumber = 1;
    //the total pages available to go through
    const totalPages = parseInt(document.getElementById("totalPagesHolder").textContent);
    //used for pages that are beyond the current page to indicate
    //there are pages inbetween
    const placeHolderValue = '...'

    return {
        currentPage: () => { return pageNumber },
        setCurrentPage: (passedValue) => { pageNumber = passedValue; },
        totalPages: totalPages,
        placeHolderValue: placeHolderValue,
        pageInc: () => { return pageNumber += 1; },//increment the current page
        pageDec: () => { return pageNumber -= 1; },//decremeent the current page
    }
})();

//on page load
window.addEventListener("load", () => {
    //set the pagination depending on the current page
    refreshTable(paginationManager.currentPage(), paginationManager.totalPages, displayTable=false);

    //set the event listener for the previous page and next page buttons
    document.getElementById("prevPage").addEventListener("click", () => {
        //decrement the current page
        paginationManager.pageDec();
        //set the pagination
        refreshTable(paginationManager.currentPage(), paginationManager.totalPages);
    });
    document.getElementById("nextPage").addEventListener("click", () => {
        paginationManager.pageInc();
        refreshTable(paginationManager.currentPage(), paginationManager.totalPages);
    });
});

//refreshes the table based on the changes in page number
function refreshTable(pageNumber, totalPages, displayTable = true) {
    //the array of values from the first to the last button
    const paginationArray = paginationArrayFactory(pageNumber, totalPages);

    //set the pagination
    setThePagination(pageNumber, paginationArray);

    //invoke the loading of table and the data of the 
    //previous / next tables
    loadTheTable(pageNumber, paginationArray, displayTable=displayTable);
}

//the function that handles the changes to the pages
//it is invoked anytime a page button is clicked, or the
//nextPage/prevPage buttons are clicked
//it updates the pagination based on the new current page
function setThePagination(pageNumber, paginationArray) {
    //the parent of the pages buttons
    const ulPagination = document.getElementById("innerPagesHolder");
    //remove all previous page buttons
    while (ulPagination.firstChild)
        ulPagination.removeChild(ulPagination.lastChild);

    //loop over the new page buttons values
    for (page of paginationArray) {
        //new li and a elements
        const liEle = document.createElement("li");
        liEle.classList.add("pageItem");
        ulPagination.appendChild(liEle);
        const liEleA = document.createElement("a");
        liEle.appendChild(liEleA);

        //set the value
        liEleA.textContent = page;
        //if the elment is the default value (i.e. ...) then disable it
        if (page === paginationManager.placeHolderValue)
            liEleA.classList.add('disabled')
        else//else give it an event listener
            setPageButtonEventListener(liEleA);

        //if the current value is the current page then set it to .active
        if (page == pageNumber)
            liEleA.classList.add('active')
    }

    //disable/enable the prevPage/nextPage buttons depending 
    //on whats the value of the new current page
    disableOnValue(document.getElementById("prevPage"), 1);
    disableOnValue(document.getElementById("nextPage"), paginationManager.totalPages);
}

//sets a listener for the page buttons
function setPageButtonEventListener(pageEle) {
    pageEle.addEventListener("click", () => {
        if (!pageEle.classList.contains('active')) {
            //set the new current page
            paginationManager.setCurrentPage(parseInt(pageEle.text));
            //set the pagination
            refreshTable(paginationManager.currentPage(), paginationManager.totalPages);
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
        element.classList.add("disabled")
    else if (element.classList.contains("disabled") && !disable)
        element.classList.remove("disabled")
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