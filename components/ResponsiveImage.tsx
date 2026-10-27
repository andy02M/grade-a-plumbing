import Image from "next/image";
import type { ImgHTMLAttributes } from "react";
import dimensions from "@/data/image-dimensions.json";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string; alt: string };
const metadata = dimensions as Record<string, { width: number; height: number }>;

/** Keep existing image styling while serving correctly sized, cached variants. */
export function ResponsiveImage({ src, alt, width, height, sizes, loading, fetchPriority, ...props }: Props) {
  const canonical = src === "/assets/sharp/14_Emergency_Panel_Background.jpg"
    ? "/assets/sharp/05_Burst_Pipe_Repairs.jpg" : src;
  const size = canonical ? metadata[canonical] : undefined;
  if (!canonical || !size) return <img {...props} src={src} alt={alt} width={width} height={height} sizes={sizes} loading={loading} fetchPriority={fetchPriority} />;
  return <Image {...props} data-responsive-image="" src={canonical} alt={alt}
    width={Number(width) || size.width} height={Number(height) || size.height}
    sizes={sizes ?? "(max-width: 768px) 100vw, 600px"}
    loading={loading ?? (fetchPriority === "high" ? "eager" : "lazy")}
    fetchPriority={fetchPriority} />;
}
