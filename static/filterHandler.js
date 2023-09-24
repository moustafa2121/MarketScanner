//updates the filter modal data
//usually called after the filter data were udpated or at the beginning
const updateFilterModal_display = (() => {
    const nicFilterContainer = document.querySelector("#nicFilterDiv .minMaxFiltersContainer");
    const sizeFilterContainer = document.querySelector("#sizeFilterDiv .minMaxFiltersContainer");
    const webFilterSelect = document.querySelector("#webFilterDiv select");
    const vgpgFilterSelect = document.querySelector("#vgpgFilterDiv select");
    const brandFilterSelect = document.querySelector("#brandFilterDiv select");

    function removeChildren(parent) {
        while (parent.firstChild)
            parent.removeChild(parent.firstChild);
    }

    //display
    return (filterData) => {
        const brandLst = filterData['brandList']
        const nicList = filterData['nicList']
        const sizeList = filterData['sizeList']
        const vgpgList = filterData['vgpgList']
        const websiteList = filterData['websiteList']

        //remove the old elements first
        removeChildren(nicFilterContainer);
        removeChildren(sizeFilterContainer);
        removeChildren(webFilterSelect);
        removeChildren(vgpgFilterSelect);
        removeChildren(brandFilterSelect);

        //todo: add badges if they are found in the filter
        //if such badges are added, disable the filter

        //display new elements
        //nic min and max
        nicFilterContainer.appendChild(setRangeInputElements("nicMin", nicList, "Min"));
        nicFilterContainer.appendChild(setRangeInputElements("nicMax", nicList, "Max"));

        //size min and max
        sizeFilterContainer.appendChild(setRangeInputElements("sizeMin", sizeList, "Min"));
        sizeFilterContainer.appendChild(setRangeInputElements("sizeMax", sizeList, "Max"));

        //set the website filters
        setOptionElements(websiteList, webFilterSelect);
        //set the vgpg filter
        setOptionElements(vgpgList, vgpgFilterSelect);
        //set the brand filer
        setOptionElements(brandLst, brandFilterSelect);
    }
})();


//a closure fetches the data for the filter, saves in localstorage
//so they are only fetched when there is a change in the data
//todo: if there is a change in the backened, there has to be
//a signal to refresh the filter data, sent by the homepage
//todo: if no filter available (or only one item), disable the filter button all together
const filterValuesHolder = (function () {
    const filterButton = document.querySelector("#filterSortHolder button");
    enableFilterButton = (enable) => {
        if (enable) {
            filterButton.disabled = false;
            filterButton.parentNode.title = '';
        }
        else {
            filterButton.disabled = true;
            filterButton.parentNode.title = "Fetching filter data, hold!";
        }
    }
    let currentFilterPattern = "all";
    let currentFilterData = {};

    //initial call of the filter modal update after page refresh
    //filter pattern is the json produced after cleaning the filter form
    let filterPattern = localStorage.getItem("filterPattern");
    if (!filterPattern) 
        filterPattern = "all";
    else if (filterPattern !== "all") 
        filterPattern = JSON.parse(filterPattern);
    //update the modal and its display
    updateFilterModal(filterPattern, false);
       
    async function updateFilterModal(filterPattern, refreshTheTable = true) {
        enableFilterButton(false);

        let filterData = {}
        let newTotalPages = -1;
        console.log("passed pattern: ", filterPattern);
        
        if (filterPattern === "all") {
            filterData = localStorage.getItem("allFilterDict");
            if (!filterData) {//if all is not saved in the DB
                const returnedData = await getFilterData(filterPattern);
                filterData = returnedData["filterValues"];
                newTotalPages = parseInt(JSON.parse(returnedData["totalPages"]));
                //save to the storage
                localStorage.setItem("filterPattern", filterPattern);
                localStorage.setItem("filterData", JSON.stringify(filterData));
                //save for later use when Reset the form modal
                localStorage.setItem("allFilterDict", JSON.stringify(filterData));
            }
            else
                filterData = JSON.parse(filterData)
            currentFilterPattern = filterPattern;
            currentFilterData = filterData;
        }
        else if (filterPattern !== currentFilterPattern) {
            //if the passed filter pattern is not the same as the one in storage
            //than save it in the storage and set it to the current pattern
            //update the display of the modal

            //get stuff from DB
            console.log("fetching filter: ", filterPattern);
            const returnedData = await getFilterData(filterDataToGetFormat(filterPattern));
            filterData = returnedData["filterValues"];
            newTotalPages = parseInt(JSON.parse(returnedData["totalPages"]));
            newTotalItems = parseInt(JSON.parse(returnedData["totalItems"]));
            console.log("filter returned");
            console.log(filterData);

            //save the filter data
            localStorage.setItem("filterPattern", JSON.stringify(filterPattern));
            localStorage.setItem("filterData", JSON.stringify(filterData));
            currentFilterPattern = filterPattern;
            currentFilterData = filterData;
        }

        //update the display
        updateFilterModal_display(currentFilterData);
        if (refreshTheTable)
            onFilterChange(newTotalPages, newTotalItems);

        //clean up
        enableFilterButton(true);
    }

    //return
    return {
        updateFilterModal: updateFilterModal,
        currentFilterPattern: () => currentFilterPattern,
        resetFilterModal: () => {
            currentFilterPattern = "all";
            currentFilterData = localStorage.getItem("allFilterDict");
            localStorage.setItem("filterPattern", currentFilterPattern);
            localStorage.setItem("filterData", currentFilterData);
        }
    };
})();

//reset the filter on page refresh
window.addEventListener("unload", () => {
    //todo: confirm window
    filterValuesHolder.resetFilterModal();
});

//a closure that handles event listeners of the filters
//ensures the filter values are valid
//submits the filter data to the backened
//triggers displaying the returned filtered data
const filterFormHandler = (function () {
    //the form
    const filterForm = document.getElementById("filterForm");
    //form's close button
    const filterFormCloseButton = document.querySelector("#filterSortModal button.btn-close");
    //form's reset button
    const filterFormResetButton = document.querySelector("#formResetButton");
    //the select of both vgpg and brand have to be handled individually since
    //they both allow multiple selections
    //listener for each on change, add a badge to hold the selcted item (if valid)
    const vgpgSelect = document.querySelector("#vgpgFilterDiv select");
    const brandSelect = document.querySelector("#brandFilterDiv select");
    vgpgSelect.addEventListener("change", function (event) {
        handleSelectFilterChange.call(this, event, 2);
    });
    brandSelect.addEventListener("change", function (event) {
        handleSelectFilterChange.call(this, event, 3);
    });

    //a listener for the form's submit button
    //validates data, if valid return them to db
    filterForm.addEventListener("submit", async function(event) {
        event.preventDefault();
        console.log("submit form");

        //get all the filter data from the form
        const filterJson = {
            nameInput: filterForm.querySelector('#nameInput').value.trim() != "" ? filterForm.querySelector('#nameInput').value.trim() : "none",
            flavorInput: filterForm.querySelector('#flavorInput').value.trim() != "" ? filterForm.querySelector('#flavorInput').value.trim() : "none",
            nicMin: filterForm.querySelector("#nicMin").value.trim() != "" ? filterForm.querySelector("#nicMin").value.trim() : "-1",
            nicMax: filterForm.querySelector("#nicMax").value.trim() != "" ? filterForm.querySelector("#nicMax").value.trim() : "999",
            sizeMin: filterForm.querySelector("#sizeMin").value.trim() != "" ? filterForm.querySelector("#sizeMin").value.trim() : "-1",
            sizeMax: filterForm.querySelector("#sizeMax").value.trim() != "" ? filterForm.querySelector("#sizeMax").value.trim() : "999",
            websiteSelect: filterForm.querySelector("#webInput").value != "Any" ? filterForm.querySelector("#webInput").value : "none",
            brandInput: getSelectorBadges(filterForm.querySelector('#brandInput')),
            vgpgInput: getSelectorBadges(filterForm.querySelector('#vgpgInput')),
        }

        //validate the min and max values
        if ((filterJson.nicMin !== "-1" || filterJson.nicMax != "999" || filterJson.sizeMin != "-1" || filterJson.sizeMax != "999")
            && (filterJson.nicMin >= filterJson.nicMax || filterJson.sizeMin >= filterJson.sizeMax))
            addFilterMessage("Max value must be larger than min value.");
        else {//send to db
            //check if values in the json are filled by the user, 
            //otherwise delete them from the object
            for (key in filterJson) {
                if (filterJson[key] === "none" || filterJson[key] === "-1" || filterJson[key] === "999")
                    delete filterJson[key]
                else if (key === "brandInput" || key === "vgpgInput") {
                    if (filterJson[key].length == 0)
                        delete filterJson[key]
                    else
                        filterJson[key] = Array.from(filterJson[key]).map(value => value.querySelector("span").textContent.replace("/", ";"));
                }
            }
            //if the filter object is not empty, send it to the backend
            if (Object.keys(filterJson).length > 0) {
                filterFormCloseButton.click();
                filterValuesHolder.updateFilterModal(filterJson);
            }
        }
    });

    //reset the form by wiping the filter data in the localStorage
    //and later reloads the page, thus fetching filterData/pattern for all products
    filterFormResetButton.addEventListener("click", () => {
        console.log("click");
        filterValuesHolder.resetFilterModal();
        location.reload();
    });
})();


//gets filter data,
//if filterApplied='all' then filter data for all is returned
//other wise filter data will be returned for the filtered items
function getFilterData(filterApplied) {
    return fetch(`/filterfetcher/${filterApplied}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
        })
        .then(response => response.json())
        .then(data => {
            return data;
        })
        .catch(error => {
            console.log("error fetching:", error);
        });
}

function filterDataToGetFormat(filterPattern) {
    const paramLst = [];
    for (const key in filterPattern) {
        if (filterPattern.hasOwnProperty(key)) {
            const value = filterPattern[key];
            if (Array.isArray(value))
                paramLst.push(`${key}=${value.join(',')}`);
            else
                paramLst.push(`${key}=${value}`);
        }
    }
    return paramLst.join('&');
}

//closure that handles error messages in the filter modal
//holds a reference to the message display and returns a function 
//to display the message
const addFilterMessage = (function () {
    //ref to the message display
    const filterMessageRef = document.querySelector("#filterMessage");
    //message timeout
    const timeoutDefault = 2000;
    //holds the value of the timeout of the message (to remove it after a time)
    let timeoutRef = setTimeout(() => {
        filterMessageRef.style.display = "none";
    }, timeoutDefault);
    //these two events below keeps the message displayed when the user mouses over it
    filterMessageRef.addEventListener("mouseover", function () {
        clearTimeout(timeoutRef);
    });
    //when moust out, begin the countdown to remove the message
    filterMessageRef.addEventListener("mouseout", function () {
        clearTimeout(timeoutRef);
        timeoutRef = setTimeout(() => {
            filterMessageRef.style.display = "none";
        }, timeoutDefault)
    });

    //a function that takes a text and display it
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

//appends a badge after the <select> element (usually the brand and vgpg)
function appendFilterBadge(text, prevSibling) {
    //the main badge container
    const spanContainer = document.createElement("span");
    spanContainer.classList.add("badge");
    spanContainer.classList.add("text-bg-secondary");
    prevSibling.parentNode.appendChild(spanContainer);

    const textContainer = document.createElement("span");
    textContainer.textContent = text;
    textContainer.title = text;
    spanContainer.appendChild(textContainer);

    //button that can delete the badge when clicked
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.classList.add("btn-close");
    spanContainer.appendChild(closeButton);
    //deletes the badge
    closeButton.addEventListener("click", () => {
        closeButton.closest(".badge").remove();
    })
}

//the event function for both brand and vgpg selection filters
//it adds badges next to the <select> element, container the user's selection
//number of badges is limited by maxBadgesValue
function handleSelectFilterChange(event, maxBadgesValue) {
    const newValue = event.target.value;
    //any is the default value, ignore it if it is selected
    if (newValue !== "Any") {
        //get the current badges
        const badges = getSelectorBadges(this);
        //if all is valid, used later to append a badge
        let invalidCheck = false;
        //check if the user can still select items or is it at max allowed selection
        if (badges.length >= maxBadgesValue) {
            addFilterMessage("Max of " + maxBadgesValue + " selections for this filter is allowed.");
            invalidCheck = true;
        }
        else if (!invalidCheck) {
            //makes sure there is no duplicate in the selection
            for (badge of badges) {
                if (newValue == badge.textContent) {
                    addFilterMessage("item already selected");
                    invalidCheck = true;
                    break;
                }
            }
        }
        if (!invalidCheck)//all is valid, append badge
            appendFilterBadge(newValue, this);
    }
}

//returns the badges associated with filter elements of brandInput and vgpgInput
function getSelectorBadges(target) {
    return target.parentNode.querySelectorAll(".badge");
}

function setOptionElements(dataList, parentSelect) {
    if (dataList.length === 0)
        parentSelect.disabled = true;
    else {
        function setOption(value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            parentSelect.appendChild(option);
        }
        setOption("Any");
        for (opt of dataList)
            setOption(opt);
    }
}
 
function setRangeInputElements(id_, list, placeholder) {
    min = Math.min(list)

    const input = document.createElement("input");
    input.classList.add("form-control");
    input.setAttribute("type", "number");
    input.id = id_;
    input.setAttribute("placeholder", placeholder);
    if (list.length < 2)
        input.disabled = true;
    else {
        input.setAttribute("min", Math.min(...list));
        input.setAttribute("max", Math.max(...list));
    }
    return input;
}