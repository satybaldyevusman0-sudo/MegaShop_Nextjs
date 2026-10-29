/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: { '/api/**/*': ['./data/seed.json'] },
};
export default nextConfig;
