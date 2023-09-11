
//the zoom in feature of the images
const _ = (function () {
    //get the modal elements
    const modal = document.getElementById("imgModal");
    const imgModalClose = document.getElementById("imgModalClose");
    const modalImg = document.getElementById("imgModalContent");
    let modalActive = false;

    //when the user clicks on <span> (x), close the modal
    imgModalClose.addEventListener("click", () => {
        modal.style.display = "none";
        modalActive = false;
    });
    //if a click happens on the document and the modal is open and
    //the click is not on the image, then close the modal
    document.addEventListener("click", event => {
        if (modalActive && event.target.id !== "imgModalContent") {
            modal.style.display = "none";
            modalActive = false;
        }
    });
    //same as the above but for the escape key
    document.addEventListener('keydown', event => {
        if (event.key == "Escape" && modalActive && event.target.id !== "imgModalContent"){
            modal.style.display = "none";
            modalActive = false;
        }
    });

    //loop over the images of the table
    for (img of document.querySelectorAll(".imgColumn img")) {
        img.addEventListener("click", function() {
            modal.style.display = "block";
            modalImg.src = this.src;
            //give some time till setting it to true so the modal can pop up
            //if set true immediately it will deactivate due to the document click listener
            setTimeout(() => { modalActive = true; }, 100);
        });
    }
})();