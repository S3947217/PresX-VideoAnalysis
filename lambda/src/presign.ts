import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME!;

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export async function generatePresignedUrl(
  userId: string,
  event: APIGatewayProxyEventV2
) {
  const body = JSON.parse(event.body || "{}");
  const contentType = body.contentType || "audio/wav";
  const extension = contentType === "audio/wav" ? "wav" : "bin";
  const key = `audio/${userId}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return json(200, { url, key });
}

export async function getAudioPlaybackUrl(userId: string, s3Key: string) {
  const expectedPrefix = `audio/${userId}/`;
  if (!s3Key.startsWith(expectedPrefix)) {
    return json(403, { error: "Access denied to this audio file" });
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 300 });

  return json(200, { url });
}
