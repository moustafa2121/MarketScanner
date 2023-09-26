//provides helper functions and handles miscellaneous features

//the zoom in feature of the images in the table
(() => {
    //get the modal elements
    const modal = document.getElementById("imgModal");
    const imgModalClose = document.getElementById("imgModalClose");
    const modalImg = document.getElementById("imgModalContent");
    let modalActive = false;

    const closeModal = () => {
        modal.style.display = "none";
        modalActive = false;
    }
    //when the user clicks on <span> (x), close the modal
    imgModalClose.addEventListener("click", () => {
        closeModal();
    });
    //if a click happens on the document and the modal is open and
    //the click is not on the image, then close the modal
    document.addEventListener("click", event => {
        if (modalActive && event.target.id !== "imgModalContent")
            closeModal();
    });
    //same as the above but for the escape key
    document.addEventListener('keydown', event => {
        if (event.key == "Escape" && modalActive)
            closeModal();
    });

    //loop over the images of the table and assign the listener to toggle the modal
    for (img of document.querySelectorAll(".imgColumn img")) {
        img.addEventListener("click", function() {
            modal.style.display = "block";
            modalImg.src = this.src;
            //give some time till activating so the modal can pop up
            //if set true immediately it will deactivate due to the document click listener
            setTimeout(() => { modalActive = true; }, 100);
        });
    }
})();

//enables and disables the pagintion bar
//usually used when the data of the current/adjacent tables are
//loading/displayed the user does not jump between pages if data are unavailable
const enablePagination = (() => {
    const paginationHolder = document.getElementById("paginationHolder");
    return function (enable) {
        if (!enable)
            paginationHolder.classList.add("disabled")
        else 
            paginationHolder.classList.remove("disabled")
    }
})();

//takes two objects and compares them
//it returns true if they have matching number of keys, matching keys, and
//matching values. if one of these values is an object, it will call this function
//and recurse on the given two objects. No conditions are given regarding the depth
//of the recursion, so do not give objects with too many objects, depth-wise
function matchTwoObjects(objA, objB) {
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);

    //check the keys
    if (keysA.length !== keysB.length) 
        return false;
    for (const key of keysA) 
        if (!keysB.includes(key)) 
            return false;

    //check the values
    for (const key of keysA) {
        if (typeof (objA[key]) === "object") {
            if (!matchTwoObjects(objA[key], objB[key]))
                return false
        }
        else if (objA[key] !== objB[key])
            return false;
    }

    //if all checks out, return true
    return true;
}

//closure that provide a function to show page alerts
const pageAlert = (() => {
    const pageAlert = document.getElementById("pageAlert");
    pageAlert.querySelector("button").addEventListener("click", () => {
        pageAlert.style.display = "none";
    });

    return (messageText, fadeOutDuration=4000) => {
        pageAlert.querySelector("div").textContent = messageText;
        pageAlert.style.display = "inline-block";
        setTimeout(() => {
            pageAlert.style.display = "none";
        }, fadeOutDuration);
    }
})();


//+18 verification modal handler
(() => {
    const ageVerificationModal = document.getElementById("ageVerificationModal");
    //set up the modal
    const modal = new bootstrap.Modal(ageVerificationModal, {
        backdrop: 'static',
        keyboard: false,
    });
    //if the verification not in the localStroage, show the modal
    const ageVerify = localStorage.getItem("ageVerify")
    if (!ageVerify)
        modal.show();

    //if confirmation is clicked, remove the modal and make sure it won't appear again for this user
    ageVerificationModal.querySelector("#confirmAgeButton").addEventListener("click", () => {
        modal.hide();
        localStorage.setItem("ageVerify", "verified");
    });
    //if the age is not confirmed, buy a beard
    ageVerificationModal.querySelector("#cancelAgeButton").addEventListener("click", () => {
        location.assign('https://www.amazon.com/Realistic-Beard/s?k=Realistic+Beard');
    });
})();

//closure that handles the footer declaimer
//show the footer if it is not read by the user
//provide a listner for the footer button to close it and store in the
//local storage that it has beenr ead
(() => {
    const footerButton = document.querySelector("footer > button");
    if (!localStorage.getItem("footerRead")) {
        document.querySelector("footer").style.display = "block";
        footerButton.addEventListener("click", () => {
            document.querySelector("footer").style.display = "none";
            localStorage.setItem("footerRead", "read");
        });
    }
})();
