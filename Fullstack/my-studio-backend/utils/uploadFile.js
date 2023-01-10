const aws = require("aws-sdk");
const { aws_config } = require("./credentials");

const s3 = new aws.S3(aws_config);
const imageTypes = ["image/gif", "image/jpeg", "image/png"];
const fileType = require("file-type");
const { v4: uuidv4 } = require("uuid");

module.exports.uploadFile = (photoFile) =>
  new Promise(async (resolve, reject) => {
    const file = photoFile.split(",")[1];
    const fileBuffer = Buffer.from(file, "base64");
    const fileTypeInfo = await fileType.fromBuffer(fileBuffer);
    if (
      fileBuffer.length < 1024 * 1024 * 1024 && // file size to 1GB
      imageTypes.includes(fileTypeInfo.mime)
    ) {
      const fileName = `image_${uuidv4()}.${fileTypeInfo.ext}`;

      const fileKey = `images/${fileName}`;

      const bucket = "prod-mystudio";
      const params = {
        Body: fileBuffer,
        Key: fileKey,
        Bucket: bucket,
        ContentType: fileTypeInfo.mime,
        ACL: "public-read",
        ContentEncoding: "base64",
      };
      const s3Response = await s3.putObject(params).promise();
      console.log("s3Response", s3Response);
      const fileLink = `https://${bucket}.s3.amazonaws.com/${fileKey}`;
      resolve(fileLink);
    } else {
      console.log("Not a valid file type or file too big");
      reject(new Error("Not a valid file type or file too big."));
    }
  });
