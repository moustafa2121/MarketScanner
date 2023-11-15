// responsible for updating the tables with the correct data
// also fetches and holds data of adjacent tables (i.e. tables of pages
// adjacent to the current page) for faster navigation for the user
//usually called on by the loadPage.js through its pageination listeners
//and when a filter is applied


//holds the tables that are adjacent to the current table
//this is to ensure that the pages that are visible to the
//user can be loaded quickly since they are stored in the frontend
//handles loading the adjacent tables, storing them, removing them,
//and fetching them if available
const adjacentTablesHandler = (function () {
    //holds the tableProducts in an array
    let tableProductsArr = [];
    return {
        //get the table of products if already saved in the array
        getTableProduct: (pageNumber) => {
            for (const tableProduct of tableProductsArr)
                if (tableProduct.pageNumber == pageNumber)
                    return tableProduct
            return null;
        },
        //used everytime (almost) the user navigates to a new page
        //adds/removes the adjacent table as needed and stores them in tableProductsArr
        loadAdjacentTables: async (paginationArray) => {
            //trim the pagination array to remove the dots (placeholder)
            //this array determines what tables to fetch as it represents
            //the pages button visible in the pagination bar for the user to navigate
            paginationArray = paginationArray.filter(item => item !== '...')

            //the intersection between the pagination array and the
            //productTables stored. the intersection represents pages
            //that are not to be fetched from the backend nor removed from the array
            //since they are both available in the array and adjacent to the current page
            const intersection = paginationArray.filter(item1 => tableProductsArr.some(item2 => item2.pageNumber === item1));

            //pages not in intersection and  are in tableProducts array will be discarded
            //as they are not adjacent to the current page
            tableProductsArr = tableProductsArr.filter(item => paginationArray.includes(item.pageNumber));

            //get the items that are only in the paginationArray but
            //not in intersection, they will be fetched and pushed to the array
            //based on the page and the filter (fetched in the getTableData function)
            for (const page of paginationArray) {
                //console.log("adjacent table: ", page);
                //if it is not in the intersection, fetch and add
                if (!intersection.includes(page)) {
                    //console.log("fetching: ", page);
                    tableProductsArr.push(await getTableData(page));
                }
            }
        },
        //a reference to to the tableProductsArr
        tableProductsArr: () => tableProductsArr,
        //reset the table, usually when refreshing the page or reseting the filter
        resetTable: () => { tableProductsArr = []; },
    };
})();

//holds a list of Product objects and the page number of the table they belong to
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
        this.name = item.name;
        this.websiteName = item.websiteName;
        this.productImageLink = item.productImageLink;
        this.itemLink = item.itemLink;
        this.baseUrl = item.baseUrl;
        this.icon = item.icon;
        this.brand = (item.brand.length === 0 || item.brand[0].length === 0) ? 'No Data' : item.brand;
        this.flavor = item.flavor.length === 0 ? 'No Data' : item.flavor;
        this.nic = item.nic.length === 0 ? 'No Data' : item.nic;
        this.size = item.size.length === 0 ? 'No Data' : item.size;
        this.vgpg = item.vgpg.length === 0 ? 'No Data' : item.vgpg;
    }
}

//displays the data of a given page number, usually invoked by pagination events/filtering
//the dispalyTable is set to false on the first page load since we do not want
//to dispaly the first page since it is already displayed
//however we want to invoke the adjacentTablesHolder.loadAdjacentTables function
//resetData is usually invoked when filter is applied
async function loadTheTable(pageNumber, paginationArray, displayTable=true, resetData=false) {
    //disable page navigation during fetching and displaying
    enablePagination(false);

    if (resetData)
        adjacentTablesHandler.resetTable();

    //for most cases the displayTable is true
    if (displayTable) {
        //try to get tableProduct from the frontend stroage
        let tableProducts = adjacentTablesHandler.getTableProduct(pageNumber)
        //if not found, then fetch the table, wait the response
        if (!tableProducts)
            tableProducts = await getTableData(pageNumber);

        //display the table data
        displayTableRows(tableProducts);
    }
    //load the adjacent tables as needed
    await adjacentTablesHandler.loadAdjacentTables(paginationArray);

    //re-enable the pagination
    enablePagination(true);
}

//given a page number, it will fetch data corresponding to it
//applies the filter that is currently saved in the filter handler
//returns a new TableProducts object
function getTableData(pageNumber) {
    let filterPattern = filterValuesHolder.currentFilterPattern()
    if (filterPattern !== "all")
        filterPattern = filterDataToGetFormat(filterPattern)
    return fetch(`/moredata/${pageNumber}/${filterPattern}`, {
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
function displayTableRows(tableProducts) {
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
//sets the associated classes
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