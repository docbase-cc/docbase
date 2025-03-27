-- CreateTable
CREATE TABLE "Plugin" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "config" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "KnowledgeBase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);
