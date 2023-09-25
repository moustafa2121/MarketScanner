//updates the filter modal data
//usually called after the filter data were udpated or at the beginning
//(acts as the third step in filter handling)
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

    //display the filter data
    //checks the filterPattern, if an input is in the filterPattern, diables it
    //if diableAll is true, disable all inputs, generally when only 1 element is displayed
    return (filterData, filterPattern, disableAll=false) => {
        console.log("filterGot: ", filterPattern);

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

        if (disableAll || Object.keys(filterPattern).includes("nameInput"))
            document.getElementById('nameInput').disabled = true;
        if (disableAll || Object.keys(filterPattern).includes("flavorInput"))
            document.getElementById('flavorInput').disabled = true;

        //display new elements
        //nic min and max
        nicFilterContainer.appendChild(setRangeInputElements("nicMin", nicList, "Min", disableAll, filterPattern, "nicMin"));
        nicFilterContainer.appendChild(setRangeInputElements("nicMax", nicList, "Max", disableAll, filterPattern, "nicMax"));

        //size min and max
        sizeFilterContainer.appendChild(setRangeInputElements("sizeMin", sizeList, "Min", disableAll, filterPattern, "sizeMin"));
        sizeFilterContainer.appendChild(setRangeInputElements("sizeMax", sizeList, "Max", disableAll, filterPattern, "sizeMax"));

        //set up the <select> elements, disables the select if the datalist is only 1 item
        //set the website filters
        setOptionElements(websiteList, webFilterSelect, (disableAll || Object.keys(filterPattern).includes("websiteSelect")));
        //set the vgpg filter
        setOptionElements(vgpgList, vgpgFilterSelect, (disableAll || Object.keys(filterPattern).includes("vgpgInput")));
        //set the brand filer
        setOptionElements(brandLst, brandFilterSelect, (disableAll || Object.keys(filterPattern).includes("brandInput")));
    }
})();

//a closure fetches the data for the filter, saves it in localstorage
//so they are only fetched when there is a change in the data
//pre-processor for submitting the form filter (acts as the second step in filter handling)
//todo: if there is a change in the backened, there has to be
//a signal to refresh the filter data, sent by the homepage
const filterValuesHolder = (function () {
    //the button that opens the filter
    const filterButton = document.querySelector("#filterSortHolder button");
    //enable/disables the button
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
    //current filter patter and data, used for comparisons
    let currentFilterPattern = "all";
    let currentFilterData = {};

    //initial call of the filter modal update after page refresh
    //filter pattern is the json produced after cleaning the filter form input
    let filterPattern = localStorage.getItem("filterPattern");
    //if not in local storage, set it to "all" representing all data filter
    if (!filterPattern)
        filterPattern = "all";
    else if (filterPattern !== "all")//filter in local storage but it is not "all"
        filterPattern = JSON.parse(filterPattern);
    //update the modal and its display
    updateFilterModal(filterPattern, false);

    //pre-processor for updating the display of the filter
    //(acts as the second step in filter handling)
    //called on when the page just starts, and by the modal when the user inputs
    //the filter input and presses on "Apply"
    //takes the filter pattern (after cleaning) and refreshTheTable which 
    //determines if the table's data should be refreshed and follow the filtered data
    async function updateFilterModal(filterPattern, refreshTheTable = true) {
        //disable the filter button
        enableFilterButton(false);

        let filterData = {}
        let newTotalPages = parseInt(document.getElementById("totalPagesHolder").textContent);
        let newTotalItems = parseInt(document.getElementById("resultsElement").textContent);
        console.log("passed pattern: ", filterPattern);

        //if the filter is for all
        if (filterPattern === "all") {
            //fetch the all filter data from storage
            filterData = localStorage.getItem("allFilterDict");
            if (!filterData) {//if all is not saved in the storage, fetch from db
                //get the filterData as per the pattern
                const returnedData = await getFilterData(filterPattern);
                filterData = returnedData["filterValues"];
                //total pages and items as per the filter
                newTotalPages = parseInt(JSON.parse(returnedData["totalPages"]));
                newTotalItems = parseInt(JSON.parse(returnedData["totalItems"]));

                //save to the storage
                localStorage.setItem("filterPattern", filterPattern);
                localStorage.setItem("filterData", JSON.stringify(filterData));
                //save for later use when Reset the form modal
                localStorage.setItem("allFilterDict", JSON.stringify(filterData));
            }
            else//all is saved, fetch it
                filterData = JSON.parse(filterData)

            //save it to the current
            currentFilterPattern = filterPattern;
            currentFilterData = filterData;

            //disable reset
            setTimeout(() => { filterFormHandler.enableResetButton(false); }, 500);
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

            if (newTotalItems !== 0) {
                //save the filter data if the newTotalItems are not 0
                localStorage.setItem("filterPattern", JSON.stringify(filterPattern));
                localStorage.setItem("filterData", JSON.stringify(filterData));
                currentFilterPattern = filterPattern;
                currentFilterData = filterData;
            }

            //re-enable the reset button
            setTimeout(() => { filterFormHandler.enableResetButton(true); }, 500);
        }
        //update the display of the filter if the values are not 0
        if (newTotalItems !== 0) {
            updateFilterModal_display(currentFilterData, currentFilterPattern, newTotalItems === 1);
            //update the table
            if (refreshTheTable)
                onFilterChange(newTotalPages, newTotalItems);
        }
        else{//0 items in filtered
            //todo: message says no items matched the filter
        }
        enableFilterButton(true);
    }

    //return
    return {
        currentFilterPattern: () => currentFilterPattern,
        updateFilterModal: updateFilterModal,
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
    filterValuesHolder.resetFilterModal();
});

//a closure that handles event listeners of the filters
//ensures the filter values are valid
//submits the filter for pre-processing
//(acts as the first step in filter handling)
//triggers displaying the returned filtered data
const filterFormHandler = (function () {
    let currentFilterJson = {};
    //the button that opens the filter
    const filterButton = document.querySelector("#filterSortHolder button");
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

    //when the filterButton is clicked, it saves the data before any changes by the user
    //this is required so if there are no changes, the filter is not applied
    filterButton.addEventListener("click", () => {
        currentFilterJson = {
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
    });


    //a listener for the form's submit button
    //(acts as the first step in filter handling)
    //validates data, if valid return them to db to get filtered data
    //also refreshes the display of the filter modal
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

        //if the form at the start of opening the filter modal and the form submitted when the
        //user clicks on the "apply" button do not match, show a message and keep the modal open
        console.log(JSON.parse(JSON.stringify(filterJson)));
        console.log(JSON.parse(JSON.stringify(currentFilterJson)));
        console.log("match: ", matchTwoObjects(JSON.parse(JSON.stringify(filterJson)), JSON.parse(JSON.stringify(currentFilterJson))));
        if (matchTwoObjects(JSON.parse(JSON.stringify(filterJson)), JSON.parse(JSON.stringify(currentFilterJson)))) {
            addFilterMessage.displayMessage("No changes detected.");
            return;
        }
                        
        //validate the min and max values
        if ((filterJson.nicMin !== "-1" || filterJson.nicMax != "999" || filterJson.sizeMin != "-1" || filterJson.sizeMax != "999")
            && (filterJson.nicMin >= filterJson.nicMax || filterJson.sizeMin >= filterJson.sizeMax))
            addFilterMessage.displayMessage("Max value must be larger than min value.");
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
            //if the filter object is not empty, update the filter modal
            if (Object.keys(filterJson).length > 0) {
                filterFormCloseButton.click();

                filterValuesHolder.updateFilterModal(filterJson);
            }
        }
    });
    //event listener for clicking the close (X) button on ther modal
    //it already closes the form as set by the HTML and bootstrap
    //this listener, however, is to set the message of the filter modal to none
    //even though it times out by itself after 2 seconds, however, if the user gets a message
    //and then closes the filter and opens it within < 2, the message is still there, and that's ugly'
    filterFormCloseButton.addEventListener("click", () => {
        addFilterMessage.messageDisplayNone();
    });
    //reset the form by wiping the filter data in the localStorage
    //and later reloads the page, thus fetching filterData/pattern for all products
    filterFormResetButton.addEventListener("click", () => {
        filterValuesHolder.resetFilterModal();
        location.reload();
    });
    return {
        enableResetButton: (value) => filterFormResetButton.disabled = !value,
    }
})();


//gets filter data,
//if filterApplied='all' then filter data for all is returned
//otherwise filter data will be returned for the filtered items
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

//closure that handles error messages in the filter modal
//such messages may be produced based on user's wrong input
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
    return {
        displayMessage: (message, timeout = timeoutDefault) => {
            filterMessageRef.textContent = message;
            filterMessageRef.title = message;
            filterMessageRef.style.display = "inline-block";
            clearTimeout(timeoutRef);
            timeoutRef = setTimeout(() => {
                filterMessageRef.style.display = "none";
            }, timeout);
        },
        messageDisplayNone: () => filterMessageRef.style.display = "none",
    }
})();

//appends a badge after the <select> element (usually the brand and vgpg)
//it is called after one of the <select> options are clicked (if the option is valid)
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
            addFilterMessage.displayMessage("Max of " + maxBadgesValue + " selections for this filter is allowed.");
            invalidCheck = true;
        }
        else if (!invalidCheck) {
            //makes sure there is no duplicate in the selection
            for (badge of badges) {
                if (newValue == badge.textContent) {
                    addFilterMessage.displayMessage("item already selected");
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

//fills a <select> element with options in the given dataList
//disables the select if the number of elements < 2
function setOptionElements(dataList, parentSelect, disableAll=false) {
    if (dataList.length === 0)
        parentSelect.disabled = true;
    else {
        function setOption(value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            parentSelect.appendChild(option);
        }
        if (dataList.length < 2 || disableAll) {
            setOption(dataList[0]);
            parentSelect.disabled = true;
        }
        else {
            parentSelect.disabled = false;
            setOption("Any");
            for (opt of dataList)
                setOption(opt);
        }
    }
}

//adds the min/max elements of both nic and size
function setRangeInputElements(id_, list, placeholder, disableAll=false, filterPattern, key) {
    const input = document.createElement("input");
    input.classList.add("form-control");
    input.setAttribute("type", "number");
    input.id = id_;
    if (disableAll || list.length < 2)
        input.disabled = true;
    else if (Object.keys(filterPattern).includes(key)) {
        input.value = filterPattern[key];
        input.disabled = true;
    }
    else {
        input.disabled = false;
        input.setAttribute("placeholder", placeholder);
        input.setAttribute("min", Math.min(...list));
        input.setAttribute("max", Math.max(...list));
    }
    return input;
}

//converts filterPattern to GET format to be sent to the db
function filterDataToGetFormat(filterPattern) {
    const paramLst = [];
    for (const key in filterPattern) {
        if (filterPattern.hasOwnProperty(key)) {
            const value = filterPattern[key];
            if (Array.isArray(value)) {
                paramLst.push(`${key}=${value.map(target => target.replace("&", "*")).join(',')}`);
            }
            else {
                paramLst.push(`${key}=${value.replace("&", "*") }`);
            }
        }
    }
    return paramLst.join('&');
}