-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Election" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Election_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Constituency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Constituency_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "constituencyId" TEXT NOT NULL,
    "electionId" TEXT NOT NULL,
    "party" TEXT NOT NULL,
    "winner" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'MLA',
    "gender" TEXT,
    "age" INTEGER,
    "education" TEXT,
    "profession" TEXT,
    "totalAssets" REAL,
    "totalLiabilities" REAL,
    "criminalCasesCount" INTEGER NOT NULL DEFAULT 0,
    "seriousCasesCount" INTEGER NOT NULL DEFAULT 0,
    "panStatus" TEXT,
    "address" TEXT,
    "fatherName" TEXT,
    "motherName" TEXT,
    "spouseName" TEXT,
    "childrenInfo" TEXT,
    "email" TEXT,
    "mobileNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Candidate_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Candidate_constituencyId_fkey" FOREIGN KEY ("constituencyId") REFERENCES "Constituency" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "movableAssets" REAL NOT NULL DEFAULT 0,
    "immovableAssets" REAL NOT NULL DEFAULT 0,
    "cash" REAL NOT NULL DEFAULT 0,
    "bankDeposits" REAL NOT NULL DEFAULT 0,
    "vehicles" TEXT,
    "jewellery" REAL NOT NULL DEFAULT 0,
    "agriculturalLand" REAL NOT NULL DEFAULT 0,
    "commercialBuildings" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Assets_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Liabilities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "bankLoans" REAL NOT NULL DEFAULT 0,
    "governmentDues" REAL NOT NULL DEFAULT 0,
    "taxDues" REAL NOT NULL DEFAULT 0,
    "otherLiabilities" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "Liabilities_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CriminalCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "serious" BOOLEAN NOT NULL DEFAULT false,
    "ipcSections" TEXT,
    "courtInfo" TEXT,
    "description" TEXT,
    CONSTRAINT "CriminalCase_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Affidavit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "pdfUrl" TEXT,
    "localFilePath" TEXT,
    CONSTRAINT "Affidavit_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Assets_candidateId_key" ON "Assets"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Liabilities_candidateId_key" ON "Liabilities"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "Affidavit_candidateId_key" ON "Affidavit"("candidateId");
