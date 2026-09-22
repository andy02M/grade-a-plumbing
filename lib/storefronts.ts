export type StorefrontAddress = {
  streetAddress: string;
  addressLocality: string;
  addressRegion: "VIC";
  postalCode: string;
  addressCountry: "AU";
};

const storefront = (streetAddress: string, addressLocality: string, postalCode: string): StorefrontAddress => ({
  streetAddress, addressLocality, addressRegion: "VIC", postalCode, addressCountry: "AU"
});

export const storefronts: Record<string, StorefrontAddress> = {
  ballarat: storefront("60 Dana St", "Ballarat Central", "3350"), bendigo: storefront("60 Myers St", "Bendigo", "3550"),
  boxhill: storefront("60 Carrington Rd", "Box Hill", "3128"), brighton: storefront("60 Church St", "Brighton", "3186"),
  brunswick: storefront("60 Albert St", "Brunswick East", "3057"), dandenong: storefront("60 Princes Hwy", "Dandenong", "3175"),
  epping: storefront("High St", "Epping", "3076"), essendon: storefront("60 Napier St", "Essendon", "3040"),
  footscray: storefront("60 Leeds St", "Footscray", "3011"), frankston: storefront("60 Gertrude St", "Frankston", "3199"),
  geelong: storefront("60 Little Myers St", "Geelong", "3220"), glenwaverley: storefront("60 Snedden Dr", "Glen Waverley", "3150"),
  hawthorn: storefront("60 Lynch St", "Hawthorn", "3122"), kew: storefront("60 Denmark St", "Kew", "3101"),
  melbourne: storefront("235 Queen St", "Melbourne", "3000"), melton: storefront("60 McKenzie St", "Melton", "3337"),
  narrewarren: storefront("Link Rd", "Narre Warren", "3805"), pakenham: storefront("60 Henty St", "Pakenham", "3810"),
  pointcook: storefront("60 Boardwalk Blvd", "Point Cook", "3030"), preston: storefront("60 Garnet St", "Preston", "3072"),
  reservoir: storefront("60 Broadway", "Reservoir", "3073"), richmond: storefront("111 Gipps St", "Richmond", "3121"),
  ringwood: storefront("60 Maroondah Hwy", "Ringwood", "3134"), southmelbourne: storefront("60 Bank St", "South Melbourne", "3205"),
  stalbans: storefront("60 William St", "St Albans", "3021"), stkilda: storefront("60 St Kilda Rd", "St Kilda", "3182")
};

export function formatStorefrontAddress(address: StorefrontAddress) {
  return `${address.streetAddress}, ${address.addressLocality} ${address.addressRegion} ${address.postalCode}`;
}
