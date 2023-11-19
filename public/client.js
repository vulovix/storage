const cloudName = "komplexica";
const apiKey = "236914873691586";

const form = document.querySelector("#uploadForm");
const galleryImages = document.querySelectorAll(".galleryImage");
const fileField = document.querySelector("#fileField");
const imageIcon = document.querySelector("#imageIcon");
const resetFormButton = document.querySelector("#resetFormButton");
const removeImageButton = document.querySelector("#removeImageButton");
const selectImageButton = document.querySelector("#selectImageButton");
const uploadImageButton = document.querySelector("#uploadImageButton");

if (galleryImages) {
  galleryImages.forEach((image) => {
    image?.addEventListener("click", function (e) {
      image.style = "opacity: 0.25";
      navigator.clipboard.writeText(e.target.src).then((value) => {
        setTimeout(() => {
          image.style = "opacity: 1";
        }, 250);
      });
    });
  });
}

if (imageIcon) {
  imageIcon.addEventListener("click", function () {
    fileField.click();
  });
}

if (selectImageButton) {
  selectImageButton.addEventListener("click", function (e) {
    e.preventDefault();
    fileField.click();
  });
}

if (removeImageButton) {
  removeImageButton.addEventListener("click", function (e) {
    if (window.confirm("Do you really want to remove selected image?")) {
      e.preventDefault();
      resetFormButton.click();
      imageIcon.src = "/static/image-icon.svg";
      removeImageButton.classList.add("hidden");
      uploadImageButton.classList.add("hidden");
      selectImageButton.classList.remove("hidden");
    }
  });
}

if (fileField) {
  fileField.addEventListener("change", function (e) {
    if (e.target.files[0]) {
      var file = e.target.files[0];
      var reader = new FileReader();
      reader.onloadend = function () {
        imageIcon.src = reader.result;
      };
      selectImageButton.classList.add("hidden");
      uploadImageButton.classList.remove("hidden");
      removeImageButton.classList.remove("hidden");
      reader.readAsDataURL(file);
    } else {
    }
  });
}

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const files = fileField.files[0];

    if (!files) {
      alert("Please select an image.");
    }

    const signatureResponse = await axios.get("/get-signature");

    const data = new FormData();
    data.append("file", files);
    data.append("api_key", apiKey);
    data.append("signature", signatureResponse.data.signature);
    data.append("timestamp", signatureResponse.data.timestamp);

    const cloudinaryResponse = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      data,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: function (e) {
          console.log(e.loaded / e.total);
        },
      }
    );

    const photoData = {
      public_id: cloudinaryResponse.data.public_id,
      version: cloudinaryResponse.data.version,
      signature: cloudinaryResponse.data.signature,
    };

    axios.post("/save-photo", photoData);
  });
}
