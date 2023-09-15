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
    }
}


//this resets on refreshing the page, filter, and sort
async function loadTheTable(pageNumber) {
    //fecth data
    //todo: check first if the page data is in memory

    //disable page navigation fetching and displaying
    enablePagination(false);
    const tableProducts = await getTableData(pageNumber);
    //display the table
    displayTable(tableProducts);
    //re-enable the pagination
    enablePagination(true);


}

function getTableData(pageNumber) {
    return fetch(`/moredata/${pageNumber}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        //body: JSON.stringify({ test: `this is test ${pageNumber}` })
    })
        .then(response => response.json())
        .then(data => {
            console.log("got response fetching");
            data = data['returnValue']
            return new TableProducts(pageNumber, data);
        })
        .catch(error => {
            console.log("error fetching:", error);
        });
}


//takes the tableProducts object for one page
//and displays them by replacing the values of the rows in the table
function displayTable(tableProducts) {
    const tableRows = document.querySelectorAll('tbody tr');
    //for each product to display (row)
    tableProducts.products.forEach((_, i) => {
        //for each detail in the product (column)
        const currentRow = tableRows[i];
        const currentProduct = tableProducts.products[i];
        currentRow.className = 'visibleRow';

        currentRow.querySelector('.imgColumn img').setAttribute('src', currentProduct.productImageLink);
        currentRow.querySelector('.nameColumn a').textContent = currentProduct.name;
        currentRow.querySelector('.nameColumn a').setAttribute("href", currentProduct.itemLink);
        currentRow.querySelector('.brandColumn').textContent = currentProduct.brand;

        if (currentProduct.flavor === 'No Data') {
            currentRow.querySelector('.flavorColumn').textContent = 'No Data';
            currentRow.querySelector('.flavorColumn').className = "flavorColumn emptyCell";
        }
        else {
            currentRow.querySelector('.flavorColumn').textContent = currentProduct.flavor.join(', ');
            currentRow.querySelector('.flavorColumn').className = "flavorColumn";
        }

        if (currentProduct.nic === 'No Data') {
            currentRow.querySelector('.nicColumn').textContent = 'No Data';
            currentRow.querySelector('.nicColumn').className = 'nicColumn emptyCell centerText';
        }
        else {
            currentRow.querySelector('.nicColumn').textContent = currentProduct.nic.join(', ');
            currentRow.querySelector('.nicColumn').className = 'nicColumn centerText';
        }
        if (currentProduct.size === 'No Data') {
            currentRow.querySelector('.sizeColumn').textContent = 'No Data';
            currentRow.querySelector('.sizeColumn').className = 'sizeColumn emptyCell centerText';
        }
        else {
            currentRow.querySelector('.sizeColumn').textContent = currentProduct.size.join(', ');
            currentRow.querySelector('.sizeColumn').className = 'sizeColumn centerText';
        }

        if (currentProduct.vgpg === 'No Data') {
            currentRow.querySelector('.vgpgColumn').textContent = 'No Data';
            currentRow.querySelector('.vgpgColumn').className = 'vgpgColumn emptyCell centerText';
        }
        else {
            currentRow.querySelector('.vgpgColumn').textContent = currentProduct.vgpg.join(', ');
            currentRow.querySelector('.vgpgColumn').className = 'vgpgColumn centerText';
            }
    });

    //hide rows that exceed the available products to display
    //usually happens in the last page or first page and it
    //does not contain enough product to display the max
    //number of items per table page
    if (tableProducts.products.length < tableRows.length)
        for (let i = tableProducts.products.length; i < tableRows.length; i++)
            tableRows[i].className = 'hiddenRow';
}