export class VersionManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersionManifestError";
  }
}

const isBuildMetadata = (value: unknown): value is AppBuildMetadata => {
  if (!value || typeof value !== "object") return false;

  const metadata = value as Record<string, unknown>;
  return [
    "deploymentId",
    "version",
    "commit",
    "buildTime",
    "buildNumber",
    "environment",
  ].every((key) => typeof metadata[key] === "string");
};

export class VersionService {
  constructor(
    private readonly versionUrl: string,
    private readonly currentVersion: AppBuildMetadata,
    private readonly fetchVersion: typeof fetch = fetch,
  ) {}

  getCurrentVersion() {
    return this.currentVersion;
  }

  isUpdateAvailable(remoteVersion: AppBuildMetadata) {
    return remoteVersion.deploymentId !== this.currentVersion.deploymentId;
  }

  async getRemoteVersion(signal?: AbortSignal) {
    const response = await this.fetchVersion(this.versionUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal,
    });

    if (!response.ok) {
      throw new VersionManifestError(
        `Version request failed with status ${response.status}`,
      );
    }

    const metadata: unknown = await response.json();
    if (!isBuildMetadata(metadata)) {
      throw new VersionManifestError("Invalid version manifest response");
    }

    return metadata;
  }
}
