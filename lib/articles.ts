export type Article = { title:string; slug:string; metaTitle:string; metaDescription:string; author:string; publishedDate:string; updatedDate?:string; heroImage?:string; heroImageAlt?:string; excerpt:string; sections:{heading:string;paragraphs:string[];sourceUrls?:string[]}[]; relatedServices:string[]; relatedArticles:string[]; locationSlugs?:string[]; sources?:{title:string;url:string;checkedDate?:string}[]; faq:{question:string;answer:string}[]; status:"draft"|"published" };
import { hotWaterGuide } from './hot-water-guide';
import { blockedDrainsGuide } from './blocked-drains-guide';
import { sewerRepairGuide } from './sewer-repair-guide';
import { coburgBookingArticle } from './coburg-booking-article';
import generatedArticles from '../data/generated-articles.json';
export const articles: Article[] = [
 ...generatedArticles as Article[],
 coburgBookingArticle,
 hotWaterGuide,
 blockedDrainsGuide,
 sewerRepairGuide,
 {title:"Hot Water Repair vs Replacement",slug:"hot-water-repair-vs-replacement",metaTitle:"Hot Water Repair vs Replacement | Grade A Plumbing",metaDescription:"A review draft comparing hot water repair and replacement factors.",author:"Grade A Plumbing",publishedDate:"2026-09-20",excerpt:"Draft guide awaiting editorial review.",sections:[],relatedServices:["hot-water"],relatedArticles:["how-long-does-a-hot-water-system-last"],faq:[],status:"draft"}
];
export const publishedArticles=articles.filter(article=>article.status==="published");
export const articleBySlug=new Map(publishedArticles.map(article=>[article.slug,article]));
