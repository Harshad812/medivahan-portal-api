import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';

// Create an S3 Client
const s3Client = new S3Client({
  region: process.env.REACT_APP_AWS_REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESSKEY_ID as string,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESSKEY as string,
  },
});

export const uploadImageBufferToS3 = async (
  buffer: Buffer,
  fileName: string
): Promise<string> => {
  const bucketName = 'medivahanprescription';

  if (!bucketName) {
    throw new Error('Bucket name is not defined in environment variables.');
  }

  const contentType = mime.lookup(fileName);

  if (!contentType) {
    throw new Error('Unable to determine the MIME type for the file.');
  }

  const key = `uploads/${Date.now()}-${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);

    const location = `https://${bucketName}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${key}`;
    console.log('Image successfully uploaded to S3:', location);

    return location;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
};
