import AWS from 'aws-sdk';
import mime from 'mime-types';

const s3 = new AWS.S3({
  accessKeyId: process.env.REACT_APP_AWS_ACCESSKEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESSKEY,
  region: process.env.REACT_APP_AWS_REGION,
});

export const uploadImageBufferToS3 = async (
  buffer: Buffer,
  fileName: string
): Promise<string> => {
  const bucketName = process.env.REACT_APP_AWS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error('Bucket name is not defined in environment variables.');
  }

  const contentType = mime.lookup(fileName);

  if (!contentType) {
    throw new Error('Unable to determine the MIME type for the file.');
  }

  const params = {
    Bucket: bucketName,
    Key: `uploads/${Date.now()}-${fileName}`,
    Body: buffer,
    ContentType: contentType,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log('Image successfully uploaded to S3:', data.Location);

    return data.Location;
  } catch (error) {
    console.error('Error uploading image to S3:', error);
    throw error;
  }
};
