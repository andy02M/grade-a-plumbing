import type { MetadataRoute } from "next";
export default function manifest():MetadataRoute.Manifest{return{name:"Grade A Plumbing",short_name:"Grade A",description:"Local plumbing services",start_url:"/",display:"standalone",background_color:"#ffffff",theme_color:"#0758d6",icons:[{src:"/favicon.svg",sizes:"any",type:"image/svg+xml"}]};}
