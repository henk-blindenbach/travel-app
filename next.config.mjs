/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Day-share cards load DejaVu TTFs at runtime via sharp/opentype. */
  outputFileTracingIncludes: {
    "/api/trip-days/[dayId]/share-card": ["./public/fonts/day-share/**/*"],
  },
};

export default nextConfig;
