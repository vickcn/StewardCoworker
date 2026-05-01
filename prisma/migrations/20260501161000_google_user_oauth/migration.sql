ALTER TABLE "User" ADD COLUMN "googleAccessToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleRefreshToken" TEXT;
ALTER TABLE "User" ADD COLUMN "googleTokenExpiresAt" INTEGER;
ALTER TABLE "User" ADD COLUMN "googleScope" TEXT;

ALTER TABLE "ProjectIntegration" ADD COLUMN "googleCredentialUserId" TEXT;
