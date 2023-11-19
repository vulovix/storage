const cloudName = "komplexica";
const apiKey = "236914873691586";

document
  .querySelector("#upload-form")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const signatureResponse = await axios.get("/get-signature");

    const data = new FormData();
    data.append("file", document.querySelector("#file-field").files[0]);
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

    // console.log(cloudinaryResponse.data);

    const photoData = {
      public_id: cloudinaryResponse.data.public_id,
      version: cloudinaryResponse.data.version,
      signature: cloudinaryResponse.data.signature,
    };

    axios.post("/save-photo", photoData);
  });
