import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Define S3 client with credentials and region
const s3Client = new S3Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESSKEY_ID as string,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESSKEY as string,
  },
});

// Function to upload a base64 image and generate a presigned URL
export const uploadBase64ImageToS3 = async (
  base64Image: string,
  fileName: string
): Promise<string | void> => {
  try {
    const contentType = base64Image.match(/^data:(image\/\w+);base64,/)?.[1];
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // S3 upload parameters
    const uploadParams = {
      Bucket: 'medivahanprescription',
      Key: fileName,
      Body: imageBuffer,
      ContentType: contentType,
    };

    // Upload the file to S3
    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(uploadCommand);

    // Generate a presigned URL
    const getCommand = new GetObjectCommand({
      Bucket: 'medivahanprescription',
      Key: fileName,
    });

    // Presigned URL valid for 1 hour
    const preSignedUrl = await getSignedUrl(s3Client, getCommand);

    return preSignedUrl;
  } catch (err) {
    console.error('Error uploading image or generating URL:', err);
  }
};
