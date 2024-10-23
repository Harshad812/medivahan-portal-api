import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';

const s3Client = new S3Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESSKEY_ID as string,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESSKEY as string,
  },
});

// Function to upload an image and generate a presigned URL
export const uploadImageBufferToS3 = async (
  buffer: Buffer,
  fileName: string
): Promise<string | void> => {
  try {
    // S3 upload parameters
    const contentType = mime.lookup(fileName);
    const uploadParams = {
      Bucket: 'medivahanprescription',
      Key: fileName,
      Body: buffer,
      ContentType: contentType.toString(),
    };

    // Upload the file to S3
    const uploadCommand = new PutObjectCommand(uploadParams);
    await s3Client.send(uploadCommand);
    console.log('Image successfully uploaded.');

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
