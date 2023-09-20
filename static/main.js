//holds the tables that are adjacent to the current table
//this is to ensure that the pages that are visible to the
//user can be loaded quickly since they are saved locally
//handles loading the adjacent tables, storing them, removing them,
//and fetching them if available
const adjacentTablesHandler = (function () {
    //holds the tableProducts in an array
    let tableProductsArr = []
    return {
        //get the table product if available in the frontend memory
        getTableProduct: (pageNumber) => {
            for (const tableProduct of tableProductsArr)
                if (tableProduct.pageNumber == pageNumber)
                    return tableProduct
            return null;
        },
        //used everytime the user navigates to a new page
        //adds and removes the adjacent table as needed and stores them
        loadAdjacentTables: async (paginationArray) => {
            //trim the pagination array to remove the dots
            //this array determines what tables to fetch as it represents
            //the pages button visible in the pagination buttons 
            //for the user to navigate
            paginationArray = paginationArray.filter(item => item !== '...')

            //the intersection between the pagination array and the
            //productTables stored. the intersection represents pages
            //that are not to be added nor removed
            const intersection = paginationArray.filter(item1 => tableProductsArr.some(item2 => item2.pageNumber === item1));

            //intersection applied to the tableProducts. 
            //items not in intersection will be discarded
            tableProductsArr = tableProductsArr.filter(item => paginationArray.includes(item.pageNumber));
            //get the items that are only in the paginationArray but 
            //not in intersection, they will be fetched and added
            for (const page of paginationArray)
                //if it is not in the intersection, fetch and add
                if (!intersection.includes(page))
                    tableProductsArr.push(await getTableData(page));
        },
        //a reference to to the tableProductsArr
        tableProductsArr: () => { return tableProductsArr; },
    };
})();


//holds a list of Product objects and the page
//number of the table they belong to
class TableProducts {
    constructor(pageNumber, products) {
        this.pageNumber = pageNumber;
        this.products = [];
        for (const product of products)
            this.products.push(new Product(product));
    }
}
//holds the product
class Product {
    constructor(item) {
        this.itemLink = item.itemLink;
        this.name = item.name;
        this.productImageLink = item.productImageLink;
        this.brand = item.brand.length === 0 ? 'No Data' : item.brand;
        this.websiteName = item.websiteName;
        this.flavor = item.flavor.length === 0 ? 'No Data' : item.flavor;
        this.nic = item.nic.length === 0 ? 'No Data' : item.nic;
        this.size = item.size.length === 0 ? 'No Data' : item.size;
        this.vgpg = item.vgpg.length === 0 ? 'No Data' : item.vgpg;
        this.icon = item.icon;
        this.baseUrl = item.baseUrl;
    }
}

//this resets on refreshing the page, filter, and sort
//the dispalyTable is set to false on the first page load since we do not want
//to dispaly the first page since it is already loaded
//however we want to invoke the adjacentTablesHolder.loadAdjacentTables
async function loadTheTable(pageNumber, paginationArray, displayTable=true) {
    //disable page navigation during fetching and displaying
    enablePagination(false);

    //for most cakes the displayTable is true
    if (displayTable) {
        //try to get tableProduct from the frontend stroage
        let tableProducts = adjacentTablesHandler.getTableProduct(pageNumber)
        //if not found, then fetch the table, wait the response
        if (!tableProducts)
            tableProducts = await getTableData(pageNumber);

        //display the table
        displayTableRows(tableProducts);
    }
    //load the adjacent tables as needed
    await adjacentTablesHandler.loadAdjacentTables(paginationArray);

    //re-enable the pagination
    enablePagination(true);
}

//given a page number, it will fetch data corresponding to it
function getTableData(pageNumber) {
    return fetch(`/moredata/${pageNumber}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => response.json())
        .then(data => {
            return new TableProducts(pageNumber, data['returnValue']);
        })
        .catch(error => {
            console.log("error fetching:", error);
        });
}

//takes the tableProducts object for one page
//and displays them by replacing the values of the rows in the table
async function displayTableRows(tableProducts) {
    const tableRows = document.querySelectorAll('tbody tr');
    //for each product to display (row)
    tableProducts.products.forEach((_, i) => {
        //for each detail in the product (column)
        const currentRow = tableRows[i];
        const currentProduct = tableProducts.products[i];
        currentRow.className = 'visibleRow';

        //the image of the item
        currentRow.querySelector('.imgColumn img').setAttribute('src', currentProduct.productImageLink);

        //the icon of the store
        currentRow.querySelectorAll('.nameColumn a')[0].setAttribute("href", currentProduct.baseUrl);
        currentRow.querySelector('.nameColumn a img').setAttribute("src", currentProduct.icon);

        //the name of the product and its link
        currentRow.querySelectorAll('.nameColumn a')[1].textContent = currentProduct.name;
        currentRow.querySelectorAll('.nameColumn a')[1].setAttribute("href", currentProduct.itemLink);

        //other items
        displayCell(currentProduct.brand, currentRow.querySelector('.brandColumn'),
                    "brandColumn emptyCell",
                    "brandColumn");
        displayCell(currentProduct.flavor, currentRow.querySelector('.flavorColumn'),
                    "flavorColumn emptyCell",
                    "flavorColumn");
        displayCell(currentProduct.nic, currentRow.querySelector('.nicColumn'),
                    'nicColumn emptyCell centerText',
                    'nicColumn centerText');
        displayCell(currentProduct.size, currentRow.querySelector('.sizeColumn'),
                    'sizeColumn emptyCell centerText',
                    'sizeColumn centerText');
        displayCell(currentProduct.vgpg, currentRow.querySelector('.vgpgColumn'),
                    'vgpgColumn emptyCell centerText',
                    'vgpgColumn centerText');
    });

    //hide rows that exceed the available products to display
    //usually happens in the last page or first page and it
    //does not contain enough product to display the max
    //number of items per table page
    if (tableProducts.products.length < tableRows.length)
        for (let i = tableProducts.products.length; i < tableRows.length; i++)
            tableRows[i].className = 'hiddenRow';
}

//used to display the data of a cell
//sets it to No Data if it is empty
//sets the associate classes
function displayCell(passedProduct, currentCell, classListNeg, classListPos) {
    if (passedProduct === 'No Data') {
        currentCell.textContent = 'No Data';
        currentCell.className = classListNeg;
    }
    else {
        if (typeof(passedProduct) === "string")
            currentCell.textContent = passedProduct;
        else
            currentCell.textContent = passedProduct.join(', ');
        currentCell.className = classListPos;
    }
}

//fetches the data for the filter, saves in localstorage
//so they are only fetched when there is a change in the data
//todo: if there is a change in the backened, there has to be
//a signal to refresh the filter data, sent by the homepage
//todo: if one item returned, disable filter with declaimer can't filter one item
//todo: if no filter available, disable the filter button all together
const filterValuesHolder = (async function () {
    const filterButton = document.querySelector("#filterSortHolder button");
    const nicFilterContainer = document.querySelector("#nicFilterDiv .minMaxFiltersContainer");
    const sizeFilterContainer = document.querySelector("#sizeFilterDiv .minMaxFiltersContainer");
    const webFilterSelect = document.querySelector("#webFilterDiv select");
    const vgpgFilterSelect = document.querySelector("#vgpgFilterDiv select");
    const brandFilterSelect = document.querySelector("#brandFilterDiv select");

    filterButton.disabled = true;

    //todo: if changes or no data in local, fetch from db
    let filterData = localStorage.getItem("filterData")
    if (!filterData) {
        filterData = await getFilterData();
        localStorage.setItem("filterData", JSON.stringify(filterData));
    }
    else
        filterData = JSON.parse(filterData);

    //display
    const brandLst = filterData['brandList']
    const nicMin = filterData['nicMin']
    const nicMax = filterData['nicMax']
    const sizeMin = filterData['sizeMin']
    const sizeMax = filterData['sizeMax']
    const vgpgList = filterData['vgpgList']
    const websiteList = filterData['websiteList']

    //nic min and max
    let disabledInput = nicMin == nicMax ? true : false;
    nicFilterContainer.appendChild(setRangeInputElements("nicMin", nicMin, nicMax, "Min", disabledInput));
    nicFilterContainer.appendChild(setRangeInputElements("nicMax", nicMin, nicMax, "Max", disabledInput));

    //size min and max
    disabledInput = sizeMin == sizeMax ? true : false;
    sizeFilterContainer.appendChild(setRangeInputElements("sizeMin", sizeMin, sizeMax, "Min", disabledInput));
    sizeFilterContainer.appendChild(setRangeInputElements("sizeMax", sizeMin, sizeMax, "Max", disabledInput));

    //set the website filters
    setOptionElements(websiteList, webFilterSelect);
    //set the bgpg filter
    setOptionElements(vgpgList, vgpgFilterSelect);
    //set the brand filer
    setOptionElements(brandLst, brandFilterSelect);

    filterButton.disabled = false;
})();

const addFilterMessage = (function () {
    const filterMessageRef = document.querySelector("#filterMessage");
    const timeoutDefault = 2000;
    let timeoutRef = setTimeout(() => {
        filterMessageRef.style.display = "none";
    }, timeoutDefault);
    filterMessageRef.addEventListener("mouseover", function () {
        clearTimeout(timeoutRef);
    });
    filterMessageRef.addEventListener("mouseout", function () {
        clearTimeout(timeoutRef);
        timeoutRef = setTimeout(() => {
            filterMessageRef.style.display = "none";
        }, timeoutDefault)
    });

    return function (message, timeout = timeoutDefault) {
        filterMessageRef.textContent = message;
        filterMessageRef.title = message;
        filterMessageRef.style.display = "inline-block";
        clearTimeout(timeoutRef);
        timeoutRef = setTimeout(() => {
            filterMessageRef.style.display = "none";
        }, timeout);
    }
})();

function appendFilterBadge(text, prevSibling) {
    const spanContainer = document.createElement("span");
    spanContainer.classList.add("badge");
    spanContainer.classList.add("text-bg-secondary");
    prevSibling.parentNode.appendChild(spanContainer);

    const textContainer = document.createElement("span");
    textContainer.textContent = text;
    textContainer.title = text;
    spanContainer.appendChild(textContainer);

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("btn-close");
    spanContainer.appendChild(button);

    button.addEventListener("click", () => {
        button.closest(".badge").remove();
    })
}

function handleFilterChange(event, maxBadgesValue) {
    const newValue = event.target.value;
    if (newValue !== "Any") {
        const badges = this.parentNode.querySelectorAll(".badge");
        let invalidCheck = false;
        if (badges.length >= maxBadgesValue) {
            addFilterMessage("Max of " + maxBadgesValue + " selections for this filter is allowed.");
            invalidCheck = true;
        } else if (!invalidCheck) {
            for (badge of badges) {
                if (newValue == badge.textContent) {
                    addFilterMessage("item already selected");
                    invalidCheck = true;
                    break;
                }
            }
        }
        if (!invalidCheck) appendFilterBadge(newValue, this);
    }
}

//handles event listeners of the filters
//ensures the filters are valid
//submits the filter data to the backened
const filterFormHandler = (function () {
    const filterForm = document.getElementById("filterForm");
    const filterFormCloseButton = document.querySelector("#filterSortModal button.btn-close");
    const vgpgSelect = document.querySelector("#vgpgFilterDiv select");
    const brandSelect = document.querySelector("#brandFilterDiv select");

    vgpgSelect.addEventListener("change", function (event) {
        handleFilterChange.call(this, event, 2);
    });
    brandSelect.addEventListener("change", function (event) {
        handleFilterChange.call(this, event, 3);
    });

    filterForm.addEventListener("submit", (event) => {
        event.preventDefault();
        console.log("submit");

        const nameInput = filterForm.querySelector('#nameInput').value.trim() != "" ? filterForm.querySelector('#nameInput').value.trim() : "none";
        const flavorInput = filterForm.querySelector('#flavorInput').value.trim() != "" ? filterForm.querySelector('#flavorInput').value.trim() : "none";
        const brandInput = filterForm.querySelector('#brandInput').value;
        const nicMin = filterForm.querySelector("#nicMin").value.trim() != "" ? filterForm.querySelector("#nicMin").value.trim() : "none";
        const nicMax = filterForm.querySelector("#nicMax").value.trim() != "" ? filterForm.querySelector("#nicMax").value.trim() : "none";
        const sizeMin = filterForm.querySelector("#sizeMin").value.trim() != "" ? filterForm.querySelector("#sizeMin").value.trim() : "none";
        const sizeMax = filterForm.querySelector("#sizeMax").value.trim() != "" ? filterForm.querySelector("#sizeMax").value.trim() : "none";
        //const websiteSelect

        //if (nicMin < nicMax)

        console.log("Name: " + nameInput);
        console.log("flavor: " + flavorInput);
        console.log("nic: " + nicMin + " -> " + nicMax);
        console.log("size: " + sizeMin + " -> " + sizeMax);
        console.log("Brand: " + brandInput);


        //todo: reset values, if filter is applied it simply 
        //wipes active filters and refreshes the page

        //data are saved even if filter is closed
        //filterFormCloseButton.click();
    });
})();


//gets filter data
function getFilterData() {
    return fetch(`/filterfetcher`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => response.json())
        .then(data => {
            return data['filterValues'];
        })
        .catch(error => {
            console.log("error fetching:", error);
        });
}

function setOptionElements(dataList, parentSelect) {
    if (dataList.length === 0)
        parentSelect.disabled = true;
    else {
        for (opt of dataList) {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt;
            parentSelect.appendChild(option);
        }
    }
}

function setRangeInputElements(id_, min, max, placeholder, disabled) {
    const input = document.createElement("input");
    input.classList.add("form-control");
    input.setAttribute("type", "number");
    input.id = id_;
    input.setAttribute("min", min);
    input.setAttribute("max", max);
    input.setAttribute("placeholder", placeholder);
    input.disabled = disabled;
    return input;
}