import type { Metadata } from "next";
import fs from "fs/promises";
import path from "path";

export const metadata: Metadata = {
  title: "MIT License",
  description: "License details for The Second Horse (MIT).",
};

async function loadLicenseText() {
  const licensePath = path.join(process.cwd(), "LICENSE");
  try {
    return await fs.readFile(licensePath, "utf8");
  } catch {
    return "MIT License\\n\\nLicense file not found.";
  }
}

export default async function LicensePage() {
  const licenseText = await loadLicenseText();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 text-neutral-100">
      <h1 className="text-2xl font-semibold text-white">MIT License</h1>
      <p className="mt-2 text-sm text-neutral-400">
        This project is distributed under the MIT License. The contents below are sourced from the LICENSE file in the repository.
      </p>
      <pre className="mt-6 whitespace-pre-wrap break-words rounded-lg border border-neutral-800 bg-neutral-900/70 p-4 text-sm text-neutral-50">
        {licenseText}
      </pre>
    </div>
  );
}
