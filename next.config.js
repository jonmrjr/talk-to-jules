const { execSync } = require('child_process');

let commitHash;

try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim();
} catch (e) {
  console.error('Failed to get git commit hash:', e);
  commitHash = 'N/A';
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_COMMIT_HASH: commitHash,
  },
};

module.exports = nextConfig;
